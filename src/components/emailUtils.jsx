import { base44 } from '@/api/base44Client';

export async function sendBridgedEmail({ to, subject, body, buttonText, buttonUrl, eventType }) {
    try {
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background-color: #F8F5F2; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1C2E45 0%, #2A3F5F 100%); padding: 40px 30px; text-align: center; }
                    .logo { font-size: 32px; font-weight: bold; color: #DED4C4; margin: 0; font-family: 'Georgia', serif; }
                    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                    .button { display: inline-block; padding: 14px 32px; background: #946b56; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                    .footer { background: #F8F5F2; padding: 30px; text-align: center; color: #666; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 class="logo">Bridged</h1>
                    </div>
                    <div class="content">
                        ${body}
                        ${buttonText && buttonUrl ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${buttonUrl}" class="button">${buttonText}</a>
                            </div>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>© 2025 Bridged. Empowering athletes to build their future.</p>
                        <p>Questions? Contact us at <a href="mailto:support@bridged.com" style="color: #946b56;">support@bridged.com</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await base44.integrations.Core.SendEmail({
            to: to,
            subject: subject,
            body: htmlBody
        });

        await base44.entities.EmailLog.create({
            recipient_email: to,
            subject: subject,
            status: 'sent',
            related_event: eventType || 'general'
        });

        return { success: true };
    } catch (error) {
        console.error("Email send failed:", error);
        
        await base44.entities.EmailLog.create({
            recipient_email: to,
            subject: subject,
            status: 'failed',
            related_event: eventType || 'general',
            error_message: error.message
        });

        return { success: false, error: error.message };
    }
}