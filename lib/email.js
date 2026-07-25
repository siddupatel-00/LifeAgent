// Email Helper with Resend API + Fallback for Local Dev
export async function sendPasswordResetEmail({ toEmail, userName, resetCode }) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const subject = "🔒 Reset Your LifeAgent Password";
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

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'LifeAgent OS <auth@resend.dev>',
          to: [toEmail],
          subject: subject,
          html: htmlContent
        })
      });
      const data = await response.json();
      console.log(`[Email] Resend API Response for ${toEmail}:`, data);
      return { success: true, method: 'resend' };
    } catch (err) {
      console.error("[Email] Resend API Error:", err.message);
    }
  }

  // Fallback log for local development
  console.log(`\n========================================`);
  console.log(`🔑 PASSWORD RESET CODE FOR: ${toEmail}`);
  console.log(`CODE: ${resetCode}`);
  console.log(`========================================\n`);

  return { success: true, method: 'console', code: resetCode };
}
