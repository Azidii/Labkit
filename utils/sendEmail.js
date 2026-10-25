require("dotenv").config();
const nodemailer = require("nodemailer");

// Create reusable transporter using Gmail SMTP / environment credentials
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  requireTLS: true,
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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

async function sendInvoiceEmail({ to, name, order, invoice, paymentMethod }) {
  const recipientName = name || "Engineer";
  const resolvedPaymentMethod = String(paymentMethod || order?.paymentMethod || "").trim().toLowerCase();
  const isCod = resolvedPaymentMethod === "cod";

  const openingDescription = isCod
    ? "Thank you for your order! We have received your order and are preparing your parts for shipment. Your official invoice and order details are summarized below:"
    : "Thank you for your order. We've received your payment and are preparing your parts for shipment. Your official invoice and order details are summarized below:";

  const statusBadge = isCod
    ? "✓ Order Confirmed • Cash on Delivery"
    : "✓ Payment Confirmed • Order Processing";

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 0;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${escapeHtml(item.name)}</td>
      <td style="padding:12px 0;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 0;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;text-align:right;">₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");
  const textItems = order.items
    .map((item) => `${item.name} x${item.quantity} - ₱${(item.unitPrice * item.quantity).toFixed(2)}`)
    .join("\n");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(invoice?.issuedAt || order?.createdAt || new Date());

  const subtotalFormatted = (order.subtotal ?? 0).toFixed(2);
  const shippingFormatted = (order.shippingFee ?? 0).toFixed(2);
  const totalFormatted = (order.totalAmount ?? 0).toFixed(2);
  const orderStatusText = order.orderStatus
    ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)
    : "Processing";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LabKit Order Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      background-color: #0f5d63;
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
      vertical-align: middle;
    }
    .brand-sub {
      color: #99f6e4;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-left: 4px;
      display: inline-block;
      vertical-align: middle;
    }
    .body-content {
      padding: 32px;
      background-color: #ffffff;
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
      margin: 0 0 24px 0;
    }
    .total-card {
      background-color: #f0fdfa;
      border: 1.5px dashed #0f5d63;
      border-radius: 10px;
      padding: 22px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .total-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f5d63;
      margin-bottom: 8px;
    }
    .total-amount {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f5d63;
      margin: 0;
      line-height: 1.1;
    }
    .total-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .meta-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .meta-table {
      width: 100%;
      font-size: 13px;
      color: #475569;
    }
    .meta-table td {
      padding: 3px 0;
      vertical-align: top;
    }
    .meta-table strong {
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .items-table th {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      padding: 10px 0;
      border-bottom: 1.5px solid #e2e8f0;
      text-align: left;
    }
    .items-table td {
      padding: 12px 0;
      font-size: 13px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .summary-table {
      width: 100%;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    .summary-table td {
      padding: 4px 0;
      font-size: 13px;
      color: #64748b;
    }
    .summary-table .amount-col {
      text-align: right;
      color: #1e293b;
      font-weight: 500;
    }
    .notice-box {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      background-color: #f8fafc;
      border-left: 3px solid #0f5d63;
      padding: 12px 14px;
      border-radius: 0 6px 6px 0;
      margin-top: 24px;
    }
    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      text-align: center;
      background-color: #f8fafc;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 580px) {
      .wrapper {
        padding: 16px 8px !important;
      }
      .header-bar {
        padding: 18px 20px !important;
      }
      .body-content {
        padding: 24px 18px !important;
      }
      .footer-bar {
        padding: 18px 20px !important;
      }
      .total-amount {
        font-size: 30px !important;
      }
      .meta-box {
        padding: 12px 14px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div class="wrapper" style="width:100%;background-color:#f4f6f8;padding:40px 16px;box-sizing:border-box;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <div class="email-container" style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);text-align:left;">
            
            <div class="header-bar" style="background-color:#0f5d63;padding:24px 32px;text-align:left;">
              <span class="brand-title" style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;margin:0;display:inline-block;vertical-align:middle;">LabKit</span>
              <span class="brand-sub" style="color:#99f6e4;font-size:13px;font-weight:600;letter-spacing:0.5px;margin-left:4px;display:inline-block;vertical-align:middle;">/MARKET</span>
            </div>

            <div class="body-content" style="padding:32px;background-color:#ffffff;">
              <h2 class="greeting" style="font-size:18px;font-weight:600;color:#0f172a;margin-top:0;margin-bottom:12px;">Hello, ${escapeHtml(recipientName)}!</h2>
              <p class="message" style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 24px 0;">
                ${escapeHtml(openingDescription)}
              </p>

              <div class="total-card" style="background-color:#f0fdfa;border:1.5px dashed #0f5d63;border-radius:10px;padding:22px 20px;text-align:center;margin:24px 0;">
                <div class="total-label" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0f5d63;margin-bottom:8px;">Total Amount Due</div>
                <div class="total-amount" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:36px;font-weight:800;letter-spacing:-0.5px;color:#0f5d63;margin:0;line-height:1.1;">₱${totalFormatted}</div>
                <p class="total-sub" style="font-size:12px;color:#64748b;margin-top:8px;margin-bottom:0;font-weight:500;">${escapeHtml(statusBadge)}</p>
              </div>

              <div class="meta-box" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <table class="meta-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:13px;color:#475569;">
                  <tr>
                    <td style="padding:3px 0;width:50%;"><strong>Invoice Number:</strong> ${escapeHtml(invoice.invoiceNumber)}</td>
                    <td style="padding:3px 0;width:50%;"><strong>Date:</strong> ${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;width:50%;"><strong>Order ID:</strong> ${escapeHtml(order._id)}</td>
                    <td style="padding:3px 0;width:50%;"><strong>Status:</strong> ${escapeHtml(orderStatusText)}</td>
                  </tr>
                </table>
              </div>

              <table class="items-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                  <tr>
                    <th style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;padding:10px 0;border-bottom:1.5px solid #e2e8f0;text-align:left;">Item</th>
                    <th class="text-center" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;padding:10px 0;border-bottom:1.5px solid #e2e8f0;text-align:center;">Qty</th>
                    <th class="text-right" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;padding:10px 0;border-bottom:1.5px solid #e2e8f0;text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>

              <table class="summary-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#64748b;">Subtotal</td>
                  <td class="amount-col" style="padding:4px 0;font-size:13px;text-align:right;color:#1e293b;font-weight:500;">₱${subtotalFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#64748b;">Shipping Fee</td>
                  <td class="amount-col" style="padding:4px 0;font-size:13px;text-align:right;color:#1e293b;font-weight:500;">₱${shippingFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0 0;font-size:14px;color:#0f172a;font-weight:700;border-top:1px solid #e2e8f0;">Total</td>
                  <td class="amount-col" style="padding:8px 0 0 0;font-size:14px;text-align:right;color:#0f5d63;font-weight:700;border-top:1px solid #e2e8f0;">₱${totalFormatted}</td>
                </tr>
              </table>

              <div class="notice-box" style="font-size:12px;color:#64748b;line-height:1.5;background-color:#f8fafc;border-left:3px solid #0f5d63;padding:12px 14px;border-radius:0 6px 6px 0;margin-top:24px;">
                <strong>Order notice:</strong> A shipping notification containing courier tracking details will be sent once your items have dispatched. If you have any inquiries regarding this invoice, please contact support.
              </div>
            </div>

            <div class="footer-bar" style="border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;background-color:#f8fafc;">
              <p class="footer-text" style="font-size:12px;color:#94a3b8;margin:0;line-height:1.5;">
                &copy; 2026 LabKit Market &mdash; Individual parts for IoT &amp; prototyping.<br>
                This is an automated system email. Please do not reply directly.
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  const result = await transporter.sendMail({
    from: `"LabKit Market" <${process.env.EMAIL_USER}>`,
    to,
    subject: `LabKit invoice ${invoice.invoiceNumber}`,
    text: `Hello ${recipientName},\n\nThank you for your LabKit order.\n\nInvoice: ${invoice.invoiceNumber}\nOrder: ${order._id}\n\n${textItems}\n\nSubtotal: ₱${subtotalFormatted}\nShipping: ₱${shippingFormatted}\nTotal: ₱${totalFormatted}\n\nThank you for shopping with LabKit Market.`,
    html: htmlContent
  });

  if (!result.accepted || !result.accepted.some((recipient) => recipient.toLowerCase() === to.toLowerCase())) {
    throw new Error(`SMTP did not accept the invoice recipient: ${to}`);
  }

  console.log(`Invoice email accepted by SMTP for ${to} (${result.messageId})`);
  return result;
}

module.exports = {
  sendOtpEmail,
  sendInvoiceEmail
};
