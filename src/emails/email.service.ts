import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,

      auth: {
        user: 'lenguyenhuyvu.htn@gmail.com', // Thay thế bằng email của bạn
        pass: 'cfeftoxwoghbhmiu', // Thay thế bằng mật khẩu email của bạn
      },
    });
  }

  private async loadTemplate(
    templateName: string,
    variables: Record<string, string>, // Sử dụng kiểu Record để chỉ định rõ các giá trị là chuỗi
  ): Promise<string> {
    const baseDir =
      process.env.NODE_ENV === 'production'
        ? path.join(__dirname, '..\\..', 'src') // hoặc 'dist' nếu các tệp email nằm trong dist khi chạy production
        : path.join(__dirname, '..\\..', 'src');
        const filePath = path.join(baseDir, 'templates', 'email', `${templateName}.html`);
    let template = fs.readFileSync(filePath, 'utf-8').toString();

    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return template;
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, string>, // Sử dụng kiểu Record để chỉ định rõ các giá trị là chuỗi
  ) {
    const html = await this.loadTemplate(templateName, variables);

    const mailOptions = {
      from: 'MicroService', // Thay thế bằng email của bạn
      to,
      subject,
      html,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(to: string, name: string, username: string) {
    const subject = 'Welcome to our service';
    const templateName = 'welcome';
    const variables = { name, username };

    return await this.sendMail(to, subject, templateName, variables);
  }
}
