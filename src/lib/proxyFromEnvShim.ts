// Browser/SSR builds do not use Node's proxy environment variables.
export default function getProxyForUrl(): undefined {
  return undefined;
}
