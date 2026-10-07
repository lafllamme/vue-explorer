import { computed, onMounted, onUnmounted, ref, shallowRef, type ComponentInternalInstance } from 'vue'

export type ComponentEntry = { name: string; file: string; props: Record<string, string> }
type VueElement = Element & { __vueParentComponent?: ComponentInternalInstance }
export function useInspector() {
  const picking = ref(false)
  const opened = ref(false)
  const selected = shallowRef<Element | null>(null)
  const hovered = shallowRef<Element | null>(null)
  const box = shallowRef<DOMRect | null>(null)
  const chain = shallowRef<ComponentEntry[]>([])
  const sourceFile = ref('')
  const sourceLine = ref(1)
  let held = false
  let previousFocus: HTMLElement | null = null
  const label = computed(() => hovered.value?.tagName.toLowerCase() || 'element')
  const safeProp = (key: string, value: unknown): string => {
    if (/password|secret|token|authorization|cookie/i.test(key)) return '[redacted]'
    if (value === null) return 'null'
    if (typeof value === 'string') return JSON.stringify(value.slice(0, 120))
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'function') return '[function]'
    if (Array.isArray(value)) return `Array(${value.length})`
    return value === undefined ? 'undefined' : '[object]'
  }
  const inspect = (el: Element) => {
    previousFocus = document.activeElement as HTMLElement | null
    selected.value = el
    const tagged = el.closest('[data-ve-file]') as HTMLElement | null
    sourceFile.value = tagged?.dataset.veFile || ''
    sourceLine.value = Number(tagged?.dataset.veLine || 1)
    const entries: ComponentEntry[] = []
    let instance = (el as VueElement).__vueParentComponent
    let parent: Element | null = el
    while (!instance && parent) { instance = (parent as VueElement).__vueParentComponent; parent = parent.parentElement }
    while (instance) {
      const type = instance.type as { name?: string; __name?: string; __file?: string }
      entries.push({ name: type.name || type.__name || 'Anonymous', file: type.__file || '',
        props: Object.fromEntries(Object.entries(instance.props).map(([k, v]) => [k, safeProp(k, v)])) })
      instance = instance.parent || undefined
    }
    chain.value = entries
    opened.value = true
    picking.value = false
    hovered.value = null
    box.value = null
  }
  const target = (event: Event) => event.composedPath().some(el => el instanceof Element && el.tagName === 'VUE-EXPLORER') ? null : event.target instanceof Element ? event.target : null
  const move = (event: MouseEvent) => {
    if (!picking.value && !held) return
    hovered.value = target(event)
    box.value = hovered.value?.getBoundingClientRect() || null
  }
  const click = (event: MouseEvent) => {
    if (!(picking.value || event.altKey)) return
    const el = target(event)
    if (!el) return
    event.preventDefault(); event.stopImmediatePropagation(); inspect(el)
  }
  const close = () => { opened.value = false; previousFocus?.focus() }
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Alt') held = true
    if (event.key === 'Escape') { picking.value = false; held = false; box.value = null; hovered.value = null; close() }
  }
  const clear = () => { held = false; hovered.value = null; box.value = null }
  const keyup = (event: KeyboardEvent) => { if (event.key === 'Alt') clear() }
  const start = () => { picking.value = !picking.value; if (!picking.value) clear() }
  onMounted(() => {
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('click', click, true)
    window.addEventListener('contextmenu', click, true)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clear)
    window.addEventListener('scroll', clear, true)
    window.addEventListener('resize', clear)
    window.addEventListener('vue-explorer:pick', start)
  })
  onUnmounted(() => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('click', click, true)
    window.removeEventListener('contextmenu', click, true)
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clear)
    window.removeEventListener('scroll', clear, true)
    window.removeEventListener('resize', clear)
    window.removeEventListener('vue-explorer:pick', start)
  })
  return { picking, opened, selected, box, chain, sourceFile, sourceLine, label, start, close }
}
