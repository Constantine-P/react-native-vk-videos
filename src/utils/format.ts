export function modifyVkUrl(url: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('js_api', '1');
  return parsedUrl.toString();
}
