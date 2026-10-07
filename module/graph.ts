import { readFile, realpath } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { babelParse, parse } from 'vue/compiler-sfc'
import { withinRoot } from './instrument'
import { apiRoute } from './routes'
import { parse as parseTemplate, NodeTypes } from '@vue/compiler-dom'

export interface GraphNode { id: string; kind: string; label: string; file: string; line: number; url?: string }
export interface GraphEdge { id: string; source: string; target: string; label: string }
export interface ComponentGraph { schemaVersion: 1; root: string; nodes: GraphNode[]; edges: GraphEdge[]; diagnostics: string[] }
type Ast = Record<string, any>

export function allowedGraphSource(file: string, srcDir: string, serverDir: string) {
  return /\.(vue|ts|js)$/.test(file) && [srcDir, serverDir].some(base => withinRoot(base, file)) && !file.split('/').some(part => part === 'node_modules' || part.startsWith('.'))
}

// Static relationships only. Runtime URL matches must never upgrade these edges to causal evidence.
export async function buildGraph(entry: string, root: string, srcDir: string, registry: Map<string, string>, autoImports: Map<string, string>, serverDir = resolve(root, 'server')): Promise<ComponentGraph> {
  const graph: ComponentGraph = { schemaVersion: 1, root: '', nodes: [], edges: [], diagnostics: [] }
  const visited = new Set<string>()
  const allowed = (file: string) => allowedGraphSource(file, srcDir, serverDir)
  const add = (node: GraphNode) => { if (!graph.nodes.some(item => item.id === node.id)) graph.nodes.push(node); return node.id }
  const edge = (source: string, target: string, label: string) => {
    const id = `${source}>${target}:${label}`
    if (!graph.edges.some(item => item.id === id)) graph.edges.push({ id, source, target, label })
  }
  async function resolveFile(base: string) {
    for (const candidate of [base, `${base}.ts`, `${base}.js`, `${base}.vue`, resolve(base, 'index.ts')]) {
      try { const file = await realpath(candidate); if (allowed(file)) return file }
      catch { /* Try the next supported extension. */ }
    }
  }
  async function visit(path: string, symbol: string, parent?: string, depth = 0): Promise<string | undefined> {
    if (depth > 12 || graph.nodes.length >= 150 || visited.size >= 100) { if (!graph.diagnostics.includes('Analysis budget reached.')) graph.diagnostics.push('Analysis budget reached.'); return }
    const file = await resolveFile(path)
    if (!file) { graph.diagnostics.push(`Unresolved local source: ${relative(root, path)}`); return }
    const name = relative(root, file)
    const id = `${name}#${symbol}`
    if (parent) edge(parent, id, 'calls')
    if (visited.has(id)) return id
    visited.add(id)
    registry.set(name, file)
    const code = await readFile(file, 'utf8')
    const vue = file.endsWith('.vue')
    const descriptor = vue ? parse(code).descriptor : null
    const blocks = descriptor ? [descriptor.script, descriptor.scriptSetup].filter(Boolean) : [{ content: code, loc: { start: { line: 1 } } }]
    const node: GraphNode = { id, kind: vue && symbol === '*' ? 'component' : withinRoot(serverDir, file) ? 'backend' : symbol.startsWith('use') ? 'composable' : 'function', label: symbol === '*' ? name.split('/').pop()!.replace(/\.vue$/, '') : symbol === 'default' ? name.split('/').pop()! : symbol, file: name, line: 1 }
    add(node)
    for (const block of blocks) {
      let program: Ast
      try { program = babelParse(block!.content, { sourceType: 'module', plugins: ['typescript', 'jsx'] }).program }
      catch { graph.diagnostics.push(`Unsupported syntax in ${name}`); continue }
      const offset = block!.loc.start.line - 1
      const imports = new Map<string, { path: string; exported: string }>()
      const functions = new Map<string, Ast>()
      for (const item of program.body) {
        if (item.type === 'ImportDeclaration') for (const spec of item.specifiers) imports.set(spec.local.name, { path: item.source.value, exported: spec.imported?.name || (spec.type === 'ImportDefaultSpecifier' ? 'default' : '*') })
        const declaration = item.declaration || item
        if (declaration.type === 'FunctionDeclaration' && declaration.id) functions.set(declaration.id.name, declaration)
        if (declaration.type === 'VariableDeclaration') for (const decl of declaration.declarations) {
          if (!decl.id?.name || !decl.init) continue
          if (['ArrowFunctionExpression', 'FunctionExpression'].includes(decl.init.type)) functions.set(decl.id.name, decl.init)
          if (decl.init.type === 'ObjectExpression') for (const prop of decl.init.properties) {
            const value = prop.type === 'ObjectMethod' ? prop : prop.value
            if (value && ['ObjectMethod', 'ArrowFunctionExpression', 'FunctionExpression'].includes(value.type)) functions.set(`${decl.id.name}.${prop.key.name || prop.key.value}`, value)
          }
        }
        if (item.type === 'ExportDefaultDeclaration') functions.set('default', item.declaration)
      }
      const body = symbol === '*' ? program : functions.get(symbol)
      if (!body) { graph.diagnostics.push(`Symbol ${symbol} is not resolved in ${name}`); continue }
      node.line = (body.loc?.start.line || 1) + offset
      const calls: Ast[] = []
      function walk(value: any, top = false) {
        if (!value || typeof value !== 'object') return
        if (Array.isArray(value)) { value.forEach(child => walk(child)); return }
        if (!top && ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod'].includes(value.type)) return
        if (value.type === 'CallExpression') {
          calls.push(value)
          // Framework callbacks execute the handler; local function bodies are otherwise visited by symbol.
          if (['defineEventHandler', 'useAsyncData'].includes(value.callee?.name)) value.arguments.forEach((arg: Ast) => { if (arg.body) walk(arg.body, true) })
        }
        for (const [key, child] of Object.entries(value)) if (!['loc', 'comments', 'tokens'].includes(key)) walk(child)
      }
      walk(body, true)
      if (vue && symbol === '*' && descriptor?.template) {
        const tags = new Set<string>()
        const events: string[] = []
        const collect = (children: any[]) => { for (const child of children) {
          if (child.type !== NodeTypes.ELEMENT) continue
          tags.add(child.tag)
          for (const prop of child.props) if (prop.type === NodeTypes.DIRECTIVE && prop.name === 'on' && prop.exp?.content) events.push(prop.exp.content)
          collect(child.children)
        } }
        collect(parseTemplate(descriptor.template.content).children)
        for (const [component, imported] of imports) {
          const kebab = component.replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`)
          if ((!tags.has(component) && !tags.has(kebab)) || !imported.path.startsWith('.')) continue
          const child = await visit(resolve(dirname(file), imported.path), '*', undefined, depth + 1)
          if (child) edge(id, child, 'renders')
        }
        for (const key of functions.keys()) if (events.some(expression => expression.split(/[^\w$]+/).includes(key))) {
          await visit(file, key, id, depth + 1)
        }
      }
      for (const call of calls) {
        const callee = call.callee
        const target = callee?.type === 'Identifier' ? callee.name : callee?.type === 'MemberExpression' && !callee.computed && callee.object?.type === 'Identifier' ? `${callee.object.name}.${callee.property.name}` : ''
        if (!target) continue
        if (['fetch', '$fetch', 'useFetch', 'useLazyFetch'].includes(target)) {
          const arg = call.arguments[0]
          const url = arg?.type === 'StringLiteral' ? arg.value : arg?.type === 'TemplateLiteral' && !arg.expressions.length ? arg.quasis[0].value.cooked : undefined
          if (!url) { graph.diagnostics.push(`Dynamic request at ${name}:${call.loc.start.line + offset}`); continue }
          const requestId = `${name}:${call.start}:request`
          const methodOption = call.arguments[1]?.properties?.find((prop: Ast) => (prop.key?.name || prop.key?.value) === 'method')?.value
          const method = methodOption ? methodOption.type === 'StringLiteral' ? methodOption.value.toUpperCase() : 'UNKNOWN' : 'GET'
          if (method === 'UNKNOWN') graph.diagnostics.push(`Dynamic request method at ${name}:${call.loc.start.line + offset}`)
          add({ id: requestId, kind: 'request', label: `${method} ${url}`, file: name, line: call.loc.start.line + offset, url })
          edge(id, requestId, 'may request')
          // Conventional API routes; custom middleware and dynamic expressions remain diagnostics.
          const { readdir } = await import('node:fs/promises')
          const routes = await readdir(resolve(serverDir, 'api'), { recursive: true }).catch(() => [] as string[])
          for (const routeFile of routes) {
            const route = apiRoute(`server/api/${routeFile}`)
            const routeParts = route?.path.split('/') || []
            const urlParts = url.split('?')[0].split('/')
            const matches = routeParts.length === urlParts.length && routeParts.every((part, index) => part.startsWith(':') || part === urlParts[index])
            if (route && matches && (!route.method || route.method === method)) {
              const handler = await visit(resolve(serverDir, 'api', routeFile), 'default', undefined, depth + 1)
              if (handler) edge(requestId, handler, 'route mapping')
            }
          }
          continue
        }
        if (['onMounted', 'onBeforeMount'].includes(target) && call.arguments[0]?.type === 'Identifier' && functions.has(call.arguments[0].name)) await visit(file, call.arguments[0].name, id, depth + 1)
        if (functions.has(target)) { await visit(file, target, id, depth + 1); continue }
        const [base, member] = target.split('.')
        const imported = imports.get(base!)
        const importPath = imported?.path
        const resolved = importPath?.startsWith('.') ? resolve(dirname(file), importPath) : importPath && /^[@~]\//.test(importPath) ? resolve(srcDir, importPath.slice(2)) : !imported ? autoImports.get(base!) : undefined
        if (resolved) await visit(resolved, member ? `${imported?.exported || base}.${member}` : imported?.exported || base!, id, depth + 1)
      }
    }
    return id
  }
  graph.root = await visit(entry, entry.endsWith('.vue') ? '*' : 'default') || ''
  graph.diagnostics = [...new Set(graph.diagnostics)]
  return graph
}
