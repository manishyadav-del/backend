/**
 * Normalizes media structures (images, videos, documents) for target website renderers.
 */
export function normalizeMediaData(media) {
  if (!media) return null;
  return {
    id: media.id,
    filename: media.filename || '',
    url: media.url || '',
    mimeType: media.mimeType || 'image/jpeg',
    size: media.size || 0,
    altText: media.altText || ''
  };
}
