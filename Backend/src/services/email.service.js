import AppError from '../utils/AppError.js';

// Base styling variables for consistent branding
const BRAND_COLOR = '#1E3A8A'; // Deep Navy
const ACCENT_COLOR = '#2563EB'; // Royal Blue
const BG_COLOR = '#F8FAFC'; // Slate 50
const CARD_BG = '#FFFFFF';
const TEXT_DARK = '#1E293B'; // Slate 800
const TEXT_MUTED = '#64748B'; // Slate 500

/**
 * Common HTML email wrapper to maintain visual consistency.
 */
const getEmailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: ${BG_COLOR};
        margin: 0;
        padding: 40px 20px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      .container {
        max-width: 580px;
        background-color: ${CARD_BG};
        margin: 0 auto;
        border-radius: 16px;
        border: 1px solid #E2E8F0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        overflow: hidden;
      }
      .header {
        background-color: ${BRAND_COLOR};
        padding: 30px 40px;
        text-align: center;
      }
      .logo {
        font-size: 24px;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.5px;
        text-decoration: none;
      }
      .body {
        padding: 40px;
        text-align: left;
      }
      .body-center {
        padding: 40px;
        text-align: center;
      }
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: ${TEXT_DARK};
        margin-top: 0;
        margin-bottom: 16px;
      }
      p {
        font-size: 15px;
        color: ${TEXT_MUTED};
        line-height: 1.6;
        margin-top: 0;
        margin-bottom: 24px;
      }
      .btn {
        display: inline-block;
        background-color: ${ACCENT_COLOR};
        color: #FFFFFF !important;
        font-weight: 600;
        font-size: 15px;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 8px;
        margin: 10px 0 20px 0;
        box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
      }
      .footer {
        padding: 24px 40px;
        background-color: ${BG_COLOR};
        border-top: 1px solid #F1F5F9;
        text-align: center;
      }
      .footer-text {
        font-size: 11px;
        color: #94A3B8;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="container">
      <tr>
        <td class="header">
          <span class="logo">🔬 ResearchConnect</span>
        </td>
      </tr>
      <tr>
        <td>
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">&copy; ${new Date().getFullYear()} ResearchConnect. All rights reserved.</p>
          <p class="footer-text" style="margin-top: 4px;">Connecting Global Scientific Minds</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

/**
 * Send Email via Resend API (with local console logging fallback for development)
 */
const sendEmail = async ({ to, subject, html, fallbackConsoleMsg = '' }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'ResearchConnect <onboarding@resend.dev>';

  if (!apiKey) {
    console.log(`✉️ [MOCK EMAIL] RESEND_API_KEY is missing. Logging email details:`);
    console.log(`   - To: ${to}`);
    console.log(`   - Subject: ${subject}`);
    if (fallbackConsoleMsg) {
      console.log(`   - Details: ${fallbackConsoleMsg}`);
    }
    return { success: true, mock: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AppError(`Resend API Error: ${errorData.message || response.statusText}`, 502);
    }

    console.log(`✉️ Email successfully dispatched to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`➡️ [Fallback Developer Mode] Logging details: ${fallbackConsoleMsg}`);
      return { success: true, mock: true };
    }
    throw error;
  }
};

/**
 * 1. Send OTP Email (for Login, Email Verification, or Password Reset)
 */
export const sendOTPEmail = async (email, otpCode, purpose, expiryMinutes = 5) => {
  let purposeTitle = 'Verify Your Email';
  let purposeDescription = 'Please use the following One-Time Password (OTP) to complete your email verification process.';

  if (purpose === 'login') {
    purposeTitle = 'Verify Your Login';
    purposeDescription = 'Please use the following One-Time Password (OTP) to verify your identity and log in.';
  } else if (purpose === 'password_reset') {
    purposeTitle = 'Reset Your Password';
    purposeDescription = 'We received a request to reset your password. Use the following One-Time Password (OTP) to authorize this change.';
  }

  const contentHtml = `
    <div class="body-center">
      <h2>${purposeTitle}</h2>
      <p>${purposeDescription}</p>
      <div style="font-size: 36px; font-weight: 800; color: ${ACCENT_COLOR}; background-color: #EFF6FF; border: 1px dashed #BFDBFE; padding: 16px 24px; border-radius: 12px; letter-spacing: 6px; display: inline-block; margin: 12px 0 24px 0;">${otpCode}</div>
      <p>This verification code is valid for <strong>${expiryMinutes} minutes</strong>. If you did not request this, please secure your credentials immediately.</p>
      <p style="font-size: 12px; color: #94A3B8; font-style: italic; margin-top: 16px;">For security reasons, never share this OTP with anyone, including ResearchConnect staff.</p>
    </div>
  `;

  const html = getEmailWrapper(purposeTitle, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] ${purposeTitle} - ${otpCode}`,
    html,
    fallbackConsoleMsg: `OTP Code: ${otpCode} (Purpose: ${purpose})`,
  });
};

/**
 * 2. Send Welcome Email
 */
export const sendWelcomeEmail = async (email, name) => {
  const title = 'Welcome to ResearchConnect!';
  const contentHtml = `
    <div class="body">
      <h2>Hello ${name},</h2>
      <p>Welcome to <strong>ResearchConnect</strong>, the AI-powered discovery and collaboration platform for global scientific minds.</p>
      <p>Your account is now fully active. You can now:</p>
      <ul style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
        <li>Build your academic profile and sync your Google Scholar records.</li>
        <li>Discover relevant publications matching your research interests.</li>
        <li>Connect and collaborate with other researchers globally.</li>
      </ul>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to reply to this email. We are thrilled to have you onboard.</p>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `Welcome to ResearchConnect, ${name}!`,
    html,
    fallbackConsoleMsg: `Welcome email sent.`,
  });
};

/**
 * 3. Send Verification Link Email
 */
export const sendVerificationEmail = async (email, token) => {
  const title = 'Activate Your Account';
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const contentHtml = `
    <div class="body-center">
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering on ResearchConnect. Please click the button below to verify your email address and activate your account.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      <p style="margin-top: 20px; font-size: 13px;">If the button above doesn't work, copy and paste the following URL into your browser:</p>
      <p style="font-size: 13px; word-break: break-all; background-color: #F1F5F9; padding: 10px; border-radius: 6px;"><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: '[ResearchConnect] Activate Your Account',
    html,
    fallbackConsoleMsg: `Verification Link: ${verifyUrl}`,
  });
};

/**
 * 4. Send Forgot Password Email (Link-based reset)
 */
export const sendForgotPasswordEmail = async (email, token) => {
  const title = 'Reset Your Password';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const contentHtml = `
    <div class="body-center">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password for your ResearchConnect account. Click the button below to choose a new password.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="margin-top: 20px; font-size: 13px;">If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
      <p style="font-size: 13px; word-break: break-all; background-color: #F1F5F9; padding: 10px; border-radius: 6px;"><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link is valid for 1 hour.</p>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: '[ResearchConnect] Reset Your Password',
    html,
    fallbackConsoleMsg: `Password Reset Link: ${resetUrl}`,
  });
};

/**
 * 5. Send Password Changed Confirmation
 */
export const sendPasswordChangedEmail = async (email) => {
  const title = 'Password Updated Successfully';
  const contentHtml = `
    <div class="body">
      <h2>Your password has been changed</h2>
      <p>This is a confirmation that the password for your ResearchConnect account has been successfully updated.</p>
      <p>For security, you have been logged out of all other active sessions. If you did not make this change, please contact our security team immediately or reset your password.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Log In Again</a>
      </div>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: '[ResearchConnect] Security Notification: Password Changed',
    html,
    fallbackConsoleMsg: `Password change confirmation email.`,
  });
};

/**
 * 6. Send New Device Login Notification
 */
export const sendNewDeviceLoginEmail = async (email, deviceDetails) => {
  const title = 'New Device Login Detected';
  const { browser, os, ipAddress, location, time } = deviceDetails;

  const contentHtml = `
    <div class="body">
      <h2>New Sign-in Alert</h2>
      <p>We detected a new login to your ResearchConnect account. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; color: ${TEXT_DARK};">
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; font-weight: bold; color: ${TEXT_MUTED};">Device/OS:</td>
          <td style="padding: 10px 0;">${os}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; font-weight: bold; color: ${TEXT_MUTED};">Browser:</td>
          <td style="padding: 10px 0;">${browser}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; font-weight: bold; color: ${TEXT_MUTED};">IP Address:</td>
          <td style="padding: 10px 0;">${ipAddress}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; font-weight: bold; color: ${TEXT_MUTED};">Location:</td>
          <td style="padding: 10px 0;">${location || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: ${TEXT_MUTED};">Time:</td>
          <td style="padding: 10px 0;">${time || new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p>If this was you, you can safely ignore this email. If you do not recognize this activity, please terminate the session from your account security dashboard and change your password immediately.</p>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: '[ResearchConnect] Security Alert: New Device Login',
    html,
    fallbackConsoleMsg: `New Device Login: ${os} (${browser}) from ${ipAddress}`,
  });
};

/**
 * 7. Send Security Alert
 */
export const sendSecurityAlertEmail = async (email, alertDetails) => {
  const title = 'Security Alert!';
  const { reason, description, time } = alertDetails;

  const contentHtml = `
    <div class="body" style="border-left: 4px solid #DC2626; padding-left: 16px;">
      <h2 style="color: #DC2626;">Security Action Required</h2>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>${description}</p>
      <p><strong>Logged Time:</strong> ${time || new Date().toLocaleString()}</p>
      <p>If you did not authorize or trigger this event, please secure your account immediately by resetting your password and ending all active sessions.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn" style="background-color: #DC2626; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">Secure My Account</a>
      </div>
    </div>
  `;

  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] CRITICAL SECURITY ALERT: ${reason}`,
    html,
    fallbackConsoleMsg: `Security Alert: ${reason} - ${description}`,
  });
};

/**
 * 8. Send Collaboration Request Email
 */
export const sendCollaborationRequestEmail = async (email, senderName, projectTitle) => {
  const title = 'New Collaboration Request Received';
  const contentHtml = `
    <div class="body">
      <h2>Hello,</h2>
      <p>You have received a new collaboration request from <strong>${senderName}</strong> for the project: <strong>"${projectTitle}"</strong>.</p>
      <p>Please log in to your ResearchConnect dashboard to review the request, accept/reject it, or ask questions.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collaboration" class="btn">View Collaboration Request</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] New Collaboration Request from ${senderName}`,
    html,
    fallbackConsoleMsg: `Collaboration request email sent to ${email} for "${projectTitle}" from ${senderName}.`,
  });
};

/**
 * 9. Send Collaboration Request Accepted Email
 */
export const sendCollaborationRequestAcceptedEmail = async (email, receiverName, projectTitle) => {
  const title = 'Collaboration Request Accepted!';
  const contentHtml = `
    <div class="body">
      <h2>Hello,</h2>
      <p>Great news! <strong>${receiverName}</strong> has accepted your collaboration request for the project: <strong>"${projectTitle}"</strong>.</p>
      <p>An active collaboration workspace has been created for this project. You can now chat, share files, and schedule meetings on the platform.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collaboration" class="btn">Go to Collaboration Workspace</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] Collaboration Request Accepted by ${receiverName}!`,
    html,
    fallbackConsoleMsg: `Collaboration accepted email sent to ${email} for "${projectTitle}" by ${receiverName}.`,
  });
};

/**
 * 10. Send New Connection Email
 */
export const sendNewConnectionEmail = async (email, connectorName) => {
  const title = 'New Connection Request';
  const contentHtml = `
    <div class="body">
      <h2>Hello,</h2>
      <p><strong>${connectorName}</strong> wants to connect with you on ResearchConnect.</p>
      <p>Building your network helps you discover new research opportunities and stay updated with your peers.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/connections" class="btn">Review Connection Request</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] Connection Request from ${connectorName}`,
    html,
    fallbackConsoleMsg: `Connection request email sent to ${email} from ${connectorName}.`,
  });
};

/**
 * 11. Send New Follower Email
 */
export const sendNewFollowerEmail = async (email, followerName) => {
  const title = 'You Have a New Follower';
  const contentHtml = `
    <div class="body">
      <h2>Hello,</h2>
      <p><strong>${followerName}</strong> is now following your research activities on ResearchConnect.</p>
      <p>They will receive updates in their activity feed whenever you share new publications, datasets, or projects.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" class="btn">View Your Profile</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] ${followerName} is now following you`,
    html,
    fallbackConsoleMsg: `New follower email sent to ${email} for follower ${followerName}.`,
  });
};

/**
 * 12. Send Collaboration Status Changed Email
 */
export const sendCollaborationStatusChangedEmail = async (email, researcherName, newStatus) => {
  const title = 'Collaboration Status Updated';
  const contentHtml = `
    <div class="body">
      <h2>Hello ${researcherName},</h2>
      <p>Your collaboration status has been successfully updated to: <strong>${newStatus}</strong>.</p>
      <p>Other researchers will now see this status on your profile, search results, and recommendations.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collaboration" class="btn">Manage Collaboration Status</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  return await sendEmail({
    to: email,
    subject: `[ResearchConnect] Your Collaboration Status: ${newStatus}`,
    html,
    fallbackConsoleMsg: `Status update email sent to ${email} for status: ${newStatus}.`,
  });
};

/**
 * 13. Send New Publication Notification to Followers
 */
export const sendNewPublicationFollowersEmail = async (emails, authorName, publicationTitle, publicationType) => {
  if (!emails || emails.length === 0) return { success: true };
  const title = `New ${publicationType} Published by ${authorName}`;
  const contentHtml = `
    <div class="body">
      <h2>Hello,</h2>
      <p><strong>${authorName}</strong>, whom you follow, has just shared a new ${publicationType.toLowerCase()}:</p>
      <p style="font-size: 16px; font-weight: bold; color: #1E3A8A; background-color: #F8FAFC; border-left: 4px solid #2563EB; padding: 12px; margin: 16px 0;">
        "${publicationTitle}"
      </p>
      <p>Click below to view the publication details, download the files, or bookmark it.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/publications" class="btn">View Publication</a>
      </div>
    </div>
  `;
  const html = getEmailWrapper(title, contentHtml);
  
  const sendPromises = emails.map(email => 
    sendEmail({
      to: email,
      subject: `[ResearchConnect] New ${publicationType} by ${authorName}: ${publicationTitle}`,
      html,
      fallbackConsoleMsg: `Follower alert sent to ${email} for new publication "${publicationTitle}" by ${authorName}.`,
    })
  );
  
  await Promise.all(sendPromises);
  return { success: true };
};
