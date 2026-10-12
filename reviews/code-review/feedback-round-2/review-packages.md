## Package audit: Asset 360 (round 2)

Commands: `npm outdated --json`, `npm audit --json`. Spot checks: `npm view @cognite/aura deprecated` and `npm view @cognite/app-sdk deprecated` (neither deprecated). `package-lock.json` is committed.

Since round 1: `react-pdf`, `clsx` and `tailwind-merge` were removed, so the production dependency that was two majors behind is gone.

### Dependencies (production)

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.46522.0 | no | 0 | Warn (0.x with a date-style version; template-provided) |
| `@cognite/aura` | 0.3.5 | 1.46472.0 | no | 4 low (transitive: `mermaid`, `katex`, `@streamdown/mermaid`) | Warn (1 major behind; npm's suggested "fix" is a downgrade to 0.1.2, so not actionable) |
| `@cognite/sdk` | 10.10.0 | current | no | 0 | Pass |
| `@tabler/icons-react` | 3.x | current | no | 0 | Pass |
| `@tanstack/react-query` | 5.x | current | no | 0 | Pass |
| `@tanstack/react-table` | 8.21.3 | 9.2.8 | no | 0 | Warn (1 major behind; Aura DataGrid peer is `^8.7.4`) |
| `@tanstack/react-virtual` | 3.x | current | no | 0 | Pass |
| `react` / `react-dom` | 18.3.1 | 19.3.0 | no | 0 | Warn (1 major behind; Aura peer is `^18.3.1`) |
| `recharts` | 3.10.1 | current | no | 0 | Pass |

No production dependency is two or more majors behind, deprecated, or carries a high or critical advisory.

### Dev dependencies (informational)

One major behind: `eslint` 9→10, `@eslint/js` 9→10, `typescript` 5.9→7.0, `vite` 7→8, `vitest` and `@vitest/*` 4.1.10→5.0, `@vitejs/plugin-react` 5→6, `@testing-library/jest-dom` 6→7, `@types/react` and `@types/react-dom` 18→19.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 4 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| `vitest` (direct, dev) | moderate | via `@vitest/coverage-v8`, `@vitest/mocker`, `@vitest/ui` | 4.1.11 (non-major) | |
| `@vitest/mocker` (transitive, dev) | moderate | Vitest: Path Traversal / Arbitrary File Read via `@vitest/mocker` Redirect Mock | 4.1.11 | https://github.com/advisories/GHSA-82fw-gwwq-j7x9 |
| `@vitest/coverage-v8` (direct, dev) | moderate | via `vitest` | 4.1.11 | |
| `@vitest/ui` (direct, dev) | moderate | via `vitest` | 4.1.11 | |
| `katex` (transitive, via `@cognite/aura`) | low | KaTeX: Existing prototype pollution can bypass trust restrictions | not fixable here (Aura dependency) | https://github.com/advisories/GHSA-238p-pmpm-9mq7 |
| `mermaid` (transitive) | low | via `katex` | not fixable here | |
| `@streamdown/mermaid` (transitive) | low | via `mermaid` | not fixable here | |
| `@cognite/aura` (direct) | low | via `@streamdown/mermaid` | upstream | |

The moderate advisories are dev-only tooling and are fixed by a patch bump of `vitest`. The low ones sit inside Aura's dependency tree.
