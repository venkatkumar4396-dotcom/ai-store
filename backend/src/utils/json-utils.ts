import logger from './logger';

/**
 * Safely parse JSON from AI model responses.
 *
 * AI models often wrap their JSON in markdown code fences, add trailing
 * commas, or include other non-standard artifacts. This helper handles
 * the most common cases so every service doesn't have to repeat the
 * same brittle `replace(/```json/g, '')` one-liner.
 *
 * @param raw      The raw string returned by the AI model.
 * @param context  A human-readable label for log messages (e.g. "startup analysis").
 * @returns        The parsed object, or `null` if parsing fails.
 */
export function safeParseAIJson<T = any>(raw: string, context: string = 'AI response'): T | null {
  if (!raw || typeof raw !== 'string') {
    logger.warn(`safeParseAIJson(${context}): received empty or non-string input`);
    return null;
  }

  let cleaned = raw.trim();

  // 1. Strip markdown code fences (```json ... ```, ```JSON ... ```, ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/m, '');
  cleaned = cleaned.replace(/\n?```\s*$/m, '');

  // 2. If the response still has leading/trailing non-JSON text, try to extract
  //    the first JSON object or array.
  const jsonStart = cleaned.search(/[{\[]/);
  const jsonEndBrace = cleaned.lastIndexOf('}');
  const jsonEndBracket = cleaned.lastIndexOf(']');
  const jsonEnd = Math.max(jsonEndBrace, jsonEndBracket);

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  // 3. Remove trailing commas before closing braces/brackets (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // 4. Attempt parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError: any) {
    logger.warn(`safeParseAIJson(${context}): first parse attempt failed — ${firstError.message}`);
  }

  // 5. Second attempt: try to fix unescaped newlines in string values
  try {
    const fixedNewlines = cleaned.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
    return JSON.parse(fixedNewlines) as T;
  } catch (secondError: any) {
    logger.warn(`safeParseAIJson(${context}): second parse attempt failed — ${secondError.message}`);
  }

  // 6. Log raw input for debugging (truncated to 500 chars)
  logger.error(`safeParseAIJson(${context}): all parse attempts failed. Raw input (truncated): ${raw.substring(0, 500)}`);
  return null;
}
