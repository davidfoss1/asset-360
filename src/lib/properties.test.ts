import { describe, expect, it } from 'vitest';

import { readInstanceRef, readInstanceRefList, readString, readStringList } from './properties';

describe(readString.name, () => {
  it('returns a string value', () => {
    expect(readString({ name: 'PUMP-101' }, 'name')).toBe('PUMP-101');
  });

  it('returns undefined for missing, non-string or absent properties', () => {
    expect(readString({ name: 5 }, 'name')).toBeUndefined();
    expect(readString({}, 'name')).toBeUndefined();
    expect(readString(undefined, 'name')).toBeUndefined();
  });
});

describe(readStringList.name, () => {
  it('returns the string items of a list', () => {
    expect(readStringList({ aliases: ['a', 'b'] }, 'aliases')).toEqual(['a', 'b']);
  });

  it('drops non-string items', () => {
    expect(readStringList({ aliases: ['a', 2, null] }, 'aliases')).toEqual(['a']);
  });

  it('returns an empty list when the property is not a list', () => {
    expect(readStringList({ aliases: 'a' }, 'aliases')).toEqual([]);
    expect(readStringList(undefined, 'aliases')).toEqual([]);
  });
});

describe(readInstanceRef.name, () => {
  it('returns a direct relation as an instance ref', () => {
    expect(readInstanceRef({ parent: { space: 's', externalId: 'x' } }, 'parent')).toEqual({
      space: 's',
      externalId: 'x',
    });
  });

  it('returns undefined when the value is not a direct relation', () => {
    expect(readInstanceRef({ parent: 'x' }, 'parent')).toBeUndefined();
    expect(readInstanceRef({ parent: { space: 's' } }, 'parent')).toBeUndefined();
    expect(readInstanceRef({}, 'parent')).toBeUndefined();
  });
});

describe(readInstanceRefList.name, () => {
  it('returns only valid direct relations from a list', () => {
    expect(
      readInstanceRefList({ assets: [{ space: 's', externalId: 'a' }, 'nope', { space: 's' }] }, 'assets')
    ).toEqual([{ space: 's', externalId: 'a' }]);
  });

  it('returns an empty list when the property is missing', () => {
    expect(readInstanceRefList({}, 'assets')).toEqual([]);
  });
});
