import { describe, expect, it } from 'vitest';

import { previewKind } from './previewKind';

describe(previewKind.name, () => {
  it.each(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'])(
    'previews %s inline',
    (mimeType) => {
      expect(previewKind({ name: 'file', mimeType })).toBe('image');
    }
  );

  it('opens PDFs externally, because the app CSP blocks inline PDF frames', () => {
    expect(previewKind({ name: 'manual.pdf', mimeType: 'application/pdf' })).toBe('external');
  });

  it('opens other types externally', () => {
    expect(previewKind({ name: 'data.xlsx', mimeType: 'application/vnd.ms-excel' })).toBe('external');
  });

  it('is case-insensitive about the mime type', () => {
    expect(previewKind({ name: 'photo', mimeType: 'IMAGE/PNG' })).toBe('image');
  });

  it('falls back to the file extension when there is no mime type', () => {
    expect(previewKind({ name: 'Diagram.PNG' })).toBe('image');
    expect(previewKind({ name: 'photo.jpeg' })).toBe('image');
  });

  it('opens externally when neither mime type nor extension is a known image', () => {
    expect(previewKind({ name: 'notes' })).toBe('external');
    expect(previewKind({ name: 'archive.zip' })).toBe('external');
  });

  it('trusts the mime type over the extension', () => {
    expect(previewKind({ name: 'misnamed.png', mimeType: 'application/pdf' })).toBe('external');
  });
});
