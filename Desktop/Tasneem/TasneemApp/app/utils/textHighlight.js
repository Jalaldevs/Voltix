// textHighlight.js — Helper to mark matched substrings for search result display

/**
 * Split `text` into segments, each tagged with `highlight: true/false`
 * based on which parts match any of the `terms`.
 *
 * @param {string} text   — the full text to highlight in
 * @param {string[]} terms — search tokens (case-insensitive)
 * @returns {Array<{text: string, highlight: boolean}>}
 */
export const highlightTerms = (text, terms) => {
  if (!text || !terms || terms.length === 0) {
    return [{ text: text || '', highlight: false }];
  }

  // Build a combined regex that matches any term (escaped for special chars)
  const escaped = terms
    .filter((t) => t && t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) {
    return [{ text, highlight: false }];
  }

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  if (parts.length <= 1) {
    return [{ text, highlight: false }];
  }

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlight: pattern.test(part) && (() => { pattern.lastIndex = 0; return true; })(),
    }))
    // Re-check properly since regex lastIndex can be tricky with .test
    .map((segment) => {
      const isMatch = escaped.some(
        (e) => segment.text.toLowerCase() === e.toLowerCase() ||
          new RegExp(`^${e}$`, 'i').test(segment.text)
      );
      return { text: segment.text, highlight: isMatch };
    });
};

/**
 * Truncate text around the first match for preview display.
 * Returns a substring with context around the first matched term.
 *
 * @param {string} text
 * @param {string[]} terms
 * @param {number} contextChars — characters of context around the match
 * @returns {string}
 */
export const getMatchPreview = (text, terms, contextChars = 60) => {
  if (!text || !terms || terms.length === 0) return (text || '').slice(0, contextChars * 2);

  const lowerText = text.toLowerCase();
  let firstMatchIndex = -1;

  for (const term of terms) {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx !== -1 && (firstMatchIndex === -1 || idx < firstMatchIndex)) {
      firstMatchIndex = idx;
    }
  }

  if (firstMatchIndex === -1) return text.slice(0, contextChars * 2);

  const start = Math.max(0, firstMatchIndex - contextChars);
  const end = Math.min(text.length, firstMatchIndex + contextChars);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';

  return `${prefix}${text.slice(start, end)}${suffix}`;
};
