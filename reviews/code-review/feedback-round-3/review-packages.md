# Package audit: Asset 360, round 3

Commands: `npm outdated --json`, `npm audit --json`, `npm view <pkg> dist-tags` and `npm view <pkg> deprecated` for the packages flagged below.

Data note: `npm outdated` reported `@cognite/aura` latest `1.46472.0` and `@cognite/app-sdk` latest `0.46522.0`. `npm view ... dist-tags` on the same registry returns `1.46571.0` and `0.11.0`. The `npm view` values are used below. The `npm outdated` values for `typescript`, `vite` and `eslint` were not re-checked with `npm view`.

Health rules (from `flows-review-checks`): Pass = up to date or at most one minor behind, with no critical or high CVEs. Warn = one major behind in `dependencies`, or a moderate CVE. Fail = two or more majors behind, a high or critical CVE, or deprecated.

## Dependencies

### Production (`dependencies`)

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.0 | no | none | Warn (two minors behind on the 0.x line) |
| @cognite/aura | 0.3.5 | 1.46571.0 | no | 4 low, transitive (see below) | Warn (one major behind) |
| @cognite/sdk | ^10.10.0 | current (not in `npm outdated`) | no | none | Pass |
| @tabler/icons-react | ^3.35.0 | current (not in `npm outdated`) | no | none | Pass |
| @tanstack/react-query | ^5.90.10 | current (not in `npm outdated`) | no | none | Pass |
| @tanstack/react-table | 8.21.3 | 9.2.8 | no | none | Warn (one major behind) |
| @tanstack/react-virtual | ^3.14.14 | current (not in `npm outdated`) | no | none | Pass |
| react | 18.3.1 | 19.3.0 | no | none | Warn (one major behind) |
| react-dom | 18.3.1 | 19.3.0 | no | none | Warn (one major behind) |
| recharts | ^3.10.1 | current (not in `npm outdated`) | no | none | Pass |

No production dependency is two or more majors behind, so none is Fail.

### Development (`devDependencies`), for information

| Package | Used version | Latest | CVEs | Health |
| ------- | ------------ | ------ | ---- | ------ |
| vitest | 4.1.10 | 5.0.4 | moderate, fixed in 4.1.11 | Warn (moderate CVE; the 4.1.11 patch is the fix) |
| @vitest/coverage-v8 | 4.1.10 | 5.0.3 | moderate, fixed in 4.1.11 | Warn |
| @vitest/ui | 4.1.10 | 5.0.3 | moderate, fixed in 4.1.11 | Warn |
| vite | 7.3.7 | 8.3.4 | none | Warn (one major behind, dev only) |
| typescript | 5.9.3 | 7.0.2 | none | Warn (one major behind, dev only; not re-checked with `npm view`) |
| eslint | 9.39.4 | 10.12.0 | none | Warn (one major behind, dev only; not re-checked with `npm view`) |
| @eslint/js | 9.39.4 | 10.0.1 | none | Warn (one major behind, dev only) |
| @testing-library/jest-dom | 6.9.1 | 7.0.1 | none | Warn (one major behind, dev only) |
| @vitejs/plugin-react | 5.2.0 | 6.1.2 | none | Warn (one major behind, dev only) |
| @types/react, @types/react-dom | 18.3.x | 19.3.0 | none | Warn (one major behind, dev only) |

Deprecation: `npm view <pkg> deprecated` returned nothing for `@cognite/aura`, `@cognite/app-sdk`, `react` or `vitest`. Not checked for the other packages, since none of them is flagged for another reason.

## Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 4 |
| Info | 0 |

Total: 8 advisories (`npm audit --json` metadata).

### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| vitest | moderate | affects `vitest` 2.1.0-beta.1 to 4.1.10 | 4.1.11 | title and advisory URL not captured by the JSON parse; see `npm audit` |
| @vitest/coverage-v8 | moderate | range 2.1.0-beta.1 to 4.1.10 (via `vitest`) | 4.1.11 | as above |
| @vitest/mocker | moderate | range 2.1.0 to 4.1.10 (via `vitest`) | 4.1.11 | as above |
| @vitest/ui | moderate | range 2.1.0-beta.1 to 4.1.10 (via `vitest`) | 4.1.11 | as above |
| @cognite/aura | low | transitive, via `mermaid` and `@streamdown/mermaid` | none clean in 0.3.5 | `npm audit` suggests `@cognite/aura@0.1.2`, which is a downgrade and not a fix; a newer Aura release is needed |
| @streamdown/mermaid | low | transitive | as above | as above |
| mermaid | low | range >=10.9.0-rc.1 (via `@cognite/aura`) | as above | as above |
| katex | low | range 0.11.0 to 0.18.1 (via `@cognite/aura`) | as above | as above |

Assessment: the moderate items are all in the test runner (devDependencies) and have a patch-level fix in 4.1.11. The low items come through Aura's diagram and maths rendering. The app does not render mermaid or katex from user content as far as this review found, but the exposure is still inherited from Aura's dependency tree and is not closed by an upgrade in this repo.

## Score input

- 1.3 Dependencies and packages: **3**. No critical or high CVEs and no deprecated production package. Three production packages are one major (or two `0.x` minors) behind, with no upgrade plan written down. That matches the 3 band ("outdated deps; plan to upgrade documented"), with the plan missing. See findings S1 and N2.
