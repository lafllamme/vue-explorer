# Interactive inspector lab

Open the development playground and click **Open design lab**. This selects
the real EmployeeDetailPage instance, not a mock or a second app. All five
approaches share the same graph, Devframe connection, source and request history:

- Reference: compact context, graph above source.
- Split: graph and source side by side.
- Workbench: persistent contextual folder/file navigator.
- Code first: source gets priority and a larger type size.
- Trace: request evidence occupies a dedicated side column.

Density changes control and toolbar spacing. Graph space changes the split.
On mobile, columns become a scrollable vertical reading order. Folder groups
can be collapsed and filtered; choosing a file changes source without discarding
the graph. Root-to-leaf ancestry buttons change the analyzed component.

Graphs open at readable 100% size with their root visible. Pan/zoom to follow
branches; Fit explicitly shows the full overview and 1:1 restores readable size.
The source is the formatted original file, preserving source-line mapping and
Shiki syntax colors. Live request matches are URL hints, not causal attribution.

The lab preserves the existing black token system. It is a native playground
implementation informed by Impeccable, not an active Impeccable Live helper
session. The Live helper has no configured injection or running session here.

Prettier config and `pnpm format` / `pnpm format:check` keep app and inspector
source readable. Dev-only SFC compiler tests cover templates excluded from the
production build.
