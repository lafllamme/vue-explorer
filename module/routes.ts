export function apiRoute(file: string) {
  const match = file.replaceAll('\\', '/').match(/^server\/api\/(.*)\.(?:ts|js|mjs)$/)
  if (!match) return null
  const suffix = match[1]!.match(/\.(get|post|put|patch|delete|head|options)$/)
  let path = match[1]!.replace(/\.(get|post|put|patch|delete|head|options)$/, '')
  path = path.replace(/(?:^|\/)index$/, '').replace(/\[\.\.\.[^\]]+\]/g, '**').replace(/\[([^\]]+)\]/g, ':$1')
  return { path: `/api/${path}`.replace(/\/$/, ''), method: suffix?.[1]?.toUpperCase() || '', file }
}
