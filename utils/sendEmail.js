require("dotenv").config();
const nodemailer = require("nodemailer");

// Create reusable transporter using Gmail SMTP / environment credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a branded OTP verification email for password reset.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.code - 6-digit OTP code
 */
async function sendOtpEmail({ to, name, code }) {
  const recipientName = name || "Engineer";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LabKit Password Reset Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 40px 16px;
    }
    .email-container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      background: #0f5d63;
      padding: 24px 32px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
      display: inline-block;
    }
    .brand-sub {
      color: #99f6e4;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-left: 4px;
    }
    .body-content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-card {
      background: #f0fdfa;
      border: 1.5px dashed #0f5d63;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f5d63;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: "Courier New", Courier, monospace, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0f5d63;
      margin: 0;
      padding-left: 8px;
    }
    .otp-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      margin-bottom: 0;
    }
    .security-note {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin-top: 24px;
    }
    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      text-align: center;
      background: #f8fafc;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header-bar">
        <span class="brand-title">LabKit</span>
        <span class="brand-sub">/MARKET</span>
      </div>
      
      <div class="body-content">
        <h2 class="greeting">Hello, ${recipientName}!</h2>
        <p class="message">
          We received a request to change your LabKit account password. Use the single-use verification code below to complete your password reset:
        </p>

        <div class="otp-card">
          <div class="otp-label">One-Time Verification Code</div>
          <div class="otp-code">${code}</div>
          <p class="otp-expiry">⏱ Valid for 10 minutes</p>
        </div>

        <p class="message" style="margin-bottom: 0;">
          Please enter this code on the password reset page to choose your new password.
        </p>

        <div class="security-note">
          <strong>Security notice:</strong> If you did not request this password change, you can safely ignore this email. Your password will remain unchanged. Never share this code with anyone.
        </div>
      </div>

      <div class="footer-bar">
        <p class="footer-text">
          &copy; 2026 LabKit Market &mdash; Individual parts for IoT & prototyping.<br>
          This is an automated system email. Please do not reply directly.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"LabKit Market" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${code} is your LabKit password reset code`,
    text: `Hello ${recipientName},\n\nYour one-time verification code to reset your LabKit account password is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this message.\n\n— LabKit Market`,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendOtpEmail
};
