import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { isAssetTab } from '../../state/appState';
import { useAppState } from '../../state/useAppState';
import { ActivitiesSection } from '../activities/ActivitiesSection';
import { AssetHeader } from '../asset/AssetHeader';
import { FilesSection } from '../files/FilesSection';
import { TimeSeriesSection } from '../timeseries/TimeSeriesSection';

/** Everything about the selected asset on one page: header, time series, then activities and files. */
export function AssetWorkspace() {
  const { state, selectTab } = useAppState();

  if (!state.assetId) {
    return (
      <EmptyState type="new-object">
        <EmptyStateTitle>Search for an asset to begin</EmptyStateTitle>
        <EmptyStateDescription>Find equipment by tag, name or description to see its full picture here.</EmptyStateDescription>
      </EmptyState>
    );
  }

  // Each section gets its own boundary, and a new asset gives a crashed section a fresh start.
  const resetKey = `${state.assetId.space}/${state.assetId.externalId}`;

  return (
    // Aura's CardContent is `items-start`: without w-full this shrinks to its widest child (a table).
    <div className="flex w-full min-w-0 flex-col gap-6">
      <ErrorBoundary label="the asset header" resetKey={resetKey}>
        <AssetHeader />
      </ErrorBoundary>

      <section aria-labelledby="time-series-heading" className="flex flex-col gap-3">
        <h3 id="time-series-heading" className="text-lg font-medium">
          Time series
        </h3>
        <ErrorBoundary label="time series" resetKey={resetKey}>
          <TimeSeriesSection />
        </ErrorBoundary>
      </section>

      <Tabs
        value={state.tab}
        onValueChange={(value) => {
          if (isAssetTab(value)) selectTab(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsPanel value="activities">
          <ErrorBoundary label="activities" resetKey={resetKey}>
            <ActivitiesSection />
          </ErrorBoundary>
        </TabsPanel>
        <TabsPanel value="files">
          <ErrorBoundary label="files" resetKey={resetKey}>
            <FilesSection />
          </ErrorBoundary>
        </TabsPanel>
      </Tabs>
    </div>
  );
}
