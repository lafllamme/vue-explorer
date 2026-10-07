# Design direction

Minimal monochrome developer tooling inspired by Vercel/v0. Black canvas, one-pixel neutral borders, soft white text, restrained six-to-eight-pixel corners and precise spacing. The distinctive element is the selected element's outline and the continuous chain from rendered UI to source.

Tokens are defined in `app/assets/css/tokens.css`; UnoCSS semantic theme and shortcuts are split in `app/assets/unocss`, following the existing codex-theme pattern. Use appBg, appSurface, appRaised, appInk, appMuted, appLine and appAccent. UI uses Geist with system fallbacks; source uses Geist Mono with system monospace fallbacks. No external font request is needed.

Code uses Shiki's github-dark-default token palette on our own appBg canvas. Line numbers stay neutral, the selected line gets the existing raised neutral highlight, and source is rendered as escaped Vue text tokens, never raw HTML. The highlighter is loaded lazily and reused; Vue/TS/JS grammars and one theme only, with the JavaScript regex engine and no CDN/WASM load. Large files fall back to plain text.

Inspector styling is generated with UnoCSS and isolated in a shadow root, including its own tokens and Vue Flow styles. Drawer width min(1300px, 88vw), full width below 640px. Data flow is the default section: horizontal graph with selectable nodes, Graph/List, zoom and Fit, followed by selected source and request history. Dashed edges represent static relationships; URL-match badges are explicitly not causal evidence. The floating picker remains keyboard accessible. All controls have visible focus; no ambient animation; reduced motion disables transitions. The inspector is nonmodal so users can continue selecting page elements.
