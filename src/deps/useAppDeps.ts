import { useContext } from 'react';

import { AppDepsContext, type AppDeps } from './AppDepsContext';

export function useAppDeps(): AppDeps {
  const deps = useContext(AppDepsContext);
  if (!deps) throw new Error('useAppDeps must be used inside an AppDepsProvider');
  return deps;
}
