import { randomBytes, randomInt } from "node:crypto";

// No O, 0, I or 1: nobody should have to guess which one they are looking at.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function referralCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function privateToken() {
  return randomBytes(16).toString("base64url");
}
