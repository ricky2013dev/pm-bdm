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

export async function sendStudentStatusChangeEmail(
  email: string,
  studentName: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  if (!email) {
    console.warn(`No email provided for status change notification`);
    return;
  }

  const timestamp = new Date().toLocaleString();
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Student Status Update Notification",
    html: `
      <h2>Student Status Change Notification</h2>
      <p>A student's status has been updated in the system.</p>

      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Previous Status:</strong> <span style="color: #666;">${oldStatus}</span></p>
        <p><strong>New Status:</strong> <span style="color: #2196F3; font-weight: bold;">${newStatus}</span></p>
        <p><strong>Updated:</strong> ${timestamp}</p>
      </div>

      <hr />
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from the Student Management System.
      </p>
      <p>Best regards,<br />System Administrator</p>
    `,
    text: `
Student Status Change Notification

A student's status has been updated in the system.

Student Name: ${studentName}
Previous Status: ${oldStatus}
New Status: ${newStatus}
Updated: ${timestamp}

---
This is an automated notification from the Student Management System.

Best regards,
System Administrator
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status change email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send status change email to ${email}:`, error);
    throw error;
  }
}
