// backend/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name) => {
    try {
        console.log('📧 Email Service - Attempting to send OTP to:', email);
        console.log('📧 Email Service - EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
        console.log('📧 Email Service - EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Missing');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials missing');
            return { success: false, error: 'Email credentials not configured' };
        }
        
        const mailOptions = {
            from: {
                name: 'CyberSakhi Security',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Your CyberSakhi Verification Code',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 15px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; text-align: center; backdrop-filter: blur(10px);">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                            🛡️ CyberSakhi
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Your Digital Safety Companion
                        </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: white; padding: 40px 30px; margin: 0;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                                Welcome ${name}! 👋
                            </h2>
                            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
                                We're excited to have you join our safety community. Please verify your email address to complete your registration.
                            </p>
                        </div>
                        
                        <!-- OTP Box -->
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);">
                            <p style="color: white; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">
                                Your Verification Code
                            </p>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px; display: inline-block; backdrop-filter: blur(10px);">
                                <span style="color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </span>
                            </div>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 15px 0 0 0; font-size: 14px;">
                                This code expires in 10 minutes
                            </p>
                        </div>
                        
                        <!-- Instructions -->
                        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                                📋 Next Steps:
                            </h3>
                            <ol style="color: #555; margin: 0; padding-left: 20px; line-height: 1.6;">
                                <li>Enter this 6-digit code in the verification form</li>
                                <li>Complete your profile setup</li>
                                <li>Start protecting yourself and your loved ones</li>
                            </ol>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                                🔒 <strong>Security Notice:</strong> Never share this code with anyone. CyberSakhi will never ask for your verification code via phone or email.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #333; padding: 25px; text-align: center;">
                        <p style="color: #ccc; margin: 0 0 10px 0; font-size: 14px;">
                            Need help? Contact us at <a href="mailto:support@cybersakhi.com" style="color: #667eea; text-decoration: none;">support@cybersakhi.com</a>
                        </p>
                        <p style="color: #888; margin: 0; font-size: 12px;">
                            © 2024 CyberSakhi. Protecting families, one connection at a time.
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset OTP email
export const sendPasswordResetOTP = async (email, otp, name) => {
    try {
        const mailOptions = {
            from: {
                name: 'CyberSakhi Security',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Password Reset - CyberSakhi',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 15px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; text-align: center; backdrop-filter: blur(10px);">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                            🛡️ CyberSakhi
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Password Reset Request
                        </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: white; padding: 40px 30px; margin: 0;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                                🔒 Reset Your Password
                            </h2>
                            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
                                Hi ${name}, we received a request to reset your CyberSakhi account password.
                            </p>
                        </div>
                        
                        <!-- OTP Box -->
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);">
                            <p style="color: white; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">
                                Your Password Reset Code
                            </p>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px; display: inline-block; backdrop-filter: blur(10px);">
                                <span style="color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </span>
                            </div>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 15px 0 0 0; font-size: 14px;">
                                This code expires in 10 minutes
                            </p>
                        </div>
                        
                        <!-- Instructions -->
                        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                                📋 Next Steps:
                            </h3>
                            <ol style="color: #555; margin: 0; padding-left: 20px; line-height: 1.6;">
                                <li>Enter this 6-digit code in the password reset form</li>
                                <li>Create a new secure password</li>
                                <li>Login with your new password</li>
                            </ol>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                                🔒 <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #333; padding: 25px; text-align: center;">
                        <p style="color: #ccc; margin: 0 0 10px 0; font-size: 14px;">
                            Need help? Contact us at <a href="mailto:support@cybersakhi.com" style="color: #667eea; text-decoration: none;">support@cybersakhi.com</a>
                        </p>
                        <p style="color: #888; margin: 0; font-size: 12px;">
                            © 2024 CyberSakhi. Protecting families, one connection at a time.
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset OTP email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Failed to send password reset OTP email:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset confirmation email
export const sendPasswordResetConfirmation = async (email, name) => {
    try {
        const mailOptions = {
            from: {
                name: 'CyberSakhi Security',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '✅ Password Reset Successful - CyberSakhi',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 15px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; text-align: center; backdrop-filter: blur(10px);">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                            🛡️ CyberSakhi
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Password Reset Confirmation
                        </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: white; padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                                ✅ Password Reset Successful!
                            </h2>
                            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
                                Hi ${name}, your CyberSakhi account password has been successfully reset.
                            </p>
                        </div>
                        
                        <!-- Success Message -->
                        <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(86, 171, 47, 0.3);">
                            <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
                                🔐 Your Account is Secure
                            </h3>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px;">
                                You can now login with your new password.
                            </p>
                        </div>
                        
                        <!-- Security Tips -->
                        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                                🔒 Security Tips:
                            </h3>
                            <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.6;">
                                <li>Use a strong, unique password</li>
                                <li>Don't share your password with anyone</li>
                                <li>Enable two-factor authentication if available</li>
                                <li>Regularly update your password</li>
                            </ul>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                                🚀 Login to Your Account
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #333; padding: 25px; text-align: center;">
                        <p style="color: #ccc; margin: 0 0 10px 0; font-size: 14px;">
                            Questions? We're here to help at <a href="mailto:support@cybersakhi.com" style="color: #667eea; text-decoration: none;">support@cybersakhi.com</a>
                        </p>
                        <p style="color: #888; margin: 0; font-size: 12px;">
                            © 2024 CyberSakhi. Protecting families, one connection at a time.
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset confirmation email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Failed to send password reset confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (email, name, role) => {
    try {
        const roleEmoji = role === 'sakhi' ? '🧍‍♀️' : '👨‍👩‍👧‍👦';
        const roleText = role === 'sakhi' ? 'Sakhi User' : 'Family Member';
        
        const mailOptions = {
            from: {
                name: 'CyberSakhi Team',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🎉 Welcome to CyberSakhi - Your Safety Journey Begins!',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 15px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; text-align: center; backdrop-filter: blur(10px);">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                            🛡️ CyberSakhi
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Welcome to Your Digital Safety Family
                        </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: white; padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 26px; font-weight: 600;">
                                🎉 Welcome ${name}!
                            </h2>
                            <p style="color: #667eea; margin: 0; font-size: 18px; font-weight: 500;">
                                ${roleEmoji} Registered as ${roleText}
                            </p>
                        </div>
                        
                        <!-- Success Message -->
                        <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(86, 171, 47, 0.3);">
                            <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
                                ✅ Registration Successful!
                            </h3>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px;">
                                Your account has been created and verified successfully.
                            </p>
                        </div>
                        
                        <!-- Features -->
                        <div style="margin: 30px 0;">
                            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">
                                🚀 What's Next?
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                ${role === 'sakhi' ? `
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                                        <strong style="color: #333;">📱 Set Up Your Profile:</strong>
                                        <span style="color: #555;"> Complete your safety preferences and emergency contacts</span>
                                    </div>
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #f093fb;">
                                        <strong style="color: #333;">👨‍👩‍👧‍👦 Connect Family:</strong>
                                        <span style="color: #555;"> Add family members to your safety network</span>
                                    </div>
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #56ab2f;">
                                        <strong style="color: #333;">🛡️ Start Monitoring:</strong>
                                        <span style="color: #555;"> Begin your digital safety journey with real-time protection</span>
                                    </div>
                                ` : `
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                                        <strong style="color: #333;">👀 Monitor Loved Ones:</strong>
                                        <span style="color: #555;"> Keep track of your family's safety and location</span>
                                    </div>
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #f093fb;">
                                        <strong style="color: #333;">🚨 Emergency Alerts:</strong>
                                        <span style="color: #555;"> Receive instant notifications for SOS situations</span>
                                    </div>
                                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #56ab2f;">
                                        <strong style="color: #333;">📊 Safety Dashboard:</strong>
                                        <span style="color: #555;"> Access comprehensive family safety analytics</span>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                                🚀 Start Your Safety Journey
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #333; padding: 25px; text-align: center;">
                        <p style="color: #ccc; margin: 0 0 10px 0; font-size: 14px;">
                            Questions? We're here to help at <a href="mailto:support@cybersakhi.com" style="color: #667eea; text-decoration: none;">support@cybersakhi.com</a>
                        </p>
                        <p style="color: #888; margin: 0; font-size: 12px;">
                            © 2024 CyberSakhi. Protecting families, one connection at a time.
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        return { success: false, error: error.message };
    }
};