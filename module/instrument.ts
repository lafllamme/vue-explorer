import { relative, isAbsolute } from 'node:path'
import { parse as parseSfc, babelParse } from 'vue/compiler-sfc'
import { parse as parseTemplate, NodeTypes, type TemplateChildNode } from '@vue/compiler-dom'
import MagicString from 'magic-string'

export function withinRoot(root: string, file: string) {
  const path = relative(root, file)
  return path !== '..' && !path.startsWith('../') && !isAbsolute(path)
}

export function instrument(code: string, file: string) {
  const { descriptor } = parseSfc(code, { filename: file })
  if (!descriptor.template || descriptor.template.lang)
    return null
  const template = descriptor.template
  const tree = parseTemplate(template.content)
  const output = new MagicString(code)
  const walk = (nodes: TemplateChildNode[]) => {
    for (const node of nodes) {
      if (node.type !== NodeTypes.ELEMENT) continue
      // Do not add attributes to template/slot or component invocations.
      if (node.tagType === 0 && !node.props.some(p => p.type === NodeTypes.ATTRIBUTE && p.name === 'data-ve-file')) {
        const start = template.loc.start.offset + node.loc.start.offset
        const line = code.slice(0, start).split('\n').length
        const escaped = file.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
        output.appendLeft(start + 1 + node.tag.length, ` data-ve-file="${escaped}" data-ve-line="${line}"`)
      }
      walk(node.children)
    }
  }
  walk(tree.children)
  return { code: output.toString(), map: output.generateMap({ source: file, includeContent: true, hires: true }) }
}

export function possibleRequests(code: string) {
  const { descriptor } = parseSfc(code)
  const requests: { name: string; url: string; line: number; kind: 'static' }[] = []
  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    try {
      const ast = babelParse(script.content, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
      const walk = (value: unknown) => {
        if (!value || typeof value !== 'object') return
        if (Array.isArray(value)) { value.forEach(walk); return }
        const node = value as Record<string, any>
        if (node.type === 'CallExpression' && node.callee?.type === 'Identifier'
          && ['useFetch', '$fetch', 'fetch', 'useLazyFetch'].includes(node.callee.name)) {
          const argument = node.arguments[0]
          const url = argument?.type === 'StringLiteral' ? argument.value
            : argument?.type === 'TemplateLiteral' && !argument.expressions.length ? argument.quasis[0].value.cooked : null
          if (typeof url === 'string') requests.push({ name: node.callee.name, url,
            line: script.loc.start.line + node.loc.start.line - 1, kind: 'static' })
        }
        for (const [key, child] of Object.entries(node)) {
          if (!['loc', 'comments', 'tokens', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) walk(child)
        }
      }
      walk(ast.program)
    }
    catch { /* Unsupported script syntax has no static hints. */ }
  }
  return requests
}
