import { randomBytes, scryptSync } from 'node:crypto';
const password = process.argv[2];
if (!password || password.length < 16) {
  console.error('Usage: npm run admin:password -- "a long unique password (at least 16 characters)"');
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`ADMIN_PASSWORD_SALT=${salt.toString('base64')}`);
console.log(`ADMIN_PASSWORD_HASH=${scryptSync(password, salt, 64).toString('base64')}`);
console.log(`ADMIN_SESSION_KEY=${randomBytes(32).toString('base64')}`);
console.log(`INVITATION_LINK_KEY=${randomBytes(32).toString('base64')}`);
