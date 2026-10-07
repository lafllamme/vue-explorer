import { readFile, realpath } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { babelParse, parse } from 'vue/compiler-sfc'
import { possibleRequests, withinRoot } from './instrument'

export async function analyzeDependencies(file: string, code: string, root: string, srcDir: string, autoImports: Map<string, string>) {
  const requests: { name: string; url: string; line: number; kind: 'static'; file: string }[] = []
  const dependencies: { from: string; file: string; name: string }[] = []
  const seen = new Set<string>()
  const visit = async (path: string, content: string, depth: number) => {
    if (seen.has(path) || depth > 6 || seen.size >= 40) return
    seen.add(path)
    const name = relative(root, path)
    const isVue = path.endsWith('.vue')
    const wrapped = isVue ? content : `<script setup lang="ts">${content}</script>`
    requests.push(...possibleRequests(wrapped).map(request => ({ ...request, file: name })))
    const descriptor = parse(wrapped).descriptor
    for (const block of [descriptor.script, descriptor.scriptSetup]) {
      if (!block) continue
      let ast
      try { ast = babelParse(block.content, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) }
      catch { continue }
      const imports = new Map<string, string>()
      for (const node of ast.program.body) {
        if (node.type !== 'ImportDeclaration') continue
        for (const specifier of node.specifiers) imports.set(specifier.local.name, node.source.value)
      }
      const calls = new Set<string>()
      const walk = (value: unknown) => {
        if (!value || typeof value !== 'object') return
        if (Array.isArray(value)) { value.forEach(walk); return }
        const node = value as Record<string, any>
        if (node.type === 'CallExpression' && node.callee?.type === 'Identifier') calls.add(node.callee.name)
        for (const [key, child] of Object.entries(node)) if (!['loc', 'comments', 'tokens'].includes(key)) walk(child)
      }
      walk(ast.program)
      for (const call of calls) {
        const imported = imports.get(call)
        const target = imported?.startsWith('.') ? resolve(dirname(path), imported)
          : imported && /^[@~]\//.test(imported) ? resolve(srcDir, imported.slice(2))
          : !imported ? autoImports.get(call) : undefined
        if (!target || !withinRoot(srcDir, target)) continue
        for (const candidate of [target, `${target}.ts`, `${target}.js`, resolve(target, 'index.ts')]) {
          try {
            const canonical = await realpath(candidate)
            if (!withinRoot(srcDir, canonical)) break
            const child = await readFile(canonical, 'utf8')
            dependencies.push({ from: name, file: relative(root, canonical), name: call })
            await visit(canonical, child, depth + 1)
            break
          }
          catch { continue }
        }
      }
    }
  }
  await visit(file, code, 0)
  return { requests, dependencies }
}
