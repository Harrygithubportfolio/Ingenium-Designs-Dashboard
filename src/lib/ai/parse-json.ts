/**
 * Parses a JSON string from an AI response.
 * Handles clean JSON (Gemini JSON mode), markdown-wrapped JSON (Claude),
 * and truncated responses where closing fences are missing.
 */
export function parseAiJson<T>(text: string): T {
  // 1. Try raw JSON directly
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // 2. Try extracting from complete markdown code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // continue
    }
  }

  // 3. Strip opening code fence (handles truncated responses with no closing ```)
  const stripped = text.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
  if (stripped !== text.trim()) {
    try {
      return JSON.parse(stripped);
    } catch {
      // continue
    }
  }

  // 4. Find first { and last } — extract the outermost JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  throw new Error(
    'Failed to parse AI response as JSON. Raw text: ' + text.slice(0, 200)
  );
}
