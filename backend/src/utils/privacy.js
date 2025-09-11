const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CARD_REGEX = /\b\d{13,19}\b/g; // simplistic
const ACCOUNT_REGEX = /acct_[0-9A-Za-z]+/g;

function redact(text) {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(CARD_REGEX, '[REDACTED_NUMBER]')
    .replace(ACCOUNT_REGEX, '[REDACTED_ACCOUNT]');
}

module.exports = { redact };