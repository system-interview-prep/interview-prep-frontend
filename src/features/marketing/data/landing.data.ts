export interface EvidenceItem {
  requirement: string;
  category: "must_have" | "nice_to_have" | "constraints";
  categoryLabel: "Bắt buộc" | "Khuyến khích" | "Ràng buộc";
  status: "matched" | "missing";
  statusLabel: "Đã khớp" | "Thiếu minh chứng";
  snippets: string[];
}

export const HERO_DATA = {
  badge: "AI CAREER COACH",
  titleHeadline: "Biết mình hợp ở đâu.",
  titleSub: "Luyện đúng thứ cần luyện.",
  editorialLine: "Bạn không cần luyện nhiều hơn. Bạn cần luyện đúng hơn.",
  description:
    "INTERVIA kết nối CV, vị trí mục tiêu và buổi phỏng vấn thành một hành trình duy nhất — để bạn hiểu vì sao mình phù hợp và biết nên luyện gì tiếp theo.",
  primaryCta: "Bắt đầu miễn phí",
  secondaryCta: "Xem demo",
  pipelineCandidate: {
    name: "NGUYỄN MINH AN",
    title: "Backend Developer",
    snippet: "Designed & deployed 14 RESTful APIs with Spring Boot microservices and AWS Cloud.",
    skills: ["Spring Boot", "PostgreSQL", "AWS"],
  },
  pipelineRequirement: "REST API / Spring Boot",
  pipelineMatchedCount: 6,
  pipelineTotalCount: 8,
  pipelineTargetRole: "Senior Backend Engineer",
  pipelineQuestionPrompt: "Bạn đã từng tối ưu API hoặc SQL query trong tình huống áp lực như thế nào?",
};

export const PROBLEM_DATA = {
  title: "Finding a job shouldn't feel like guessing.",
  editorialHeadline: "Bạn đã nộp CV. Rồi chờ đợi.",
  editorialBody:
    "Tìm kiếm công việc mơ ước không nên là một trò chơi may rủi. Thay vì tự hỏi nhà tuyển dụng đang tìm gì, hãy nhìn rõ bức tranh năng lực của chính mình.",
  questions: [
    "CV của mình đã thể hiện đúng năng lực chưa?",
    "Nhà tuyển dụng có thấy khoảng trống nào trong hồ sơ?",
    "Họ sẽ hỏi gì trong buổi phỏng vấn sắp tới?",
  ],
};

export const CAREER_CLASSIFICATION_DATA = {
  headline: "CV của bạn đang nói gì?",
  body: "INTERVIA phân tích các thực thể kinh nghiệm trong CV để chỉ ra định hướng chuyên môn thực sự của bạn.",
  disclaimer: "Định hướng nghề nghiệp được suy luận từ bằng chứng trong CV, không phải quyết định tuyển dụng.",
};

export const TARGET_ROLE_DATA = {
  headline: "Bạn muốn đi đâu tiếp theo?",
  body: "Chọn vị trí mong muốn để so khớp tiêu chuẩn và luyện tập đúng trọng tâm câu hỏi của ngành.",
  primaryRole: {
    title: "Senior Java Backend Engineer",
    categoryLabel: "Backend Development",
    requirements: [
      { text: "RESTful APIs Spring Boot Microservices", matched: true },
      { text: "AWS EC2 & S3 Cloud Deployment", matched: true },
      { text: "PostgreSQL Query & Index Optimization", matched: true },
      { text: "Kubernetes Cluster Management", matched: false },
    ],
  },
};

export const EVIDENCE_SHOWCASE_DATA = {
  headline: "Không chỉ biết “khớp”. Biết vì sao khớp.",
  body: "Định vị trực tiếp đoạn văn bản minh chứng (snippet) trong CV đằng sau mỗi yêu cầu tuyển dụng.",
};

export const INTERVIEW_SHOWCASE_DATA = {
  headline: "Luyện cuộc trò chuyện. Không chỉ luyện câu trả lời.",
  body: "Bật micro đàm thoại thời gian thực với AI Coach. Luyện phản xạ tự nhiên bám sát JD thực tế.",
  roleTitle: "Senior Java Backend Engineer",
  questionNumber: "03 / 08",
  questionText:
    "Hãy kể về một sự cố nghẽn cổ chai SQL backend bạn từng xử lý và cách bạn đưa ra trade-off trong kiến trúc?",
  indicators: [
    { label: "Độ rõ ràng", score: "88/100", status: "Tốt" },
    { label: "Cấu trúc STAR", score: "Hoạt động", status: "Mạnh" },
    { label: "Độ sâu Kỹ thuật", score: "Cần số liệu", status: "Gợi ý" },
  ],
};

export const HUMAN_MOMENT_DATA = {
  quote: "“Bạn không cần biết mọi câu trả lời. Bạn chỉ cần hiểu kinh nghiệm của mình và kể nó rõ ràng hơn.”",
  author: "INTERVIA AI Coach",
};

export const PRODUCT_MANUAL_TABS = [
  {
    id: "upload",
    stepNumber: "01",
    title: "Tải CV",
    shortTitle: "Upload CV",
    description: "Tải file CV. AI tự động đọc hiểu dự án, kỹ năng và thực thể kinh nghiệm thực tế.",
    timeEstimate: "~10s",
  },
  {
    id: "match",
    stepNumber: "02",
    title: "Chọn vị trí mục tiêu",
    shortTitle: "Vị trí mục tiêu",
    description: "Dán JD công việc. Hệ thống bóc tách các tiêu chuẩn Bắt buộc và Khuyến khích.",
    timeEstimate: "~15s",
  },
  {
    id: "understand",
    stepNumber: "03",
    title: "Hiểu minh chứng đối chiếu",
    shortTitle: "Minh chứng",
    description: "Xem rõ lý do đằng sau tỷ lệ khớp: Đoạn bằng chứng có sẵn và các khoảng trống cần chuẩn bị.",
    timeEstimate: "~20s",
  },
  {
    id: "practice",
    stepNumber: "04",
    title: "Luyện phỏng vấn thoại AI",
    shortTitle: "Phỏng vấn thoại",
    description: "Đàm thoại 2 chiều với AI Interviewer. Tương tác phản xạ và trả lời bằng giọng nói.",
    timeEstimate: "~5 phút",
  },
  {
    id: "improve",
    stepNumber: "05",
    title: "Sửa và hoàn thiện",
    shortTitle: "Cải thiện",
    description: "Nhận báo cáo STAR minh bạch, biết chính xác điểm nào cần tinh chỉnh cho lần tới.",
    timeEstimate: "~30s",
  },
];

export const CAREER_JOURNEY_STEPS = [
  {
    step: "01",
    title: "Upload your CV",
    description: "Tải file CV (PDF/Word). AI bóc tách thực thể kinh nghiệm, dự án và kỹ năng kỹ thuật của bạn.",
    highlight: "Bóc tách thực thể",
  },
  {
    step: "02",
    title: "Choose a target role",
    description: "Dán nội dung JD vị trí mong muốn. Hệ thống trích xuất các tiêu chuẩn cốt lõi.",
    highlight: "Trích xuất tiêu chuẩn JD",
  },
  {
    step: "03",
    title: "Understand your match",
    description: "Xem tỷ lệ khớp bằng chứng thực tế giữa CV và JD (Khớp X/Y yêu cầu).",
    highlight: "Con số minh bạch",
  },
  {
    step: "04",
    title: "Inspect the evidence",
    description: "Nhấp vào từng yêu cầu trong JD để định vị trực tiếp đoạn bằng chứng (snippet) tương ứng trong CV.",
    highlight: "Highlight bằng chứng",
  },
  {
    step: "05",
    title: "Practice the interview",
    description: "Bật micro đàm thoại 2 chiều với AI Interviewer theo kịch bản chuẩn bị riêng cho JD đó.",
    highlight: "Luyện thoại thời gian thực",
  },
];

export const MARKETING_EVIDENCE_MOCK: EvidenceItem[] = [
  {
    requirement: "Thiết kế & phát triển RESTful APIs với Java / Spring Boot",
    category: "must_have",
    categoryLabel: "Bắt buộc",
    status: "matched",
    statusLabel: "Đã khớp",
    snippets: [
      "Xây dựng 14 RESTful APIs bằng Spring Boot microservices cho hệ thống thanh toán trực tuyến...",
      "Tối ưu hóa các API endpoint giúp giảm 35% thời gian phản hồi trung bình.",
    ],
  },
  {
    requirement: "Triển khai & vận hành dịch vụ trên hạ tầng Cloud (AWS)",
    category: "must_have",
    categoryLabel: "Bắt buộc",
    status: "matched",
    statusLabel: "Đã khớp",
    snippets: [
      "Triển khai containerized backend services lên AWS EC2 & S3 với quy trình CI/CD tự động...",
    ],
  },
  {
    requirement: "Quản trị cluster Kubernetes & Helm Charts trong Production",
    category: "constraints",
    categoryLabel: "Ràng buộc",
    status: "missing",
    statusLabel: "Thiếu minh chứng",
    snippets: [],
  },
  {
    requirement: "Tối ưu hóa truy vấn SQL và cơ sở dữ liệu PostgreSQL",
    category: "nice_to_have",
    categoryLabel: "Khuyến khích",
    status: "matched",
    statusLabel: "Đã khớp",
    snippets: [
      "Tối ưu hóa index PostgreSQL giúp xử lý 100k queries/phút mà không gây nghẽn DB.",
    ],
  },
];

export const FEEDBACK_SHOWCASE_DATA = {
  headline: "Biết lần tới nên làm tốt hơn ở đâu.",
  body: "Sau mỗi phiên phỏng vấn, nhận báo cáo nhận xét cụ thể để điều chỉnh cách kể chuyện của bạn.",
};

export const PROGRESS_DATA = {
  readinessScore: 84,
  scoreIncrease: "+8 điểm tuần này",
  streakDays: 5,
  categories: [
    { name: "Kỹ năng Chuyên môn (Backend)", progress: 88, completed: true },
    { name: "Cấu trúc Trả lời STAR", progress: 82, completed: true },
    { name: "Tư duy Thiết kế Hệ thống", progress: 65, completed: false },
    { name: "Khả năng Giao tiếp & Phản xạ", progress: 78, completed: false },
  ],
};

export const TRUST_CARDS = [
  {
    title: "Explainable by design",
    description: "Mọi đánh giá đều có bằng chứng đối chiếu rõ ràng từ CV, không đưa ra con số cảm tính.",
    iconName: "FileCheck",
  },
  {
    title: "Your practice stays yours",
    description: "Dữ liệu CV và nội dung luyện tập hoàn toàn riêng tư và thuộc quyền sở hữu của bạn.",
    iconName: "ShieldCheck",
  },
  {
    title: "AI supports preparation",
    description: "Hệ thống đóng vai trò người đồng hành luyện tập, không đưa ra quyết định tuyển dụng thay con người.",
    iconName: "UserCheck",
  },
];

export const FAQ_ITEMS = [
  {
    q: "Hệ thống có tự động bịa đặt kinh nghiệm không có thật vào CV của tôi không?",
    a: "Tuyệt đối không. INTERVIA chỉ phân tích và làm nổi bật những bằng chứng (evidence) thực tế có trong CV của bạn, đồng thời chỉ ra các tiêu chuẩn chưa tìm thấy minh chứng để bạn chuẩn bị trước khi phỏng vấn.",
  },
  {
    q: "Match score được tính như thế nào?",
    a: "Tỷ lệ tương thích dựa trên các yêu cầu trong JD được tìm thấy bằng chứng đối chiếu trực tiếp trong CV của bạn.",
  },
  {
    q: "Evidence (Bằng chứng) trong INTERVIA là gì?",
    a: "Evidence là những đoạn mô tả dự án, kỹ năng, công nghệ hoặc thành tựu cụ thể trong CV chứng minh bạn đáp ứng tiêu chuẩn tuyển dụng.",
  },
  {
    q: "Phỏng vấn giọng nói có hỗ trợ tiếng Việt không?",
    a: "Có. AI Interviewer xử lý mượt mà tiếng Việt và các thuật ngữ chuyên ngành tiếng Anh.",
  },
  {
    q: "Dữ liệu CV của tôi có được bảo mật không?",
    a: "Dữ liệu của bạn được mã hóa an toàn và chỉ phục vụ cho quá trình luyện tập của riêng bạn.",
  },
];
