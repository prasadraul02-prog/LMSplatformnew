import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// POST: Handle forgot password request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Don't reveal if user exists or not (security)
            return NextResponse.json({
                message: 'If an account with that email exists, the administrator has been notified.'
            });
        }

        // Send email to admin with user credentials
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourcompany.com';

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #333; font-size: 16px; }
                    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🔐 Password Recovery Request</h1>
                    </div>
                    <div class="content">
                        <p>A password recovery request was submitted for the following user:</p>
                        
                        <div class="info-box">
                            <p><span class="label">Name:</span> <span class="value">${user.name}</span></p>
                            <p><span class="label">Email:</span> <span class="value">${user.email}</span></p>
                            <p><span class="label">Role:</span> <span class="value">${user.role}</span></p>
                            <p><span class="label">Request Time:</span> <span class="value">${new Date().toLocaleString()}</span></p>
                        </div>

                        <div class="alert">
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>This user cannot access their account. Please:</p>
                            <ol>
                                <li>Verify the user's identity</li>
                                <li>Reset their password in the admin panel</li>
                                <li>Provide the new credentials securely</li>
                            </ol>
                        </div>

                        <p style="margin-top: 30px; color: #666; font-size: 14px;">
                            This is an automated message from your LMS Platform.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🔐 Password Recovery Request - ${user.name}`,
            html: emailHtml,
        });

        return NextResponse.json({
            message: 'Password recovery request sent to administrator. You will be contacted shortly.'
        });

    } catch (error) {
        console.error('Error processing forgot password request:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
