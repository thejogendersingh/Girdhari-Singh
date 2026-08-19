// Characters chosen to prevent visual ambiguity for workers/consumers:
// Omitted: 0 (zero), O (letter O), 1 (one), I (letter I), L (letter L)
const SAFE_CHARACTERS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a single random unique code with product prefix
 * Example: CF31-K7M9Q2
 */
export function generateRandomCode(prefix = 'CF31', length = 6) {
  let result = '';
  const charLength = SAFE_CHARACTERS.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charLength);
    result += SAFE_CHARACTERS[randomIndex];
  }
  return `${prefix}-${result}`;
}

/**
 * Generate N unique codes for a product batch
 * Guaranteed no duplicates in the generated batch or existing database
 */
export function generateBatchCodes({ prefix, length = 6, quantity, existingCodes = new Set() }) {
  const generatedCodes = new Set();
  const resultList = [];
  let attempts = 0;
  const maxAttempts = quantity * 20; // safety ceiling

  while (resultList.length < quantity && attempts < maxAttempts) {
    attempts++;
    const code = generateRandomCode(prefix, length);
    if (!generatedCodes.has(code) && !existingCodes.has(code)) {
      generatedCodes.add(code);
      resultList.push(code);
    }
  }

  if (resultList.length < quantity) {
    throw new Error(`Could not generate ${quantity} unique codes after ${maxAttempts} attempts. Consider increasing code length.`);
  }

  return resultList;
}

/**
 * Clean & normalize customer code input
 * Example: "cf 31 - k7m9q2 " -> "CF31-K7M9Q2"
 */
export function sanitizeCodeInput(input) {
  if (!input) return '';
  let cleaned = input.trim().toUpperCase().replace(/\s+/g, '');
  
  // If user entered 10 chars without hyphen like CF31K7M9Q2, insert hyphen automatically
  if (cleaned.length === 10 && !cleaned.includes('-')) {
    cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
  }
  return cleaned;
}
