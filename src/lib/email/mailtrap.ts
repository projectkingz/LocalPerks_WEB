import nodemailer from 'nodemailer';

// Mailtrap SMTP configuration - lazy initialization
let transporter: nodemailer.Transporter | null = null;

const getMailtrapTransporter = (): nodemailer.Transporter | null => {
  // If transporter already exists, return it
  if (transporter) {
    return transporter;
  }

  // Check if Mailtrap credentials are configured
  const mailtrapHost = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
  const mailtrapPort = parseInt(process.env.MAILTRAP_PORT || '2525', 10);
  const mailtrapUser = process.env.MAILTRAP_USER;
  const mailtrapPass = process.env.MAILTRAP_PASSWORD;

  console.log('🔍 Checking Mailtrap configuration...');
  console.log(`   Host: ${mailtrapHost}`);
  console.log(`   Port: ${mailtrapPort}`);
  console.log(`   User: ${mailtrapUser ? 'SET' : 'NOT SET'}`);
  console.log(`   Password: ${mailtrapPass ? 'SET' : 'NOT SET'}`);

  if (!mailtrapUser || !mailtrapPass) {
    console.warn('⚠️  Mailtrap credentials not configured. Email sending will be disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: mailtrapHost,
      port: mailtrapPort,
      auth: {
        user: mailtrapUser,
        pass: mailtrapPass,
      },
    });
    console.log('✅ Mailtrap transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating Mailtrap transporter:', error);
    return null;
  }
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

/**
 * Send email using Mailtrap
 * @param options Email options
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Get transporter (lazy initialization)
  const mailtrapTransporter = getMailtrapTransporter();
  
  if (!mailtrapTransporter) {
    console.warn('⚠️  Mailtrap not configured, email not sent');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (DEVELOPMENT MODE - NOT SENT)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from || 'LocalPerks <noreply@localperks.com>'}`);
    if (options.text) {
      console.log(`Text: ${options.text}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }

  try {
    const mailOptions = {
      from: options.from || 'LocalPerks <noreply@localperks.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📤 Sending email via Mailtrap`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${mailOptions.from}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const info = await mailtrapTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to} via Mailtrap`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Check your Mailtrap inbox at https://mailtrap.io\n`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email via Mailtrap:', error);
    console.error('Error details:', error.message || error);
    return false;
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  name: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your LocalPerks Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">LocalPerks</h1>
        </div>
        <h2 style="color: #1f2937; margin-top: 0;">Email Verification</h2>
        <p style="color: #4b5563; font-size: 16px;">Hi ${name},</p>
        <p style="color: #4b5563; font-size: 16px;">Your verification code is:</p>
        <div style="
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin: 30px 0;
        ">
          <div style="
            font-size: 42px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          ">
            ${code}
          </div>
        </div>
        <p style="color: #4b5563; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #4b5563; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} LocalPerks. All rights reserved.
        </p>
      </div>
    `,
  });
}

/**
 * Send email verification link
 */
export async function sendEmailVerificationLink(
  email: string,
  name: string,
  verificationUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">LocalPerks</h1>
        </div>
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to LocalPerks!</h2>
        <p style="color: #4b5563; font-size: 16px;">Hi ${name},</p>
        <p style="color: #4b5563; font-size: 16px;">Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">Verify Email Address</a>
        </div>
        <p style="color: #4b5563; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #4b5563; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
        </p>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} LocalPerks. All rights reserved.
        </p>
      </div>
    `,
  });
}

