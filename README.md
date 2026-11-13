<div align="center">

# ⑂ Scenario Workbench

**Every question deserves a good next step.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-8caa83?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue branching-scenario editor with a linked decision graph, KeepAlive trial notes, validated paths, and JSON scenario and run-report exports._

</div>

---

## ✨ Highlights

- **Step Editing:** Edit up to 20 question/result steps, with 1–4 choices per question.
- **Decision Graph:** Map actual links in a scrollable graph; select nodes to edit their content.
- **Branch Building:** Choose the entry step, create outcomes, and connect new branches.
- **Trial Journey:** Run a trial journey, go back, and keep a separate note for every visited step.
- **Graph Validation:** Reject missing destinations, unsafe identities, and cycles; flag disconnected steps.
- **Import & Reports:** Export/import SW/1 scenarios and export completed run reports.
- **Local Workspace:** Validated device-local persistence and imports that preserve the current workspace on failure.
- **Project Identity:** Original favicon and social artwork, CodeSculptor attribution, and deterministic configuration stamps.

## 🧱 Project Structure

```text
public/
|-- favicon.svg                                   # Original project favicon
|-- og.svg                                        # Original social artwork
`-- sample-workspace.json                         # Complete importable sample
src/
|-- components/
|   |-- AppDialog.vue                             # Teleport native dialog and focus lifecycle
|   |-- AppIcon.vue                               # Inline SVG interface icons
|   |-- ScenarioMap.vue                           # Declared links, layout, and node selection
|   |-- ScenarioRunner.vue                        # Trial journey and KeepAlive cache
|   `-- ScenarioStep.vue                          # Question/result view with local notes
|-- domain/
|   `-- scenario.ts                               # SW/1 graph validation, samples, and run reports
|-- services/
|   |-- draft.ts                                  # Validated local draft persistence
|   `-- files.ts                                  # Downloads, cloning, and identity stamps
|-- App.vue                                       # Workspace, controls, and data exchange
|-- base.css                                      # Tailwind theme and native element defaults
|-- main.ts                                       # Vue application entry
`-- style.css                                     # Brand tokens and domain-specific styles
tests/
|-- e2e/
|   `-- workbench.spec.ts
`-- scenario.test.ts
index.html                         # English metadata and application mount
package.json                       # Local dependencies and npm commands
playwright.config.ts               # Production browser workflows
vite.config.ts                     # Vue and Tailwind plugins
vercel.json                        # Explicit routes, caching, and headers
```

## 🛠️ Tech Stack

Vue 3, TypeScript 6, Vite 8, and Tailwind CSS 4. Locally bundled DM Sans and Bricolage Grotesque fonts. Prettier for formatting, Node's test runner for domain/export checks, and Playwright for production browser workflows. Dependencies are installed inside this project.

KeepAlive preserves local step notes, while computed values derive the graph and trial state.

## 🎨 Tailwind Styling

The application uses Tailwind CSS 4 utilities directly in Vue templates for layout, spacing, typography, borders, colors, and visible states. Responsive and selector variants preserve the existing desktop and narrow-screen layouts. Utility names are complete source strings that Tailwind can detect during the Vite build.

`src/base.css` defines the font and spacing theme, maps project colors through `@theme inline`, and uses `@apply` for native element defaults. `src/style.css` holds the original brand tokens and any remaining domain-specific rules. Dynamic classes express Vue states, while explicit `data-ui` attributes identify elements used by descendant utilities or browser tests. Unused class names are removed. The spacing unit is `4px` to preserve the original pixel measurements independently of the root font size.

Cached scenario components keep their local state while their layouts and controls use utilities.

## 📦 Included Demo Data

`public/sample-workspace.json` is a complete importable SW/1 sample. Defaults also live in the domain module, so the app starts without waiting for a network request. Import uses the same validation as stored drafts and preserves the current workspace on failure.

The sample supplies a complete fictional branching journey with questions and results. The scenario persists locally; trial history and step notes belong to the current session.

## 🚀 Local Development

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`. To serve the production build:

```bash
npm run build
npm run preview
```

## ◈ Vue Implementation

`KeepAlive` caches keyed `ScenarioStep` instances, preserving local notes when navigating back or revisiting a branch. A restart changes the cache key and clears the run. `computed` derives current steps, graph layout, validation, and reachability. `Teleport` and native dialogs handle data exchange and restore focus.

## 💾 Local Drafts & Data Exchange

Valid edits save to localStorage on this device. Invalid intermediate edits preserve the last valid save; unavailable storage is reported in the UI. Corrupted stored data restores the sample. Restore uses a confirmation dialog because it replaces the saved draft. Export before clearing browser storage or switching devices.

## ◈ Project Markers

Export provenance identifies `vue-scenario-workbench`, CodeSculptor, and a deterministic `SW-XXXXXXXX` checksum. The same configuration produces the same stamp; edits change it. This is an identity aid, not a cryptographic signature or a uniqueness guarantee. No tracking request accompanies it.

## 🔌 Extension Notes & Nuances

Scenarios are directed acyclic graphs; deliberate loops are rejected. Disconnected steps are allowed during editing and are visibly flagged. Questions need at least one choice; terminal results have none. The starting step and last result cannot be removed. Removing a linked step redirects incoming choices to another result. Editing the schema restarts the trial journey. Notes and run history are session-only, while the schema persists locally. No operational action is executed.

Text uses Vue interpolation. Import limits collection and string sizes, validates references and enums, and reconstructs known properties. Unrecognized metadata is ignored on import. Editor and trial panels reserve space while selecting steps; the graph, step content, and export previews scroll internally. The UI supports narrow screens and reduced motion.

The social artwork is SVG. Convert it to PNG for services that require a raster image.

## 🧪 Build & Checks

```bash
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit checks cover sample reachability, dangling links, cycles, step identities, graph layout, and configuration stamps. Browser checks exercise branching journeys, KeepAlive notes on revisits, completed run reports, graph editing, persistence, failed imports, and narrow-screen stability. Browser tests use the production build; test results and traces are Git-ignored.

## 🌐 Pages & Vercel Deployment

- `/` — application workspace
- `/sample-workspace.json` — importable SW/1 fixture

Import this project directory as the Vercel project root. The configuration uses the Vite preset, `npm ci`, `npm run build`, and `dist`. The custom development command forwards Vercel's `$PORT` to Vite with `--strictPort`.

- `/` serves the application; `/index.html` permanently redirects to `/`.
- Trailing slashes are removed; there is no catch-all SPA rewrite.
- HTML, sample JSON, icons, and social artwork require revalidation.
- Content-hashed JS, CSS, and fonts in `/assets/` receive a one-year immutable cache policy.
- Responses include `X-Content-Type-Options: nosniff` and a referrer policy.
- Static files remain reachable at their original paths; missing files do not fall back to HTML.

Vite preview checks the built application; it does not emulate Vercel routing or response headers. Configuration validation and local route evaluation cannot replace HTTP checks against an actual Vercel deployment.

## 📄 License

MIT License. See [LICENSE](./LICENSE).
