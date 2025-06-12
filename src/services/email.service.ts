import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getConfig } from '../config/app.config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = getConfig();

    // For development/testing, use ethereal email or Gmail
    // In production, you would use your actual SMTP settings

    console.log(
      'email user, password',
      process.env.EMAIL_USER,
      process.env.EMAIL_PASSWORD,
    );
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
      },
    });

    this.logger.log('📧 Email transporter initialized');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from:
          process.env.EMAIL_FROM || 'HR Management System <noreply@hrm.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`📧 Email sent successfully to ${options.to}`);
      this.logger.debug(`Message ID: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendTaskCreatedEmail(
    email: string,
    taskCode: string,
    taskName: string,
    projectName?: string,
  ): Promise<void> {
    const subject = `Nhiệm vụ mới được tạo: ${taskCode}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .email-container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .email-body {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .task-info {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🎯 Nhiệm vụ mới được tạo</h1>
          </div>
          <div class="email-body">
            <p>Xin chào,</p>
            
            <p>Một nhiệm vụ mới đã được tạo trong hệ thống quản lý nhân sự:</p>
            
            <div class="task-info">
              <h3>📋 Thông tin nhiệm vụ:</h3>
              <p><strong>Mã nhiệm vụ:</strong> ${taskCode}</p>
              <p><strong>Tên nhiệm vụ:</strong> ${taskName}</p>
              ${projectName ? `<p><strong>Dự án:</strong> ${projectName}</p>` : ''}
              <p><strong>Thời gian tạo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>
            
            <p>Vui lòng truy cập hệ thống để xem chi tiết và bắt đầu làm việc.</p>
            
            <p>Trân trọng,<br>
            <strong>Hệ thống quản lý nhân sự</strong></p>
          </div>
          <div class="footer">
            <p>Đây là email tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Nhiệm vụ mới được tạo

Mã nhiệm vụ: ${taskCode}
Tên nhiệm vụ: ${taskName}
${projectName ? `Dự án: ${projectName}` : ''}
Thời gian tạo: ${new Date().toLocaleString('vi-VN')}

Vui lòng truy cập hệ thống để xem chi tiết.

Trân trọng,
Hệ thống quản lý nhân sự
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Email connection test failed:', error);
      return false;
    }
  }
}
