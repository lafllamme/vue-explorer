# ADR 001 — Hybrid-Komponenten-Explorer

Datum: 2026-10-08. Status: angenommen nach Nutzerfreigabe. Renderer/static graph umgesetzt, kontextgebundenes Tracing und DB-Adapter noch ausstehend.

## Problem und Grenzen

Der aktuelle Inspector zeigt eine kleine Hierarchie und Dateilisten statt des gewünschten nachvollziehbaren UI→Funktion→Request→Backend-Graphen. Fehlende Runtime-Daten dürfen nicht als Beleg erfunden werden. Vue/Nuxt, dev-only, UnoCSS-Tokens, sichere lokale Quellen und vorhandener Devframe-Transport bleiben Vorgaben.

## Entscheidung

Versionierter frameworkneutraler Graph mit source ranges und Evidence pro Beziehung. Statische symbolbasierte Analyse für mögliche Aufrufe; kontextgebundenes Tracing für beobachtete Ausführung. Vue Flow als Renderer, elkjs als Layout, Devframe für authentifizierte RPC/Shared-State. Eigenständiger Inspector zuerst; Vite-DevTools-Host optional später. Core ohne DB; optionale DB-Adapter danach.

## Alternativen

Reiner Runtime-Graph übersieht nicht ausgeführte Aktionen. Reiner statischer Graph kann Status/Timing nicht beweisen. Eigener SVG-Renderer erweitert unnötig die Interaktionsarbeit. Ein DevTools-Host allein ersetzt weder Analyse noch Graph-Modell.

## Folgen und Migration

Mehr Implementierungsaufwand als ein neuer UI-Tab, insbesondere async Attribution und Source-Security. Bestehende Liste wird Graph/List-Adapter, read-source bekommt registrierte IDs auch für abhängige Client-/Serverdateien. URL-Matches bleiben Hinweise bis kontextbasierte Traces vorhanden sind. Neue Shadow-root-Styles müssen alle UI-Dateien und Renderer-CSS einschließen. Bestehende Sicherheitsgrenzen nicht durch beliebigen Projekt-Dateizugriff ersetzen.

## Review-Auslöser

Instrumentierung verändert App-Semantik, async Zuordnung bleibt nicht beweisbar, Renderer funktioniert nicht im Shadow-root oder repräsentative Performance-/Lifecycletests scheitern. Dann die betreffende Adapter-/Renderer-Entscheidung prüfen, nicht Belege abschwächen.

Vollständige Anforderungen, Phasen und Abnahme: [Ausbauplan](../../docs/EXPLORER-PLAN.md).
