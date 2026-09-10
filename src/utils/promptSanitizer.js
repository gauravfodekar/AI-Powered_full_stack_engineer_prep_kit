/**
 * ============================================================================
 * Prompt Sanitizer & XML Tag Isolation Utility
 * ============================================================================
 * Prevents prompt injection attacks from untrusted external inputs
 * (user-pasted job descriptions and crawled company web pages).
 */

/**
 * Escapes XML-sensitive characters so untrusted text cannot break out
 * of enclosing prompt tags.
 *
 * @param {string} text - Raw untrusted text
 * @returns {string} Sanitized string safe to interpolate inside XML tags
 */
export function sanitizeForPrompt(text) {
  if (!text || typeof text !== "string") {
    return "";
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/**
 * Wraps content in safe XML delimiter tags with clear boundary instructions.
 *
 * @param {string} tag - Tag name (e.g., "job_description", "company_research")
 * @param {string} content - Raw content to encapsulate
 * @returns {string} XML formatted block
 */
export function wrapInXmlTag(tag, content) {
  return `<${tag}>\n${sanitizeForPrompt(content)}\n</${tag}>`;
}

