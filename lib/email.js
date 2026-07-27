import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendPasswordResetEmail({ toEmail, userName, resetCode }) {
  const cleanEmail = typeof toEmail === 'string' ? toEmail.trim() : '';

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    console.warn(`[Email] Invalid destination email: "${toEmail}"`);
    return { success: false, error: 'Invalid email address' };
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    const missing = !gmailUser ? 'GMAIL_USER' : 'GMAIL_APP_PASSWORD';
    console.error(`[Email] Missing env var: ${missing}. Cannot send reset email.`);
    return { success: false, error: `Missing env var: ${missing}` };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #3b82f6; margin-bottom: 8px;">LifeAgent OS</h2>
      <p style="font-size: 16px; color: #94a3b8; margin-bottom: 24px;">Password Reset Request</p>
      
      <p>Hi ${userName || 'there'},</p>
      <p>We received a request to reset your password for your LifeAgent account.</p>

      <div style="margin: 28px 0; text-align: center; padding: 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
        <span style="font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your 6-Digit Reset Code</span>
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace;">${resetCode}</span>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 15 minutes</p>
      </div>

      <p style="font-size: 13px; color: #64748b;">If you did not request this password reset, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `LifeAgent OS <${gmailUser}>`,
      to: cleanEmail,
      subject: '🔒 Reset Your LifeAgent Password',
      html: htmlContent,
      text: `Hi ${userName || 'there'},\n\nYour 6-digit password reset code for LifeAgent OS is: ${resetCode}\n\nThis code is valid for 15 minutes. If you did not request this reset, you can safely ignore this message.`,
    });

    console.log(`[Email] Gmail SMTP: Reset email sent successfully to ${cleanEmail}`);
    return { success: true, method: 'gmail' };
  } catch (err) {
    console.error('[Email] Gmail SMTP error:', err.message);
    return { success: false, error: err.message };
  }
}
