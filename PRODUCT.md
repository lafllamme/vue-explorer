# Vue Explorer

A local development inspector for Vue 3 and Nuxt 3/4. Select a rendered element to follow its component ancestry, inspect public props, read its source, and discover literal data requests.

The first graph increment adds a Vue Flow/ELK graph with component render relationships (explicit relative component imports), local named functions, service-object methods, direct imports/autoimports, literal fetch destinations, conventional Nitro route mappings and backend service functions. Every registered graph node can open original source. The employee playground exercises parallel loading, an initially unexecuted download and a deliberate failure. This is not complete parity: causal runtime attribution, props/state provenance, general aliases/barrels/dynamic calls, SSR spans and SQL remain planned in docs/EXPLORER-PLAN.md. Nuxt 3 is still unverified.

The initial release is a reusable Nuxt module and a working dashboard playground. Picking is available by button, Alt/Option + click or Alt/Option + right-click. Escape cancels picking or closes the inspector.

Devframe 1.2.3 provides authenticated RPC over SSE on the existing Vite server, shared selection metadata and request history. Source access permits instrumented Vue files plus graph-discovered Vue/TS/JS files under app/server roots, with canonical-path checks. The legacy hint analyzer follows direct imported calls and Nuxt auto-imported composables under the source directory, bounded to six levels and forty files; the new graph analyzer is bounded to 100 symbols, 150 nodes and twelve levels. Browser capture records local /api request metadata from fetch and Nuxt $fetch after mounting. Nitro adds processing time and conventional API handler locations.

Static requests are possible calls. Live requests are matched by URL, not causally attributed to a component. No query strings, request/response bodies or credentials are retained in request traces. History is bounded to one hundred records per server. SQL/database adapters, causal attribution, standalone Vue/Vite installation and a Vite DevTools dock are remaining work.
