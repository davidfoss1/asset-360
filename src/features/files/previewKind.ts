export type PreviewKind = 'image' | 'external';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

/**
 * How a file can be shown. Images render inline. Everything else, including PDFs, opens in a new
 * browser tab: the app CSP has `frame-src 'self'` and `object-src 'none'`, so a PDF cannot be framed.
 * The mime type wins; the extension is only a fallback when there is none.
 */
export function previewKind({ name, mimeType }: { name: string; mimeType?: string }): PreviewKind {
  if (mimeType) return mimeType.toLowerCase().startsWith('image/') ? 'image' : 'external';
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension)) ? 'image' : 'external';
}
