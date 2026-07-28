// Email Helper using Gmail SMTP via Nodemailer
import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail({ toEmail, userName, resetCode }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment');
    return { success: false, method: 'none', error: 'Email credentials not configured' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  const subject = '🔒 Reset Your LifeAgent Password';
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

  const textContent = `Hi ${userName || 'there'},\n\nYour 6-digit password reset code for LifeAgent OS is: ${resetCode}\n\nThis code is valid for 15 minutes. If you did not request this reset, you can safely ignore this message.`;

  try {
    const info = await transporter.sendMail({
      from: `LifeAgent OS <${gmailUser}>`,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent
    });

    console.log(`[Email] Gmail SMTP Success: ${info.messageId} → ${toEmail}`);
    return { success: true, method: 'gmail', id: info.messageId };
  } catch (err) {
    console.error('[Email] Gmail SMTP Error:', err?.message || err);
    return { success: false, method: 'none', error: err?.message || 'SMTP error' };
  }
}
