<script setup lang="ts">
const section = ref('Playground')
const sections = ['Playground', 'Integration', 'Tokens']
const pick = () => window.dispatchEvent(new Event('vue-explorer:pick'))
const demo = ref<HTMLElement>()
const isDev = import.meta.dev
const openLab = () => {
  if (!import.meta.dev) return
  const element = demo.value?.querySelector('[data-ve-file$="/EmployeeDetailPage.vue"]')
  if (element)
    window.dispatchEvent(new CustomEvent('vue-explorer:preview', { detail: { element } }))
}
</script>

<template>
  <div class="min-h-screen bg-appBg text-appInk font-sans">
    <header class="h-16 border-b border-appLine flex items-center justify-between px-5 md:px-8">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 ve-panel flex items-center justify-center text-lg">◈</div>
        <span class="font-semibold tracking-tight">Vue Explorer</span>
        <span class="hidden sm:inline text-appLine mx-2">/</span>
        <span class="hidden sm:inline text-appMuted text-xs">Local workspace</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="hidden sm:inline ve-code text-[10px]">NUXT · VUE 3</span>
        <a
          href="https://github.com/Nirbhay71/Feel-your-project"
          target="_blank"
          rel="noreferrer"
          class="ve-button no-underline"
        >
          Inspired by Feel ↗
        </a>
      </div>
    </header>
    <div class="flex min-h-[calc(100vh-64px)]">
      <aside class="hidden md:flex w-56 shrink-0 border-r border-appLine p-4 flex-col">
        <p class="ve-label px-3 mt-3 mb-4">Workspace</p>
        <button
          v-for="item in sections"
          :key="item"
          class="text-left border-0 px-3 py-2.5 rounded-md mb-1 cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-appInk"
          :class="
            section === item
              ? 'bg-appRaised text-appInk'
              : 'bg-transparent text-appMuted hover:text-appInk'
          "
          @click="section = item"
        >
          <span class="inline-block w-6">
            {{ item === 'Playground' ? '⌘' : item === 'Integration' ? '↗' : '◐' }}
          </span>
          {{ item }}
        </button>
        <div class="mt-8 border-t border-appLine pt-5 px-3">
          <p class="ve-label mb-4">Project</p>
          <p class="ve-code mb-3">▾ app/</p>
          <p class="ve-code ml-4 mb-3">▾ components/</p>
          <p class="ve-code ml-8 mb-3">Dashboard.vue</p>
          <p class="ve-code ml-8 mb-3">MetricCard.vue</p>
          <p class="ve-code ml-4 mb-3">app.vue</p>
          <p class="ve-code mt-5">▸ module/</p>
        </div>
        <div class="mt-auto ve-panel p-3 text-xs">
          <p class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-appInk rounded-full"></span>
            Development mode
          </p>
          <p class="text-appMuted leading-relaxed text-[11px] mt-2">
            Inspector is excluded from production builds.
          </p>
        </div>
      </aside>
      <main class="flex-1 min-w-0 px-5 py-8 md:px-12 md:py-12 max-w-[1400px] mx-auto">
        <nav class="md:hidden flex gap-2 mb-8" aria-label="Workspace sections">
          <button
            v-for="item in sections"
            :key="item"
            class="ve-button"
            :class="section === item ? 'bg-appRaised' : ''"
            @click="section = item"
          >
            {{ item }}
          </button>
        </nav>
        <div class="flex items-center gap-2 ve-code text-[11px] mb-7">
          <span>Workspace</span>
          <span class="text-appLine">/</span>
          <span class="text-appInk">{{ section }}</span>
        </div>
        <template v-if="section === 'Playground'">
          <div
            v-if="isDev"
            class="ve-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <h2 class="text-sm font-medium">Interactive design lab</h2>
              <p class="text-xs text-appMuted mt-2">
                Five inspector layouts. Real graph, real files, live controls.
              </p>
            </div>
            <button class="ve-button" @click="openLab">Open design lab</button>
          </div>
          <div class="flex flex-wrap items-end justify-between gap-5 mb-9">
            <div>
              <h1 class="m-0 text-3xl md:text-[34px] font-semibold tracking-[-0.04em]">
                Your UI. Under the hood.
              </h1>
              <p class="text-appMuted text-sm mt-3 max-w-lg leading-relaxed">
                Pick anything on the page. Follow it back to the component, the props, and the code
                that made it.
              </p>
            </div>
            <button class="ve-primary" @click="pick">
              <span aria-hidden="true">⌖</span>
              Pick an element
            </button>
          </div>
          <div ref="demo" class="ve-panel overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-appLine px-5 py-3 text-[11px]"
            >
              <div class="flex items-center gap-3">
                <span class="text-appMuted">◉</span>
                <span>Live playground</span>
                <span class="ve-code text-[10px]">/dashboard</span>
              </div>
              <span class="ve-code text-[10px]">Vue components</span>
            </div>
            <EmployeeDetailPage />
            <Dashboard />
          </div>
          <div class="grid md:grid-cols-3 gap-7 mt-9 pb-20">
            <div>
              <div class="text-appMuted mb-3 text-lg">⌖</div>
              <h2 class="text-xs font-medium m-0">Start with an element</h2>
              <p class="text-xs text-appMuted leading-6 mt-2">
                Click the picker or hold
                <kbd class="font-mono border border-appLine rounded px-1">⌥ Alt</kbd>
                and click any element.
              </p>
            </div>
            <div>
              <div class="text-appMuted mb-3 text-lg">◇</div>
              <h2 class="text-xs font-medium m-0">Find its component</h2>
              <p class="text-xs text-appMuted leading-6 mt-2">
                See the actual Vue ancestry and public props behind the rendered element.
              </p>
            </div>
            <div>
              <div class="text-appMuted mb-3 text-lg">↗</div>
              <h2 class="text-xs font-medium m-0">Go straight to the source</h2>
              <p class="text-xs text-appMuted leading-6 mt-2">
                Read the original file at the selected line, or open it in your editor.
              </p>
            </div>
          </div>
        </template>
        <template v-else-if="section === 'Integration'">
          <h1 class="text-3xl tracking-tight font-semibold m-0">Bring it to your project.</h1>
          <p class="text-appMuted mt-3 leading-relaxed">
            Add the local module to your Nuxt 3 or 4 config. Your existing UnoCSS setup stays in
            place.
          </p>
          <div class="ve-panel p-6 mt-8">
            <p class="ve-label mb-4">nuxt.config.ts</p>
            <pre class="font-mono text-xs leading-7 whitespace-pre-wrap break-all">
export default defineNuxtConfig({
  modules: [
    '/Users/flame/Developer/Projects/vue-explorer/module/index.ts',
  ],
})</pre>
          </div>
          <p class="text-xs text-appMuted mt-5 leading-6">
            The module imports its dependencies from this workspace. Run pnpm install here first,
            then restart your project’s dev server. No published package is required for local
            testing.
          </p>
          <div class="grid sm:grid-cols-2 gap-4 mt-8">
            <div class="ve-panel p-5">
              <h2 class="text-sm m-0">Works today</h2>
              <p class="text-appMuted text-xs leading-6 mt-3">
                Element picking · component ancestry · public props · source viewer · computed
                styles · composable dependencies · captured API requests · Nitro processing time and
                handler locations
              </p>
            </div>
            <div class="ve-panel p-5">
              <h2 class="text-sm m-0">Next up</h2>
              <p class="text-appMuted text-xs leading-6 mt-3">
                Causal request attribution · SQL and database relationships · plain Vue/Vite adapter
                · optional Vite DevTools dock
              </p>
            </div>
          </div>
        </template>
        <template v-else>
          <h1 class="text-3xl tracking-tight font-semibold m-0">One quiet token system.</h1>
          <p class="text-appMuted mt-3 leading-relaxed">
            Semantic CSS variables, shared UnoCSS theme, reusable shortcuts. The same structure as
            codex-theme.
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <div
              v-for="token in ['appBg', 'appSurface', 'appRaised', 'appInk', 'appMuted', 'appLine']"
              :key="token"
              class="ve-panel p-4"
            >
              <div
                class="h-20 rounded mb-4 border border-appLine"
                :style="{
                  background: `var(--ve-${({ appBg: 'bg', appSurface: 'surface', appRaised: 'raised', appInk: 'ink', appMuted: 'muted', appLine: 'line' } as Record<string, string>)[token]})`,
                }"
              ></div>
              <span class="font-mono text-xs">{{ token }}</span>
            </div>
          </div>
          <div class="ve-panel p-5 mt-6">
            <p class="ve-label mb-4">Shared structure</p>
            <pre class="font-mono text-xs leading-7 text-appMuted">
app/assets/css/tokens.css
app/assets/unocss/theme.ts
app/assets/unocss/shortcuts.ts
app/assets/unocss/index.ts
uno.config.ts</pre>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>
