import crypto from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}
