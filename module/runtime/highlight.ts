import type { HighlighterCore, ThemedToken } from 'shiki/core'

export const CODE_THEME = 'github-dark-default'
let highlighter: Promise<HighlighterCore> | undefined

export function getCodeHighlighter() {
  // One lazy instance per inspector runtime; no full language/theme bundle or external CDN.
  return highlighter ||= Promise.all([
    import('shiki/core'), import('shiki/engine/javascript'),
    import('shiki/themes/github-dark-default.mjs'),
    import('shiki/langs/vue.mjs'), import('shiki/langs/typescript.mjs'),
    import('shiki/langs/javascript.mjs'), import('shiki/langs/html.mjs'),
    import('shiki/langs/css.mjs'), import('shiki/langs/json.mjs'),
  ]).then(([core, engine, theme, ...languages]) => core.createHighlighterCore({
    engine: engine.createJavaScriptRegexEngine(), themes: [theme.default], langs: languages.map(language => language.default),
  })).catch(error => { highlighter = undefined; throw error })
}

export function codeLanguage(file: string) {
  return file.endsWith('.vue') ? 'vue' : file.endsWith('.ts') ? 'typescript' : file.endsWith('.js') ? 'javascript' : 'text'
}

export async function highlightCode(code: string, file: string): Promise<ThemedToken[][]> {
  const instance = await getCodeHighlighter()
  return instance.codeToTokens(code, { lang: codeLanguage(file), theme: CODE_THEME }).tokens
}

if (import.meta.hot) import.meta.hot.dispose(() => { void highlighter?.then(instance => instance.dispose()).catch(() => {}) })
