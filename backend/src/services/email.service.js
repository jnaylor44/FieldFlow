
const Mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // Add this dependency

class EmailService {
  constructor() {
    this.mailjet = null;
    this.fallbackTransporter = null;
    this.setupMailjet();
    this.setupFallbackTransporter();
  }

  setupMailjet() {
    try {
      const apiKey = process.env.MAILJET_API_KEY;
      const secretKey = process.env.MAILJET_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        console.warn('⚠️ Mailjet API keys not configured. Email sending may fail.');
        return;
      }
      this.mailjet = Mailjet.apiConnect(apiKey, secretKey);
      console.log('✅ Mailjet client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mailjet client:', error.message);
    }
  }
  
  setupFallbackTransporter() {
    try {
      this.fallbackTransporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'Gmail',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_FROM || 'admin@fieldflow.co.nz',
          pass: process.env.SMTP_PASSWORD || ''
        }
      });
      if (!process.env.SMTP_PASSWORD) {
        console.warn('⚠️ No SMTP password configured for fallback email service');
        this.fallbackTransporter = null;
      }
    } catch (error) {
      console.error('❌ Failed to initialize fallback email transporter:', error.message);
    }
  }

  /**
   * Send an email with report PDF attachment
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Response from email service
   */
  async sendReportEmail(options) {
    try {
      if (!fs.existsSync(options.pdfPath)) {
        throw new Error(`PDF file not found at path: ${options.pdfPath}`);
      }
      const pdfData = fs.readFileSync(options.pdfPath);
      const attachment = pdfData.toString('base64');
      
      const fromEmail = process.env.EMAIL_FROM || 'admin@fieldflow.co.nz';
      const fromName = process.env.EMAIL_NAME || 'FieldFlow';
      const emailContent = {
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: [
              {
                Email: options.to,
                Name: options.reportData.customer?.name || options.to
              }
            ],
            Subject: options.subject || `Report: ${options.reportData.report_number}`,
            TextPart: options.text || this.getDefaultTextContent(options.reportData),
            HTMLPart: options.html || this.getDefaultHtmlContent(options.reportData),
            Attachments: [
              {
                ContentType: 'application/pdf',
                Filename: options.pdfFilename || 'report.pdf',
                Base64Content: attachment
              }
            ]
          }
        ]
      };
      if (!this.mailjet) {
        throw new Error('Mailjet client not initialized. Check your API keys.');
      }
      
      try {
        console.log('Attempting to send email via Mailjet...');
        const response = await this.mailjet
          .post('send', { version: 'v3.1' })
          .request(emailContent);
        
        console.log('✅ Email sent successfully via Mailjet');
        return response.body;
      } catch (mailjetError) {
        console.error('❌ Mailjet email sending failed:', mailjetError.message);
        console.error('Mailjet status code:', mailjetError.statusCode);
        console.error('Mailjet error details:', mailjetError.ErrorMessage || 'Unknown error');
        if (this.fallbackTransporter) {
          return this.sendWithFallback(options, pdfData);
        }
        throw mailjetError;
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  
  /**
   * Fallback email sending using Nodemailer
   * @param {Object} options - Email options
   * @param {Buffer} pdfData - PDF file data
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendWithFallback(options, pdfData) {
    console.log('Attempting to send email via fallback SMTP...');
    
    const fromEmail = process.env.EMAIL_FROM || 'admin@fieldflow.co.nz';
    const fromName = process.env.EMAIL_NAME || 'FieldFlow';
    const message = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject || `FieldFlow Report: ${options.reportData.report_number}`,
      text: options.text || this.getDefaultTextContent(options.reportData),
      html: options.html || this.getDefaultHtmlContent(options.reportData),
      attachments: [
        {
          filename: options.pdfFilename || 'report.pdf',
          content: pdfData,
          contentType: 'application/pdf'
        }
      ]
    };
    const response = await this.fallbackTransporter.sendMail(message);
    console.log('✅ Email sent successfully via fallback SMTP');
    return response;
  }
  
  /**
   * Get default plain text content
   * @param {Object} reportData - Report data
   * @returns {string} Text content
   */
  getDefaultTextContent(reportData) {
    return `
      Report: ${reportData.report_number}
      
      Dear ${reportData.customer?.name || 'Customer'},
      
      Please find attached the report from your recent service.
      
      Report Number: ${reportData.report_number}
      Date: ${new Date(reportData.created_at).toLocaleDateString()}
      ${reportData.job ? `Job: ${reportData.job.title}` : ''}
      
      If you have any questions, please don't hesitate to contact us.
      
      Thank you for your business.
      
      Regards,
      FieldFlow Team
    `;
  }
  
  /**
   * Get default HTML content
   * @param {Object} reportData - Report data
   * @returns {string} HTML content
   */
  getDefaultHtmlContent(reportData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #777B7E;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>XXX Report</h2>
          </div>
          <div class="content">
            <p>Dear ${reportData.customer?.name || 'Customer'},</p>
            <p>Please find attached the report from your recent service.</p>
            <p><strong>Report Number:</strong> ${reportData.report_number}<br>
            <strong>Date:</strong> ${new Date(reportData.created_at).toLocaleDateString()}<br>
            ${reportData.job ? `<strong>Job:</strong> ${reportData.job.title}` : ''}
            </p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Thank you for your business.</p>
            <p>Regards,<br>XXXX Team</p>
          </div>
          <div class="footer">
            <p>Do not reply to this email adress, <br />
              Reply to: TODO</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();