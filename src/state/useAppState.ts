import { useContext } from 'react';

import { AppStateContext, type AppStateContextValue } from './AppStateContext';

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside an AppStateProvider');
  return value;
}
