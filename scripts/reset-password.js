import db from '../lib/db.js';
import bcrypt from 'bcryptjs';

const emailOrHandle = process.argv[2];
const newPassword = process.argv[3];

if (!emailOrHandle || !newPassword) {
  console.log("Usage: node scripts/reset-password.js <email_or_handle> <new_password>");
  process.exit(1);
}

async function resetPassword() {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const res = await db.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE email = ? OR handle = ? OR handle = ?',
      args: [hash, emailOrHandle, emailOrHandle, `@${emailOrHandle.replace(/^@/, '')}`]
    });

    console.log(`✅ Password reset successfully!`);
    console.log(`User: ${emailOrHandle}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`Generated Bcrypt Hash: ${hash}`);
    console.log(`Rows updated: ${res.rowsAffected}`);
  } catch (err) {
    console.error("❌ Error resetting password:", err.message);
  }
}

resetPassword();
