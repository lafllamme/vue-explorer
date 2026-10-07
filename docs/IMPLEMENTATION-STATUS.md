# Implementation status — 2026-10-08

First graph increment implemented, not the complete expansion plan.

## Shipped in this increment

- Versioned static graph, bounded symbol traversal, explicit relative child components, local functions and imported service-object methods.
- Literal fetch destinations, methods, conventional parameterized route mapping and local backend-service traversal.
- Wide shadow-root inspector, Graph/List, zoom/pan/Fit, breadcrumbs, selectable nodes and original source with selected line; shared Shiki code viewer for Vue/TS/JS using github-dark-default on our black canvas.
- Graph-discovered app/server Vue/TS/JS source registry with canonical-root checks; authenticated Devframe analyze RPC.
- Employee, payslips, presentation-only summary, initially unused real text download and intentional 503 request.
- Runtime history and graph badges explicitly labeled URL hints; no claim of causal execution attribution.

## Remaining from the approved plan

Symbol graph needs scope/shadowing precision, re-exports/barrels, configured aliases, arbitrary callbacks, dynamic expressions, Nuxt component auto-import metadata and diagnostic coverage for unsupported syntax. Props/state provenance is not implemented. Graph IDs still use source offsets and can change during HMR. Analyzer currently reparses files instead of using an invalidated index/cache. Routes use the conventional local server/api directory, not Nuxt's complete resolved route configuration/layers.

Contextual tracing, component-instance/session isolation, SSR/hydration spans, separately created ofetch clients, SQL/schema/change-history adapters, Nuxt-3/standalone-Vue verification, distribution and optional DevTools host remain. Graph expansion/filter/search and resizable split are not implemented.

## Verification

Ten node:test tests cover the previous source tagging/routing/hint behavior, graph member/backend resolution, unrelated-export exclusion, child render paths, presentation-only components, outside-root and credential/dependency-file rejection, Devframe graph RPC, registered dependency source access, and Shiki source preservation/colors/singleton reuse. Required test/typecheck/build commands were run during this increment. Production scan found no Inspector/graph RPC/tagging/Vue Flow artifacts. Browser checks cover real employee requests, download before/after, backend source selection, Graph/List and desktop/mobile layout. The final handoff reports the latest run results and any exclusions; this file does not imply every planned test exists.
