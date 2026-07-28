// Email Helper with Resend API + Fallback for Local Dev
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendPasswordResetEmail({ toEmail, userName, resetCode }) {
  const cleanEmail = typeof toEmail === 'string' ? toEmail.trim() : '';

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    console.warn(`[Email] Invalid destination email: "${toEmail}"`);
    return { success: false, method: 'console', code: resetCode, error: 'Invalid email address' };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'LifeAgent OS <onboarding@resend.dev>';

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
  const textContent = `Hi ${userName || 'there'},\n\nYour 6-digit password reset code for LifeAgent OS is: ${resetCode}\n\nThis code is valid for 15 minutes. If you did not request this reset, you can safely ignore this message.`;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [cleanEmail],
          subject: subject,
          html: htmlContent,
          text: textContent
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (response.ok && data?.id) {
        console.log(`[Email] Resend API Success [Status ${response.status}] for ${cleanEmail}:`, data);
        return { success: true, method: 'resend', id: data.id };
      }

      const errorMessage = data?.message || data?.error?.message || data?.name || `HTTP status ${response.status}`;
      console.warn(`[Email] Resend API Rejected [Status ${response.status}]:`, errorMessage, data);
      return { success: false, method: 'console', code: resetCode, error: errorMessage };
    } catch (err) {
      console.error("[Email] Resend API Error:", err?.message || err);
      return { success: false, method: 'console', code: resetCode, error: err?.message || 'Network error' };
    }
  }

  // Fallback log for local development
  console.log(`\n========================================`);
  console.log(`🔑 PASSWORD RESET CODE FOR: ${cleanEmail}`);
  console.log(`CODE: ${resetCode}`);
  console.log(`========================================\n`);

  return { success: true, method: 'console', code: resetCode };
}
