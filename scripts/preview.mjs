/**
 * Serve ./out under the production basePath.
 *
 * `next dev` resolves assets at the root, so a wrong basePath only shows up as
 * 404s here. This is the check that must pass before pushing.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const BASE_PATH = process.env.BASE_PATH ?? '/rantai'
const PORT = Number(process.env.PORT ?? 4173)
const ROOT = join(process.cwd(), 'out')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

async function resolve(pathname) {
  const candidates = [pathname, join(pathname, 'index.html'), `${pathname}.html`]
  for (const candidate of candidates) {
    const file = join(ROOT, normalize(candidate))
    if (!file.startsWith(ROOT)) continue
    try {
      const info = await stat(file)
      if (info.isFile()) return file
    } catch {
      // try the next candidate
    }
  }
  return null
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  let pathname = decodeURIComponent(url.pathname)

  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    pathname = pathname.slice(BASE_PATH.length) || '/'
  } else if (BASE_PATH && pathname === '/') {
    res.writeHead(302, { Location: `${BASE_PATH}/` })
    res.end()
    return
  }

  const file = await resolve(pathname)
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`404 ${pathname}\nAsset missing under basePath ${BASE_PATH}.`)
    return
  }

  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(PORT, () => {
  console.log(`preview: http://localhost:${PORT}${BASE_PATH}/`)
})
