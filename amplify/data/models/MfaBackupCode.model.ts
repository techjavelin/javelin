import { a } from "@aws-amplify/backend";

// Stores salted hash of MFA backup codes. One record per user per code.
// Plain codes are NEVER stored. Validation will hash candidate and look up.
export const MfaBackupCode = a.model({
  userId: a.string().required(),
  hash: a.string().required(), // e.g. base64url(sha256(userId + ":" + code + ":" + salt))
  salt: a.string().required(), // per-code random salt (base32 or hex)
  used: a.boolean().default(false),
  usedAt: a.datetime(),
  // Soft delete retention could be added later if audit required
}).authorization(allow => [
  // User can manage their own codes (create, list, mark used, delete)
  allow.ownerDefinedIn("userId"),
]);
