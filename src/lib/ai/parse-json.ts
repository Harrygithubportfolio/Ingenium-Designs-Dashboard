/**
 * Parses a JSON string from an AI response.
 * Handles clean JSON (Gemini JSON mode) and markdown-wrapped JSON (Claude).
 */
export function parseAiJson<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error(
      'Failed to parse AI response as JSON. Raw text: ' + text.slice(0, 200)
    );
  }
}
