import { Badge } from '@cognite/aura/components/badge';

import { SectionState } from '../../components/SectionState';

import { useAssetViewModel } from './useAssetViewModel';

export function AssetHeader() {
  const { status, asset, retry } = useAssetViewModel();

  return (
    <SectionState
      label="asset"
      status={status}
      emptyTitle="Asset not found"
      emptyDescription="It may have been removed, or you may not have access to it."
      onRetry={retry}
    >
      {asset ? (
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-medium">{asset.name}</h2>
          {asset.description ? <p className="text-muted-foreground">{asset.description}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            {asset.assetClass ? <Badge variant="fjord">{asset.assetClass}</Badge> : null}
            {asset.assetType ? <Badge variant="nordic">{asset.assetType}</Badge> : null}
            {asset.parentName ? <span className="text-sm text-muted-foreground">Parent: {asset.parentName}</span> : null}
          </div>
        </header>
      ) : null}
    </SectionState>
  );
}
