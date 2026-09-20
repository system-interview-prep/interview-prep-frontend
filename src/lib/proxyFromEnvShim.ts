// Browser/SSR builds do not use Node's proxy environment variables.
export function getProxyForUrl(): string {
  return "";
}

export default getProxyForUrl;
