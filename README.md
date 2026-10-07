# Vue Explorer

The development playground includes an interactive **Design Lab** with five
real inspector layouts, a contextual file tree, source navigation and live
density/split controls. See [Design Lab](docs/DESIGN-LAB.md). Code formatting is
available through `pnpm format` and `pnpm format:check`.

Vue/Nuxt development inspector inspired by [Feel](https://github.com/Nirbhay71/Feel-your-project). Independently implemented Vue adapter; the upstream React code is not copied.

## Planned full component explorer

The current implementation is a foundation, not a complete Feel-equivalent graph explorer. The [full expansion plan](docs/EXPLORER-PLAN.md) defines the interactive graph, function-level analysis, contextual request tracing, realistic playground, backend traversal and optional SQL/table adapters. Planned architecture is recorded in [ADR 001](decisions/active/001-hybrid-component-explorer.md). These documents describe future work, not shipped features.

## Playground

The new default inspector section is **Data flow**: select the employee heading for parallel API branches and rendered child components, or select **Download payslip** for the possible download path. Graph/List, zoom and Fit are available. Click a node to read its original Vue, client-service, route-handler or backend-service code. **Reload employee** and **Test failed request** generate real browser requests; badges remain explicitly URL-match hints rather than proof of component ownership.

Current graph analysis supports named local functions, imported direct calls, explicit relative component imports, service-object methods, Nuxt auto-imported calls and literal fetch destinations. It does not yet support general alias/barrel resolution, arbitrary callbacks, props/state provenance, SSR traces or SQL. Unknown syntax/dynamic request expressions produce diagnostics. Analysis is bounded at 100 visited symbols, 150 nodes and 12 levels. Source files discovered by analysis are registered only under app/server roots; arbitrary file access is still denied.

```sh
nvm use
pnpm install
pnpm dev
```

Open http://127.0.0.1:3047. Click **Pick an element**, or hold Alt/Option and click or right-click an element. Escape cancels or closes the drawer. Inspect component ancestry and public props, original Vue source, literal fetch hints and computed styles.

## Try in another Nuxt project

Add the following absolute module path to its existing `modules` array, then restart its dev server:

```ts
export default defineNuxtConfig({
  modules: ['/Users/flame/Developer/Projects/vue-explorer/module/index.ts'],
})
```

Install this workspace's dependencies first. The inspector generates its own UnoCSS and mounts into a shadow root. Host UnoCSS configuration and tokens are independent. The module registers nothing when `dev` is false.

Source access is allowlisted to transformed `.vue` files and graph-discovered Vue/TS/JS files under app/server roots, checked through canonical paths. No arbitrary filesystem reading or production endpoints. Public prop names resembling credentials are redacted; objects are summarized. Open-in-editor uses Vite's existing editor endpoint/configuration.

## Devframe architecture

`module/devframe.ts` defines the portable tool: validated source/request RPCs and shared selection metadata/request history. The Nuxt module mounts its authenticated SSE handler at `/__vue_explorer/` on the existing dev server. No separate process or port is started. A local same-origin bootstrap exchanges Devframe's one-time code; this integration supports localhost/loopback hosts only. Source RPCs retain the allowlist. The former `/source` HTTP endpoint is removed.

The client closes its connection and restores owned fetch wrappers during HMR disposal. The server closes Devframe on Nuxt/Vite shutdown. Native fetch and Nuxt's $fetch feed a capped 100-entry request history. Traces contain method, path without query parameters, HTTP status, browser duration and available Nitro timing/handler metadata. Request bodies, response bodies and authorization headers are never captured.

`module/analysis.ts` follows direct calls to local imported functions and Nuxt auto-imports, including composables. Analysis stops at six dependency levels or forty files, and rejects resolved paths outside srcDir. The playground exercises Dashboard → useMetrics → useFetch → /api/metrics → server/api/metrics.get.ts.

## Current scope

Nuxt with Vue 3, standard HTML Vue templates, source locations, component parent chain and props. The legacy literal hint analyzer does not resolve member calls; the graph analyzer resolves supported local service-object methods and explicit relative component imports. General dynamic URLs, custom aliases, re-exports and external packages remain unsupported. Browser capture begins after connection setup; SSR requests, XHR and separately created ofetch instances are not captured. URL matches are hints, not proof of component ownership. Nitro timing measures request processing before response sending, not exclusive handler execution. Conventional server/api trace-header mappings are scanned at startup; restart after adding routes. Graph route discovery reads standard routes per analysis. Nuxt layers/serverDir customization are not supported by this increment.

SQL tracing needs a database/ORM adapter and a real target project. A Vite DevTools dock and standalone Vue/Vite installation are not yet implemented; the portable Devframe definition provides the foundation for both. The current Nuxt playground was verified on Nuxt 4.6.0; Nuxt 3 has not been separately tested.

Tokens live in `app/assets/css/tokens.css`; theme and shortcuts in `app/assets/unocss`. This follows the split structure in the local `codex-theme` project.

```sh
pnpm test
pnpm typecheck
pnpm build
```
