/**
 * Convert verse references like "Psalm 37:8" to "Psalm 37" chapter references.
 */
export function toChapterReference(reference: string): string {
  const match = reference.match(/^(.+?)\s+(\d+)(?::.+)?$/);
  if (!match) {
    return reference.split(':')[0]?.trim() || reference;
  }
  return `${match[1]} ${match[2]}`;
}

/**
 * Build an external BibleGateway URL for a chapter reference.
 */
export function toBibleGatewayChapterUrl(
  chapterReference: string,
  translation: string,
): string {
  const search = encodeURIComponent(chapterReference);
  const version = encodeURIComponent(translation || 'NIV');
  return `https://www.biblegateway.com/passage/?search=${search}&version=${version}`;
}
