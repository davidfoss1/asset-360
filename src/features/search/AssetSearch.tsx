import { Alert, AlertActions, AlertButton, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cognite/aura/components/command';
import { Loader } from '@cognite/aura/components/loader';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { IconCaretUpDown } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { useAssetViewModel } from '../asset/useAssetViewModel';

import { useSearchViewModel } from './useSearchViewModel';

type AssetSearchProps = {
  /** How long to wait after the last keystroke before searching. */
  debounceMs?: number;
};

/**
 * Type-ahead asset search. Built from Aura's Popover + Command (the pieces behind Aura's Combobox)
 * because Combobox filters a fixed option list on the client, while this searches CDF as you type.
 */
export function AssetSearch({ debounceMs = 300 }: AssetSearchProps) {
  const { query, setQuery, status, results, limited, selectAsset, retry } = useSearchViewModel();
  const { asset } = useAssetViewModel();

  // Open/closed and the text being typed are transient; only the committed query is host-synced.
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (draft === query) return;
    const timer = setTimeout(() => setQuery(draft), debounceMs);
    return () => clearTimeout(timer);
  }, [draft, query, setQuery, debounceMs]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" role="combobox" aria-label="Asset" aria-expanded={open} className="w-full justify-between">
            {asset?.name ?? 'Search assets…'}
            <IconCaretUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-96 p-0">
        {/* The server already ranks results, so Command must not re-filter or re-sort them. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by tag, name or description"
            value={draft}
            onValueChange={setDraft}
          />
          <CommandList>
            {status === 'idle' ? <p className="p-3 text-sm text-muted-foreground">Type to search assets.</p> : null}
            {status === 'loading' ? (
              <div role="status" aria-label="Searching assets" className="flex justify-center p-3">
                <Loader size={20} />
              </div>
            ) : null}
            {status === 'empty' ? (
              <p className="p-3 text-sm text-muted-foreground">
                {limited
                  ? 'None of the top results match. Refine your search to find it.'
                  : 'No assets match your search.'}
              </p>
            ) : null}
            {status === 'error' ? (
              <Alert variant="error">
                <AlertTitle>Search failed</AlertTitle>
                <AlertActions>
                  <AlertButton onClick={retry}>Retry</AlertButton>
                </AlertActions>
              </Alert>
            ) : null}
            {status === 'success' ? (
              <CommandGroup>
                {results.map((result) => (
                  <CommandItem
                    key={`${result.id.space}/${result.id.externalId}`}
                    value={`${result.id.space}/${result.id.externalId}`}
                    onSelect={() => {
                      selectAsset(result.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{result.name}</span>
                      {result.description ? (
                        <span className="text-xs text-muted-foreground">{result.description}</span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {status === 'success' && limited ? (
              <p className="border-t p-3 text-xs text-muted-foreground">
                Showing the first matches only. Refine your search to narrow them.
              </p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
