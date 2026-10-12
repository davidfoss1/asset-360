# File inventory: Asset 360

Reviewed commit `cd895f15af322d7e34af14464087f78e4760b15b`. Every `.ts`/`.tsx` under `src/` (excluding `node_modules`, `dist`, `.cognite-bundles`) plus config files. Lines are physical lines.

Legend: ✓ good, ~ partial, ✗ problem, n/a not applicable.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| `src/App.test.tsx` | 202 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/App.tsx` | 111 | ✓ | ✓ | ✓ | ✓ (App.test.tsx) | Composition root: host connect, providers, layout. Cancels in-flight connect on unmount. |
| `src/__mocks__/nodes.ts` | 31 | ✓ | ✓ | ✓ | n/a (test support) | Node factory. |
| `src/__mocks__/stubLayout.ts` | 15 | ✓ | ✓ | ✓ | n/a (test support) | happy-dom layout stub for virtualized grids. |
| `src/__mocks__/viewModelWrapper.tsx` | 56 | ✓ | ✓ | ✓ | n/a (test support) | assert.fail defaults for unimplemented mocks. |
| `src/cognite-file-viewer/CogniteFileViewer.tsx` | 480 | ~ | ✗ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. 480 lines mixing data fetching, viewport state and rendering. |
| `src/cognite-file-viewer/DocumentAnnotationOverlay.tsx` | 230 | ~ | ✗ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/cognite-file-viewer/fileResolution.ts` | 133 | ~ | ~ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/cognite-file-viewer/index.ts` | 41 | ~ | ✓ | ~ | n/a | Vendored barrel/types. |
| `src/cognite-file-viewer/mimeTypes.ts` | 172 | ~ | ✗ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/cognite-file-viewer/types.ts` | 190 | ~ | ✓ | ~ | n/a | Vendored barrel/types. |
| `src/cognite-file-viewer/useDocumentAnnotations.ts` | 269 | ~ | ✗ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/cognite-file-viewer/useFileResolver.ts` | 123 | ~ | ~ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/cognite-file-viewer/useViewport.ts` | 281 | ~ | ✗ | ~ | ✗ | Vendored from the integrate-file-viewer skill. Excluded from lint and coverage. Hidden lint errors, 0% coverage. |
| `src/components/SectionState.test.tsx` | 59 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/components/SectionState.tsx` | 52 | ✓ | ✓ | ✓ | ✓ | Shared loading/error/empty wrapper (Aura Skeleton, Alert, EmptyState). |
| `src/config/model.test.ts` | 57 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/config/model.ts` | 29 | ✓ | ✓ | ✓ | ✓ | Only place with view ids; cdf_cdm views only. |
| `src/deps/AppDepsContext.ts` | 15 | ✓ | ✓ | ✓ | ~ (via integration) | Service injection context. |
| `src/deps/AppDepsProvider.tsx` | 30 | ✓ | ✓ | ✓ | ✗ | Builds real services from SDK client; optional override for tests. |
| `src/deps/useAppDeps.ts` | 10 | ✓ | ✓ | ✓ | ~ (via integration) | Throws outside provider. |
| `src/features/activities/ActivitiesSection.test.tsx` | 74 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/activities/ActivitiesSection.tsx` | 35 | ✓ | ✓ | ✓ | ✓ | Aura DataGrid. |
| `src/features/activities/useActivitiesViewModel.test.tsx` | 67 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/activities/useActivitiesViewModel.ts` | 31 | ✓ | ✓ | ✓ | ✓ |  |
| `src/features/asset/AssetHeader.test.tsx` | 60 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/asset/AssetHeader.tsx` | 32 | ✓ | ✓ | ✓ | ✓ | Presentational. |
| `src/features/asset/useAssetViewModel.test.tsx` | 66 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/asset/useAssetViewModel.ts` | 32 | ✓ | ✓ | ✓ | ✓ |  |
| `src/features/files/FilePreview.tsx` | 18 | ✓ | ✓ | ✓ | ✗ | Thin wrapper over vendored viewer; no test (0%). |
| `src/features/files/FilesSection.test.tsx` | 108 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/files/FilesSection.tsx` | 87 | ✓ | ✓ | ✓ | ✓ | Aura DataGrid + lazy preview; Preview injectable. |
| `src/features/files/useFilesViewModel.test.tsx` | 104 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/files/useFilesViewModel.ts` | 42 | ✓ | ✓ | ✓ | ✓ |  |
| `src/features/search/AssetSearch.test.tsx` | 96 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/search/AssetSearch.tsx` | 103 | ✓ | ✓ | ✓ | ✓ | Popover + Command typeahead, 300 ms debounce with effect cleanup. 103 lines. |
| `src/features/search/useSearchViewModel.test.tsx` | 101 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/search/useSearchViewModel.ts` | 40 | ✓ | ✓ | ✓ | ✓ |  |
| `src/features/timeseries/TimeSeriesChart.tsx` | 42 | ✓ | ✓ | ✓ | ~ (via section test) | Aura chart; Recharts internals not exercised in happy-dom (50% lines). |
| `src/features/timeseries/TimeSeriesSection.test.tsx` | 126 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/timeseries/TimeSeriesSection.tsx` | 79 | ✓ | ✓ | ✓ | ✓ | Picker + chart + summary. Combobox onValueChange branch untested. Local `keyOf` helper. |
| `src/features/timeseries/summarize.test.ts` | 26 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/timeseries/summarize.ts` | 20 | ✓ | ✓ | ✓ | ✓ | Pure. |
| `src/features/timeseries/useTimeSeriesViewModel.test.tsx` | 193 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/timeseries/useTimeSeriesViewModel.ts` | 102 | ✓ | ✓ | ✓ | ✓ | 30 s refetchInterval (visible only); two requests per tick. |
| `src/features/workspace/AssetWorkspace.test.tsx` | 84 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/features/workspace/AssetWorkspace.tsx` | 56 | ✓ | ✓ | ✓ | ✓ | Layout and Aura Tabs; root w-full min-w-0. |
| `src/lib/format.test.ts` | 27 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/lib/format.ts` | 13 | ✓ | ✓ | ✓ | ✓ | Intl formatters. |
| `src/lib/loadStatus.test.ts` | 32 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/lib/loadStatus.ts` | 19 | ✓ | ✓ | ✓ | ✓ | Maps react-query result to LoadStatus; keeps stale data on failed refetch. |
| `src/lib/properties.test.ts` | 58 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/lib/properties.ts` | 36 | ✓ | ✓ | ✓ | ✓ | Type-guard readers; no casts. |
| `src/lib/utils.ts` | 7 | ✓ | ✗ | ✓ | ✗ | Starter `cn` helper. Imported nowhere (unused file). |
| `src/main.tsx` | 25 | ✓ | ✓ | ✓ | n/a | Entry; QueryClient defaults (staleTime 5 min, gcTime 10 min), no retry override. Excluded from coverage (allowed). |
| `src/services/AssetService.test.ts` | 158 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/services/AssetService.ts` | 108 | ✓ | ✓ | ✓ | ✓ | Interface + class + factory. Search limit 50, local AND filter, 3 parallel name lookups. |
| `src/services/DatapointsService.test.ts` | 127 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/services/DatapointsService.ts` | 63 | ✓ | ✓ | ✓ | ✓ | Interface + class + factory. Aggregates by instanceId, ~300 points. |
| `src/services/RelatedDataService.test.ts` | 227 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/services/RelatedDataService.ts` | 158 | ✓ | ✓ | ✓ | ✓ | Interface + class + factory. instances.list with containsAny, limit 100, local activity sort. |
| `src/state/AppStateContext.ts` | 18 | ✓ | ✓ | ✓ | ✓ (via provider tests) | Context type. |
| `src/state/AppStateProvider.test.tsx` | 160 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/state/AppStateProvider.tsx` | 49 | ✓ | ✓ | ✓ | ✓ | Host-synced state owner. Stale-closure limitation if two updates in one tick. |
| `src/state/appState.test.ts` | 60 | ✓ | ✓ | ✓ | n/a | Test file. Typed mocks, Arrange/Act/Assert, no vi.mock. |
| `src/state/appState.ts` | 51 | ✓ | ✓ | ✓ | ✓ | Pure parse/serialize with guards. |
| `src/state/useAppState.ts` | 10 | ✓ | ✓ | ✓ | ✓ (via provider tests) | Throws outside provider. |
| `vitest.config.ts` | 27 | ✓ | ✓ | n/a | n/a | Coverage include is src; excludes the vendored viewer (finding M1). |
| `vite.config.ts` | 33 | ✓ | ✓ | n/a | n/a | optimizeDeps excludes pdfjs-dist (required by the viewer worker). |
| `vitest.setup.ts` | 2 | ✓ | ✓ | n/a | n/a | jest-dom only. |
| `eslint.config.mjs` | 98 | ✓ | ✓ | n/a | n/a | Ignores src/cognite-file-viewer (finding M3). |
