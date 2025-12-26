import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordUpdateEmail(
  email: string,
  username: string,
  newPassword: string
): Promise<void> {
  if (!email) {
    console.warn(`No email provided for user ${username}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your Password Has Been Updated",
    html: `
      <h2>Password Update Notification</h2>
      <p>Hello ${username},</p>
      <p>Your account password has been updated by an administrator.</p>
      <p><strong>New Password:</strong> ${newPassword}</p>
      <p>Please change this password immediately after logging in for security reasons.</p>
      <hr />
      <p>If you did not request this change, please contact your administrator immediately.</p>
      <p>Best regards,<br />System Administrator</p>
    `,
    text: `
Password Update Notification

Hello ${username},

Your account password has been updated by an administrator.

New Password: ${newPassword}

Please change this password immediately after logging in for security reasons.

If you did not request this change, please contact your administrator immediately.

Best regards,
System Administrator
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password update email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw error;
  }
}
