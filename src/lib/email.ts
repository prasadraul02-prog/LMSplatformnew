import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration for Zimbra
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.yourcompany.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'training-system@yourcompany.com',
      pass: process.env.SMTP_PASSWORD || '',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

interface EmployeeApprovalData {
  employeeId: string;
  name: string;
  department?: string;
  designation?: string;
  location: string;
  email?: string;
  phone?: string;
  trainingLevel: string;
  approveToken: string;
  rejectToken: string;
}

interface ApprovalEmailOptions {
  wmEmail: string;
  wmName: string;
  location: string;
  employees: EmployeeApprovalData[];
  baseUrl: string;
}

// Generate HTML email template for approval requests
const generateApprovalEmailHTML = (options: ApprovalEmailOptions): string => {
  const { wmName, location, employees, baseUrl } = options;

  const employeeRows = employees
    .map(
      (emp) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.employeeId}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.name}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.department || 'N/A'}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.designation || 'N/A'}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.location}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.email || 'N/A'}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${emp.phone || 'N/A'}</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-transform: uppercase;">${emp.trainingLevel}</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
        <a href="${baseUrl}/api/training/action/${emp.approveToken}/approve" 
           style="display: inline-block; padding: 8px 16px; margin: 4px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Approve
        </a>
        <a href="${baseUrl}/api/training/action/${emp.rejectToken}/reject" 
           style="display: inline-block; padding: 8px 16px; margin: 4px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reject
        </a>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Training Approval Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Training Approval Request</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 10px;">Dear <strong>${wmName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      The following <strong>${employees.length}</strong> employee${employees.length > 1 ? 's' : ''} from 
      <strong>${location}</strong> ${employees.length > 1 ? 'are' : 'is'} currently untrained and 
      ${employees.length > 1 ? 'require' : 'requires'} your approval for basic training:
    </p>
    
    <div style="overflow-x: auto; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Employee ID</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Name</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Department</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Designation</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Location</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Email</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Phone</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: left;">Current Level</th>
            <th style="padding: 12px; border: 1px solid #ddd; color: white; text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Note:</strong> Each approval/rejection is individual. Click the appropriate button for each employee. 
        Approving will schedule the employee for basic training at your location.
      </p>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    
    <p style="font-size: 14px; color: #666; margin-bottom: 0;">
      Best regards,<br>
      <strong>Training Management System</strong><br>
      <em>This is an automated message. Please do not reply to this email.</em>
    </p>
  </div>
</body>
</html>
  `.trim();
};

// Send approval email to Workshop Manager
export const sendApprovalEmail = async (options: ApprovalEmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const htmlContent = generateApprovalEmailHTML(options);

    const mailOptions = {
      from: `"Training Management System" <${process.env.SMTP_USER || 'training-system@yourcompany.com'}>`,
      to: options.wmEmail,
      subject: `Training Approval Required - ${options.location} (${options.employees.length} Employee${options.employees.length > 1 ? 's' : ''})`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send action confirmation email
export const sendActionConfirmationEmail = async (
  email: string,
  employeeName: string,
  action: 'approved' | 'rejected'
): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const actionColor = action === 'approved' ? '#4CAF50' : '#f44336';
    const actionText = action === 'approved' ? 'Approved' : 'Rejected';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${actionColor}; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="color: white; margin: 0;">Training Request ${actionText}</h2>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Dear Workshop Manager,</p>
    <p>You have successfully <strong>${action}</strong> the training request for:</p>
    <p style="font-size: 18px; font-weight: bold; color: ${actionColor};">${employeeName}</p>
    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      Best regards,<br>
      Training Management System
    </p>
  </div>
</body>
</html>
    `.trim();

    await transporter.sendMail({
      from: `"Training Management System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Training Request ${actionText} - ${employeeName}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};
