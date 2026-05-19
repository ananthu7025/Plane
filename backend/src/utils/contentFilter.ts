/**
 * Content filtering utility for detecting spam, profanity, and inappropriate content
 */

// Common profanity words (extended list)
const PROFANITY_WORDS = [
  'shit', 'damn', 'hell', 'crap', 'ass', 'asshole', 'bitch',
  'bastard', 'fuck', 'fucker', 'fucking', 'goddamn', 'piss',
  'dick', 'dickhead', 'cock', 'pussy', 'motherfucker', 'cunt'
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{9,}/gi, // Repeated characters (10+ times)
  /https?:\/\/[^\s]+/gi, // URLs
  /(?:call|text|whatsapp|telegram|click)\s+(?:me|now|here|link)/gi, // Contact requests
  /(?:free|win|claim|prize|lottery|cash|money)\s+(?:now|today|urgent)/gi, // Spam keywords
];

// Spam indicators
const SPAM_INDICATORS = [
  'click here',
  'buy now',
  'limited time',
  'act now',
  'order today',
  'subscribe now',
  'follow me',
  'like and share'
];

export interface ContentFilterResult {
  isClean: boolean;
  violations: string[];
  severity: 'safe' | 'warning' | 'violation';
}

/**
 * Filter content for profanity, spam, and inappropriate patterns
 */
export function filterContent(content: string, strict = false): ContentFilterResult {
  const violations: string[] = [];
  let severity: 'safe' | 'warning' | 'violation' = 'safe';

  // Normalize content
  const normalized = content.toLowerCase().trim();

  // Check for profanity
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(normalized)) {
      violations.push(`Contains profanity: "${word}"`);
      severity = 'violation';
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalized)) {
      violations.push('Contains spam pattern (URLs or repeated characters)');
      severity = 'violation';
      break; // Only report once
    }
  }

  // Check for spam indicators
  const spamCount = SPAM_INDICATORS.filter(indicator =>
    normalized.includes(indicator)
  ).length;

  if (spamCount >= 2) {
    violations.push(`Contains ${spamCount} spam indicators`);
    severity = spamCount >= 3 ? 'violation' : 'warning';
  }

  // Check for excessive caps (>50% uppercase)
  if (strict) {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
      violations.push('Excessive capitalization (potential spam)');
      severity = 'warning';
    }
  }

  // Check for too many special characters (>30%)
  if (strict) {
    const specialCount = (content.match(/[!@#$%^&*]/g) || []).length;
    const specialRatio = specialCount / content.length;
    if (specialRatio > 0.3 && content.length > 10) {
      violations.push('Excessive special characters');
      severity = 'warning';
    }
  }

  return {
    isClean: violations.length === 0,
    violations,
    severity
  };
}

/**
 * Sanitize content by removing or replacing problematic patterns
 */
export function sanitizeContent(content: string): string {
  let sanitized = content;

  // Remove URLs
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '[link removed]');

  // Replace profanity with asterisks
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const censoredWord = '*'.repeat(word.length);
    sanitized = sanitized.replace(regex, censoredWord);
  }

  // Remove excessive repeated characters
  sanitized = sanitized.replace(/(.)\1{9,}/g, '$1$1');

  return sanitized;
}

/**
 * Check if content is suspicious and requires review
 */
export function isSuspiciousContent(content: string): boolean {
  const result = filterContent(content, true);
  return result.severity === 'violation' || result.violations.length > 0;
}
