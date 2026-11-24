# Triển khai frontend INTERVIA lên AWS (phongvan.app)

Template: `infra/aws/phongvan-frontend.yaml` · Pipeline: `.github/workflows/deploy-aws.yml`

## Kiến trúc

```
Trình duyệt ──HTTPS──▶ phongvan.app (Elastic IP)
                         │  EC2 t3.small, Ubuntu 24.04
                         │  ┌──────────────┐     ┌──────────────────────────┐
                         └─▶│ Caddy :80/443 │────▶│ intervia-web (Next.js)   │
                            │ Let's Encrypt │     │ node server.js :3000     │
                            └──────────────┘     └──────────────────────────┘
Trình duyệt ──HTTPS──▶ NEXT_PUBLIC_API_URL (backend interview-prep-core, deploy riêng)
Trình duyệt ──HTTPS──▶ ai.phongvan.app (stack GPU VieNeu + Qwen, deploy riêng)

GitHub Actions (push main)
  test + tsc ─▶ docker build ─▶ ECR (:<sha>, :latest) ─▶ SSM Run Command ─▶ intervia-deploy <sha>
                                    (OIDC, không có access key)               (tự rollback nếu lỗi)
```

- **Không dùng S3/CloudFront tĩnh** vì layout gốc gọi `cookies()` và `middleware.ts` đọc cookie, nên mọi trang đều render ở server.
- **Không dùng App Runner** vì AWS ngừng nhận khách hàng mới từ 30/04/2026. **Không dùng ECS + ALB** vì riêng ALB đã tốn khoảng 16 USD/tháng.
- `NEXT_PUBLIC_*` được gắn vào bundle **lúc build**, nên CI build image riêng cho production.
- Elastic IP được gắn vào network interface trước khi máy khởi động, nên IP không đổi khi Stop/Start. Bản ghi DNS chỉ cần tạo một lần.
- CI không SSH vào máy. Role của GitHub chỉ được push vào đúng một repo ECR và chạy đúng một SSM document; document đó chỉ nhận một tag ảnh hợp lệ (`^[A-Za-z0-9._-]{1,128}$`).

## Chi phí ước tính (ap-southeast-1, On-Demand)

| Thành phần | Giá tham khảo | Mỗi tháng |
|---|---|---|
| EC2 t3.small (t3.micro) | 0,0264 (0,0132) USD/giờ | ~19,3 (~9,6) USD |
| Public IPv4 / Elastic IP | 0,005 USD/giờ | ~3,7 USD |
| EBS gp3 20 GiB | | ~2 USD |
| ECR (15 ảnh × ~100 MB nén) | 0,10 USD/GB | ~0,2 USD |

Tổng khoảng **25 USD/tháng** với t3.small, hoặc **15 USD/tháng** với t3.micro. Máy này chạy 24/7, khác với máy GPU (bật và tắt bằng tay). Hãy tính phần này vào budget 150 USD.

## Các bước triển khai (làm lần lượt)

### 1. Tạo stack

AWS Console → CloudFormation → *Create stack* → *Upload a template file* → chọn `phongvan-frontend.yaml`. Nên chọn Region **ap-southeast-1 (Singapore)**, cùng Region với stack GPU.

| Tham số | Giá trị |
|---|---|
| `DomainName` | `phongvan.app` |
| `RedirectWww` | `true` (www.phongvan.app chuyển hướng về phongvan.app) |
| `HostedZoneId` | Để trống nếu DNS không ở Route 53 |
| `GitHubOidcProviderArn` | Để trống. Nếu IAM → *Identity providers* đã có `token.actions.githubusercontent.com` thì dán ARN của nó vào, vì mỗi tài khoản chỉ có một provider này |
| `KeyPairName` / `SshCidr` | Để trống (vào máy bằng Session Manager) |

Bước *Review* phải tick **I acknowledge that AWS CloudFormation might create IAM resources**.

CLI tương đương:

```bash
aws cloudformation deploy --region ap-southeast-1 \
  --stack-name intervia-frontend \
  --template-file infra/aws/phongvan-frontend.yaml \
  --capabilities CAPABILITY_IAM
```

### 2. Trỏ DNS

Mở tab **Outputs**, xem dòng `DnsRecordsToCreate`. Ở nơi quản lý tên miền phongvan.app, tạo:

| Loại | Tên | Giá trị |
|---|---|---|
| A | `@` (phongvan.app) | `PublicIp` |
| A | `www` | `PublicIp` |

Bản ghi `ai` (máy GPU) giữ nguyên. Nếu dùng Cloudflare, để **DNS only** (mây xám) để Caddy tự xin chứng chỉ. Caddy sẽ tự thử lại cho tới khi DNS có hiệu lực.

Kiểm tra: `nslookup phongvan.app` phải trả về đúng `PublicIp`.

### 3. Cấu hình GitHub (Settings → Environments → New environment → `production`)

1. **Deployment branches**: chọn *Selected branches* → thêm `main`, để chỉ main được deploy.
2. **Environment variables**:

| Biến | Lấy từ | Ví dụ |
|---|---|---|
| `AWS_REGION` | Output `DeploymentRegion` | `ap-southeast-1` |
| `AWS_STACK_NAME` | Output `StackName` | `intervia-frontend` |
| `AWS_DEPLOY_ROLE_ARN` | Output `GitHubDeployRoleArn` | `arn:aws:iam::…:role/…` |
| `NEXT_PUBLIC_API_URL` | URL HTTPS của backend | `https://api.phongvan.app` |
| `NEXT_PUBLIC_SOCKET_URL` | Không bắt buộc, mặc định bằng API URL | |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | `…apps.googleusercontent.com` |
| `NEXT_PUBLIC_RAG_API_URL` | Không bắt buộc | |

Không có biến nào là bí mật (frontend không chứa secret), nên dùng *Variables*, không cần *Secrets*. Output `GitHubVariablesCommand` có sẵn lệnh `gh` để đặt ba biến AWS.

3. **Google OAuth**: trong OAuth Client, thêm `https://phongvan.app` và `https://www.phongvan.app` vào *Authorized JavaScript origins*. Thiếu bước này thì đăng nhập Google sẽ báo `origin_mismatch`.

### 4. Deploy

Merge nhánh `feat/aws-deploy` vào `main` (hoặc push lên `main`). Tab **Actions** chạy *Deploy frontend to AWS (phongvan.app)* với 3 job:

1. **Test and type-check**: `pnpm test`, `tsc --noEmit`.
2. **Build and push image**: build Dockerfile với các biến `NEXT_PUBLIC_*`, push `:<commit sha>` và `:latest` lên ECR.
3. **Deploy to EC2**: chạy SSM document. Máy kéo ảnh về, khởi động lại container `web` và chờ healthcheck. Nếu không healthy sau khoảng 3 phút thì **tự quay về bản trước**. Cuối cùng chạy smoke test `/`, `/login`, `/pricing`.

Trong lúc đổi container (vài giây), Caddy trả về trang "INTERVIA đang cập nhật…" (mã 503).

### 5. Rollback

Actions → *Deploy frontend to AWS* → **Run workflow** → nhập `image_tag` là SHA của commit muốn quay về (xem trong ECR). Job build được bỏ qua, chỉ chạy deploy.

Nút *Run workflow* chỉ hiện khi file workflow đã có trên nhánh mặc định của repo (hiện là `develop`).

## Vận hành

```bash
# Vào máy (không cần SSH). Cài Session Manager plugin cho AWS CLI trước.
aws ssm start-session --target <InstanceId> --region ap-southeast-1

sudo tail -n 100 /var/log/intervia-bootstrap.log           # log lần khởi động đầu
cd /opt/intervia && sudo docker compose --env-file release.env ps
sudo docker logs --tail 100 intervia-web                   # log Next.js
sudo docker logs --tail 100 intervia-caddy                 # log HTTPS / chứng chỉ
cat /opt/intervia/release.env                              # ảnh đang chạy
sudo /usr/local/sbin/intervia-deploy <tag>                 # deploy tay
```

| Đường dẫn trên máy | Nội dung |
|---|---|
| `/opt/intervia/docker-compose.yml` | Hai service `web` và `caddy` |
| `/opt/intervia/caddy/Caddyfile` | Domain, HTTPS, chuyển hướng www |
| `/opt/intervia/release.env` | `WEB_IMAGE=` ảnh đang chạy |
| `/usr/local/sbin/intervia-deploy` | Kéo ảnh, chạy, chờ healthy, rollback |
| `intervia.service` (systemd) | Bật lại stack sau khi khởi động máy |

## Lưu ý

- **UserData chỉ chạy ở lần khởi động đầu.** Sửa phần bootstrap trong template rồi update stack sẽ không cấu hình lại máy đang chạy. Muốn áp dụng thì sửa file trên máy qua Session Manager, hoặc thay máy mới (ví dụ đổi `AmiId`). Elastic IP được giữ nguyên.
- **Backend phải dùng HTTPS** (`NEXT_PUBLIC_API_URL=https://…`), nếu không trình duyệt sẽ chặn mixed content. Backend cũng phải cho phép CORS từ `https://phongvan.app`, và Socket.IO phải cho phép origin này.
- Trang phỏng vấn dùng micro và camera, vốn chỉ hoạt động trên HTTPS. Caddy đã lo phần này.
- Xoá stack sẽ xoá luôn ECR repo cùng các ảnh (`EmptyOnDelete`) và trả lại Elastic IP. Bản ghi DNS tạo tay phải tự xoá.

## Kiểm thử đã chạy trước khi bàn giao

- `pnpm build` với `output: "standalone"`, sau đó chạy `node server.js` như trong image. Kết quả: `/` trả 200, trang cần đăng nhập trả 307 về `/login`, file tĩnh và `public/` trả 200, middleware trả `Location` tương đối nên vẫn đúng khi đứng sau Caddy.
- `cfn-lint` cho template; `actionlint` (kèm shellcheck) cho workflow; `shellcheck` cho script bootstrap; `docker compose config` cho file compose.
- Giả lập `intervia-deploy`: deploy thành công, bản lỗi thì tự rollback, tag chứa ký tự lạ (`x;rm -rf /`) bị từ chối.
