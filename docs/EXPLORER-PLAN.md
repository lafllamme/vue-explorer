# Vue Explorer — vollständiger Ausbauplan

Stand: 2026-10-08. Status: vom Nutzer freigegeben; erster Graph-Ausbau implementiert. Der Gesamtplan ist noch nicht abgeschlossen, siehe [Implementierungsstand](IMPLEMENTATION-STATUS.md).

## 1. Ziel und verbindlicher Umfang

Ein angeklicktes UI-Element soll nachvollziehbar erklären: Welche Vue-Komponente rendert es? Woher kommen ihre Daten? Welche Funktionen, Composables und Services sind beteiligt? Welche Requests sind möglich oder tatsächlich ausgeführt? Welcher Nitro-Handler und welche Backend-Funktionen bearbeiten sie? Jede aufgelöste Stelle öffnet ihren echten Quellcode.

Referenz: [Feel](https://github.com/Nirbhay71/Feel-your-project), insbesondere Graph/List, mögliche Aufrufe, Code pro Schritt und Backend-Verfolgung. Funktionale Parität für Vue/Nuxt, kein identischer React-Unterbau. SQL/Tabellen sind Teil des Gesamtplans, nicht Voraussetzung für die erste funktionierende Demo.

„Komplett“ bedeutet vollständige Darstellung innerhalb der dokumentierten unterstützten Syntax und Adapter. Dynamische JavaScript-Ausführung ist nicht allgemein statisch auflösbar. Fehlende Informationen müssen als unbekannt, extern oder abgeschnitten erscheinen, nicht durch erfundene Kanten ersetzt werden.

## 2. Ehrlicher Ist-Zustand

Vorhanden: dev-only Nuxt-Modul, DOM-Picker, Vue-Elternkette und Props, Vue-Quellcode, begrenzte importierte Abhängigkeiten, literal-basierte Request-Hinweise, Browser-fetch/$fetch-Historie, Nitro-Route-Datei und Request-Gesamtzeit, authentifiziertes Devframe-RPC über vorhandenen Vite-Server, isolierte UnoCSS-Oberfläche.

Fehlt: Graph-Renderer, Symbol-/Funktionsgraph, Member-Calls und Barrel-Auflösung, kausale Request-Zuordnung, Code-Zugriff auf Composables/Services/Handler, Backend-Funktionsgraph, SSR-Trace-Verbindung, SQL und Tabellen, verifizierter Nuxt-3-/Standalone-Vue-Adapter. Heute gleiche URLs sind nur Zuordnungshinweise. Nitro-Gesamtzeit ist keine exklusive Funktionszeit.

## 3. UX und Design

Desktop: erweiterbares Overlay, standardmäßig etwa 85vw breit, maximal viewportbreit; schmaler Inspector weiterhin als Option. Header mit Komponentenname, Datei:Zeile, Editor-Link und Schließen. Darunter anklickbare Vue-Breadcrumbs. Hauptbereich ist der Datenfluss-Graph, darunter ein höhenverstellbarer Code-/Detailbereich. Kein zusätzlicher Browserprozess.

Graph/List-Umschalter, Zoom +/−, Fit, Suchfeld, Filter für statisch/beobachtet/fehlgeschlagen und Einklappen wiederholter Hilfsfunktionen. Graph von links nach rechts; Knoten tragen Typ, Name, Datei:Zeile und verfügbare Request-Metadaten. Ausgewählter Knoten hebt seinen Pfad und seine Code-Zeilen hervor. Kantenlabel erklären die Beziehung. Keine endlosen animierten Linien.

Semantik: statische mögliche Aufrufe gestrichelt und mit Textlabel; beobachtete Aufrufe mit Ausführungsbadge; Fehler mit Status und Text; unbekannte Übergänge ausdrücklich markiert. Eine Datei-Beziehung ist keine Datenfluss-Beziehung. Eine zur Laufzeit gesehene Funktion beweist nicht automatisch jede statische Kante.

Tabs im Detailbereich: Code, Inputs/Props, State/Computed, Requests, Erklärung. Die Erklärung ist zunächst deterministisch aus Graph und Belegen abgeleitet, ohne LLM-Abhängigkeit. Keine Getter-Auswertung oder Funktionsausführung zum Inspektieren von State. Große Objekte zusammenfassen, sensible Werte redigieren.

Präsentationskomponenten zeigen Props-Herkunft zum Parent statt fälschlich einen eigenen Fetch. Beispiel: SalarySummary.total ← EmployeeDetailPage.salaryTotal ← computed(payslips). Bei nicht auflösbaren Bindungen „Herkunft unbekannt“.

Mobile: Fullscreen, Graph und Details umschaltbar; gleichwertige Tastatur-/Listenbedienung. Escape beendet Picker oder schließt Overlay, Fokus wird zurückgegeben. Dialogmodus und Nichtmodalmodus erhalten jeweils korrektes Fokusverhalten.

Monochrom, Geist/Geist Mono mit lokalen Fallbacks, bestehende CSS-Variablen und UnoCSS-Semantik. Funktion vor Dekoration; Status nicht nur durch Farbe. Shadow-root-Stile müssen auch Vue-Flow-CSS und neue Kindkomponenten enthalten; aktuelles Scannen nur einer Inspector-Datei reicht nicht mehr.

## 4. Architektur und Alternativen

Gewählt: Hybrid aus statischem Graph und runtime evidence. Devframe bleibt Transport/Auth/Shared-State, Vue Flow rendert, elkjs berechnet gerichtetes Layout. Bibliotheken vor Installation auf aktuelle kompatible Versionen prüfen und pinnen. Graph-Modell bleibt unabhängig von Renderer und Transport.

Alternativen: eigener SVG-Renderer spart Abhängigkeiten, verursacht aber zusätzliche Interaktions-/Accessibility-Arbeit; reines Runtime-Tracing sieht keine unbenutzten Zweige; reiner statischer Graph kennt keine echten Status-/Timingdaten. Optionaler Vite-DevTools-Host kommt nach dem eigenständig funktionierenden Inspector.

Geplante Grenzen im bestehenden Repository, ohne sofortigen Monorepo-Umbau:

```text
module/graph/         versionierter Vertrag, IDs, Merge, Erklärung, Grenzen
module/analyzer/      SFC/TS-Symbole, Imports, Calls, Vue-Bindings, Route-Resolver
module/security/      geprüfte Quellcode-Registry, redaction, RPC-Grenzen
module/runtime/ui/    Shell, Breadcrumbs, Graph, Nodes, Liste, Code, Details
module/runtime/trace/ Browser-/SSR-/Nitro-Adapter und Kontext
module/adapters/      Nuxt/Vite und später DB-Adapter
app/components/demo/ echte fachliche Komponenten
app/services/        Client-Services
server/api/          echte Demo-Endpunkte
server/services/     Handler-Unterfunktionen
tests/fixtures/      kleine Syntax- und Framework-Fixtures
tests/e2e/           Picker → Graph → Code → Request
```

## 5. Datenvertrag

GraphSnapshot: schemaVersion, selectionId, revision, rootNodeId, nodes, edges, diagnostics, completeness. Node: stabile ID aus Projektdatei + Symbol/Quellbereich + Typ, kind, label, sourceRange und optionale Metadaten. Typen: component, composable, function, state, request, handler, query, table, external, unresolved. SourceRange: erlaubte fileId, Start/Ende in Zeile/Spalte; Template-Nutzung und Definition getrennt.

Edge: ID, source/target, Beziehung (renders, passes-prop, reads, computes, calls, requests, handles, queries, references-table), evidence (static/runtime/inferred), sourceRange und optional traceIds. Inferred ist ausdrücklich keine bewiesene Kausalität. Gleiche URL verbindet keine zwei Komponenten kausal.

TraceEvent: sessionId, traceId, parentSpanId, spanId, symbolId soweit vorhanden, requestId, timestamp, Dauer, Status und safe metadata. Snapshot und bounded Event-History separat; UI filtert nach Session/Komponenteninstanz. Strukturell identische Knoten werden nicht pro Request dupliziert.

RPC: analyze-selection, read-source(fileId), get-trace und clear-session. Antworten validiert, revisionsgebunden und größenbegrenzt; read-source akzeptiert keine beliebigen Pfade. Alte Read-source-Liste nur vorübergehend als Migrationsadapter.

## 6. Statische Analyse

SFC-Script, Script-setup und Template separat parsen; Quellbereiche auf originale Dateien abbilden. Funktions-/Symbolindex mit Scope, Imports, Exports und Aufrufstellen. Traversal ab ausgewählter Komponente oder Funktion, nicht alle Requests einer importierten Datei einsammeln.

Unterstützen: direkte/aliased Imports, benannte/default Exports, re-exports und Barrels, Nuxt-Autoimports, konfigurierte Nuxt/Vite/TS-Aliase; lokale Funktionen, Service-Objekte wie employeeApi.getById, asynchrone Funktionen, Promise.all, Eventhandler und Callback-Aufrufe. Framework-Composables erhalten benannte Adapter für useFetch, useLazyFetch, useAsyncData, $fetch und ofetch.create. Externe nicht unterstützte Bibliotheken bleiben sichtbare Grenzen.

Template-Beziehungen: Kindkomponenten, Prop-Bindings, Emits/Eventhandler, ref/reactive/computed und relevante Watcher. Bedingungen werden als mögliche Zweige gezeigt, nicht statisch ausgeführt. Dynamische URLs als Ausdrucksmuster mit Methode darstellen; tatsächliche Route erst mit Laufzeitbeleg konkretisieren.

Backend: Nuxt/Nitro aufgelöste Routen einschließlich dynamischer Parameter, Methoden, serverDir und Layers verwenden; nicht nur startup-scan von server/api. Handler zu lokalen Server-Services verfolgen. Middleware und nicht eindeutig aufgelöste Handler gesondert anzeigen. Routenänderungen invalidieren den Index bei HMR.

Zyklen deduplizieren; Standardbudgets 100 Dateien, 300 Knoten, 12 Traversal-Level. Größere Bereiche explizit nachladen; begrenzte Resultate tragen sichtbaren Grund. Cache nach Inhalt/Resolver-Konfiguration, gezielte HMR-Invalidierung und Abbruch veralteter Auswahljobs. Analyse darf keinen User-Code ausführen.

## 7. Laufzeit und Attribution

Dev-only AST-Instrumentierung an unterstützten Call-Sites verbindet source/symbol IDs mit Request-Aufrufen und Event-Entrypoints; Sourcemaps bewahren. Nicht pauschal jede Funktion wrappen. Sync-Werte, this, Exceptions, Promise-Identität, AbortSignal, Fetch-Optionen und Fehlerverhalten dürfen sich nicht ändern.

Ein globaler Stack ist über await hinweg nicht ausreichend. Client-Request-Adapter erhalten Kontext explizit an der instrumentierten Call-Site. useFetch/useAsyncData-SSR und Hydration erhalten getrennte, über sichere Payload-Metadaten verbundene IDs. Deduplication und von mehreren Komponenten gemeinsam genutzte Requests zeigen mehrere Konsumenten statt willkürlicher Zuordnung.

Nur lokale konfigurierte Requests erhalten interne Korrelationsheader; niemals Credentials oder IDs an beliebige fremde Hosts senden. Nitro propagiert Request-Kontext mit AsyncLocalStorage für unterstützte Node-Runtime. Edge-Runtime zunächst als nicht unterstützt markieren. Server-Trace wird über geschützten Kanal geliefert; Header tragen maximal kleine IDs statt kompletten Code-/SQL-Payloads.

fetch, Nuxt $fetch und erfasste ofetch.create-Instanzen; fehlgeschlagene/abgebrochene Requests als eigene Ergebnisse. XHR/axios als zusätzliche Adapter nach dem Nuxt-Kern. Requests vor UI-Mount müssen ab frühem Plugin-Setup gepuffert werden. Ownership-sichere Wrapper, HMR-Dispose, reconnect, server shutdown und getrennte Tabs/Sessions testen.

## 8. Realistischer Playground

EmployeeDetailPage lädt über useEmployee → employeeApi.getById → GET /api/employees/:id → getEmployee → employeeRepository.findById. PayslipList lädt parallel über usePayslips → payrollApi.list → GET /api/employees/:id/payslips → listPayslips → payrollRepository.listForEmployee. SalarySummary erhält Props und abgeleitete Werte, ohne eigenen Request.

DownloadPayslipButton führt erst bei normalem Klick payrollApi.download → GET /api/payslips/:id/download → downloadPayslip → renderPayslip aus. Vorher gestrichelt „nicht beobachtet“, danach Trace/Status und Backend-Pfad. Inspector-Auswahl per Alt/Pick löst die Aktion nicht aus. Demo liefert einen echten lokal erzeugten Download, keinen gefälschten Graphen.

EmployeeActions speichert eine Änderung per PATCH und hat eine bewusst fehlschlagende Demo-Aktion. Zwei Mitarbeiterinstanzen benutzen gleiche Routenmuster: Tests beweisen die getrennte Attribution. Loading, Empty, Error, Retry und Abort sind sichtbar. Fixtures ohne echte Personendaten; In-memory-Repositories explizit als solche beschriften, keine erfundenen SQL-Knoten.

## 9. SQL, Tabellen und erweiterte Parität

Nach Kern-Abnahme: optionaler lokaler PostgreSQL-Demo-Adapter, dann pg/Drizzle/node-postgres und Prisma mit kompatiblem Treiberadapter als separat getestete Integrationen. Queries dem Request-Kontext zuordnen, aufrufende Code-Stelle, Dauer und Row-Count soweit verfügbar zeigen. Parameter standardmäßig redigieren; SQL-Ausdrücke können selbst sensible Literale enthalten und brauchen Redaction/Opt-in.

Schema: Tabellen, Spalten, PK/FK und Beziehungen beide Richtungen. Metadatenzugriff explizit aktivieren und Read-only-Credentials bevorzugen. Keine automatischen Schemaänderungen. Change-History nur eigener Opt-in mit erklärter Last, Installation und Deinstallation; nicht Teil der Standardinstallation. MySQL und weitere Treiber danach mit eigener Support-Matrix.

## 10. Sicherheit und Ressourcenschutz

Nur Entwicklung; kein Inspector, Auth/RPC, Trace-Header oder Instrumentierung im Produktionsbundle. Projektregistrierte .vue/.ts/.js-Dateien innerhalb expliziter erlaubter Roots; serverDir/Layers nur nach Registrierung. realpath-Prüfung verhindert Traversal und Symlink-Escape; .env, Credentials, node_modules und beliebige Dateipfade ablehnen. Originalquellcode kann Geheimnisse enthalten: lokal/authentifiziert, kein automatisches Teilen.

History pro Session begrenzen, graph/source/payload budgets, RPC-Rate-Limits und Retention-Clear. Pro Session höchstens 100 Requests und 2.000 Span-Events mit sichtbarer Truncation. DB-Metadaten und Bodies nicht standardmäßig speichern. CSS/Fonts ohne externe Requests. Vor Browserprüfungen Prozesse inventarisieren, vorhandene Session nutzen, nur eigene Tabs/Worker schließen; den vom Nutzer gewünschten Devserver erhalten.

## 11. Umsetzung in abnehmbaren Phasen

1. **Vertrag und Fixtures:** Graph-Vertrag/Registry, Symbol-Fixtures, Ist-/Ziel-Dokumente getrennt halten. Tests für stabile IDs, Evidence-Merge und verbotene Quellen. Ergebnis: geprüfte Graphdaten ohne UI-Versprechen.
2. **Sichtbarer Graph und Demo:** Inspector in kleine Komponenten zerlegen, Vue Flow + Layout, Graph/List und echter Code pro Knoten; Demo-Komponenten/Services/Endpoints. Vorläufige URL-Korrelation bleibt ausdrücklich Hinweis. Ergebnis: das screenshotähnliche Erlebnis mit echten statischen Verzweigungen.
3. **Analyse-Tiefe:** Member-Calls, Barrels/Aliase/Autoimports, Template-Props/Events/State, Nitro-Services und HMR. Ergebnis: jede Demo-Verzweigung bis zur Backend-Funktion erklärbar.
4. **Beobachtete Ausführung:** Call-Site-Kontext, Browser/SSR/Nitro-Trace, Request-Korrelation, Fehler/Abort und Session-Isolation. Ergebnis: executed/possible werden durch Belege statt URL-Raten unterschieden.
5. **Härtung und Portabilität:** Nuxt 4 und separate Nuxt-3-Fixture, Standalone Vue/Vite, Accessibility, Responsive/Shadow-root, Performance, Reconnect/Dispose und Production-Gate. Ergebnis: lokale Modulinstallation und getestete Adapter.
6. **Datenbank-Parität:** echte optionale PostgreSQL-Demo, Treiber/ORM-Spans und Schemaansicht; Change-History gesondert. Ergebnis: UI → SQL → Tabellen mit klarer Support-Matrix.
7. **Distribution und Host:** installierbare Paketexports/build, README/Beispiele/License/Upstream-Hinweise, optionaler Vite-DevTools-Host. GitHub-Veröffentlichung/Paketpublikation separat, nicht automatisch durch diesen Plan autorisiert.

Phase 2 ist keine abgeschlossene vollständige Portierung. Kern fertig erst nach Phase 5; volle vereinbarte DB-Parität erst nach Phase 6. Kein erfundener Gesamtzeitpunkt vor dem Instrumentierungs-Spike in Phase 4.

## 12. Abnahme und Verifikation

- Alt-Auswahl eines echten Demo-Elements öffnet dessen Vue-Kette und gerichteten Graphen. Breadcrumb-Auswahl ändert den Analyse-Root; gewöhnliche Aktionen bleiben bedienbar.
- EmployeeDetailPage zeigt beide parallelen Fetch-Zweige; Download ist vor Ausführung sichtbar. Node-Klick öffnet richtige Datei und exakte Zeilen für Vue, Composable, Client-Service, Handler und Server-Service. Editor-Link benutzt dieselbe sichere Registry.
- SalarySummary erklärt Props-Herkunft und behauptet keinen eigenen Request. Gleichnamige Funktionen aus anderen Dateien und unaufgerufene Exports erzeugen keine falschen Kanten.
- Nach Download erscheinen echte Methode/Status/Dauer und belegte Trace-Verbindungen. Fehler und Abort bleiben erkennbar. Gleiche URL in anderer Instanz ist kein Kausalitätsbeweis.
- Graph/List zeigen gleiche Daten; Zoom/Fit, Suche, Keyboard, Fokus, Resize, 390px mobile und Reduced Motion funktionieren. Shadow-root wird nicht von Host-CSS gebrochen.
- Unit-Fixtures für Aliase, Member-Calls, Barrels, Zyklen, dynamische URLs, source mapping, Vue-Bindings, Route-Parameter und Analysegrenzen; Parserfehler liefern Diagnose statt leeres Erfolgsergebnis.
- Integrationstests für Browser→Nitro und SSR→Hydration, Reconnect, mehrere Sessions, HMR/dispose und async Kontextisolation. Instrumentiertes/uninstrumentiertes Verhalten inklusive this, Abort, Exceptions und Timinggrenzen vergleichen.
- Securitytests für Auth/Origin, fileId-Traversal/Symlinks, Redaction, große Payloads und Grenzen. Production-build-Artefakte auf Instrumentierung, Inspector, RPC und Traceheader scannen.
- Performance-Benchmark mit 100 Knoten: nach warmem Cache Ziel p95 Auswahl→Graph unter 500ms auf dokumentierter Testmaschine; Hintergrundanalyse abbrechbar, große Graphen gefaltet. Ergebnis messen, nicht ohne Messung behaupten.
- pnpm test, pnpm typecheck, pnpm build; Browser-E2E plus tiefer frontend-finish-Pass bei UI-Abnahme. Nicht durchgeführte Checks ausdrücklich dokumentieren.

## 13. Entscheidungen und Quellen

Siehe [ADR 001](../decisions/active/001-hybrid-component-explorer.md).

Primärquellen, geprüft 2026-10-08: [Feel-Funktionen/Support](https://github.com/Nirbhay71/Feel-your-project), [Vue Flow](https://vueflow.dev/), [elkjs](https://github.com/kieler/elkjs), [Devframe](https://github.com/devframes/devframe). Vue Flow liefert Interaktionen und Rendering, elkjs nur Layout; unsere Analyse/Attribution bleibt eigene Arbeit. Diese Quellen bestätigen nicht, dass unsere geplante Implementierung bereits funktioniert.
