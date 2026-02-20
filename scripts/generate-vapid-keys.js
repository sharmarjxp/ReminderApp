// Run this ONCE to generate your VAPID keys:
//   node scripts/generate-vapid-keys.js
//
// Then add the output to your .env.local AND Vercel Environment Variables.

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('\n✅ Add these to your .env.local and Vercel Environment Variables:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@reminderpi.vercel.app`);
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret — never commit it to git!\n');
