import type { RawPropertyValueV3 } from '@cognite/sdk';

export type InstanceRef = { space: string; externalId: string };
export type Properties = Record<string, RawPropertyValueV3> | undefined;

export function isInstanceRef(value: unknown): value is InstanceRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'space' in value &&
    typeof value.space === 'string' &&
    'externalId' in value &&
    typeof value.externalId === 'string'
  );
}

export function readString(properties: Properties, key: string): string | undefined {
  const value = properties?.[key];
  return typeof value === 'string' ? value : undefined;
}

export function readStringList(properties: Properties, key: string): string[] {
  const value = properties?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function readInstanceRef(properties: Properties, key: string): InstanceRef | undefined {
  const value = properties?.[key];
  return isInstanceRef(value) ? { space: value.space, externalId: value.externalId } : undefined;
}

export function readInstanceRefList(properties: Properties, key: string): InstanceRef[] {
  const value = properties?.[key];
  return Array.isArray(value) ? value.filter(isInstanceRef).map(({ space, externalId }) => ({ space, externalId })) : [];
}
