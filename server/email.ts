import nodemailer from 'nodemailer';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface TicketEmailData {
  ticketId: string;
  playTitle: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  price: number;
  seatNumber?: string;
  qrCodeUrl?: string;
}

interface GroupTicketEmailData {
  ticketId: string;
  playTitle: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  adultTickets: number;
  childTickets: number;
  totalPrice: number;
  qrCodeUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development, use a test account or configure with real SMTP
    if (process.env.NODE_ENV === 'production') {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: Use Ethereal Email for testing
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Test email account created:', testAccount.user);
    } catch (error) {
      console.error('Failed to create test email account:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@teclaweb.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Email sent:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async sendTicketConfirmation(data: TicketEmailData): Promise<boolean> {
    const html = this.generateTicketEmailHTML(data);
    const subject = `Confirmación de Entrada - ${data.playTitle}`;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
    });
  }

  async sendGroupTicketConfirmation(data: GroupTicketEmailData): Promise<boolean> {
    const html = this.generateGroupTicketEmailHTML(data);
    const subject = `Confirmación de Entradas de Grupo - ${data.playTitle}`;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
    });
  }

  async sendTicketReminder(data: TicketEmailData): Promise<boolean> {
    const html = this.generateTicketReminderHTML(data);
    const subject = `Recordatorio - ${data.playTitle} mañana`;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
    });
  }

  async sendContactNotification(contactData: any): Promise<boolean> {
    const html = this.generateContactNotificationHTML(contactData);
    const subject = 'Nuevo mensaje de contacto - TeclaWEB';

    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@teclaweb.com';
    
    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  }

  private generateTicketEmailHTML(data: TicketEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Entrada</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .qr-code {
            text-align: center;
            margin: 20px 0;
          }
          .qr-code img {
            max-width: 200px;
            height: auto;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎭 Confirmación de Entrada</h1>
          <p>Tu entrada ha sido confirmada</p>
        </div>
        
        <div class="content">
          <h2>Hola ${data.userName},</h2>
          <p>Gracias por tu compra. Tu entrada ha sido confirmada para el siguiente evento:</p>
          
          <div class="ticket-info">
            <h3>${data.playTitle}</h3>
            <p><strong>Fecha:</strong> ${data.date}</p>
            <p><strong>Hora:</strong> ${data.time}</p>
            <p><strong>Precio:</strong> €${data.price.toFixed(2)}</p>
            ${data.seatNumber ? `<p><strong>Asiento:</strong> ${data.seatNumber}</p>` : ''}
            <p><strong>ID de Entrada:</strong> ${data.ticketId}</p>
          </div>
          
          ${data.qrCodeUrl ? `
            <div class="qr-code">
              <p><strong>Código QR para entrada:</strong></p>
              <img src="${data.qrCodeUrl}" alt="QR Code" />
            </div>
          ` : ''}
          
          <p><strong>Instrucciones importantes:</strong></p>
          <ul>
            <li>Llega 15 minutos antes del inicio</li>
            <li>Presenta este email o el código QR en la entrada</li>
            <li>No se permiten cambios ni devoluciones</li>
          </ul>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <div style="text-align: center;">
            <a href="mailto:info@teclaweb.com" class="button">Contactar Soporte</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 TeclaWEB - Colegio Claret Sevilla</p>
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateTicketReminderHTML(data: TicketEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Evento</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .reminder-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ff6b6b;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ Recordatorio de Evento</h1>
          <p>Mañana tienes un evento</p>
        </div>
        
        <div class="content">
          <h2>Hola ${data.userName},</h2>
          <p>Te recordamos que mañana tienes el siguiente evento:</p>
          
          <div class="reminder-info">
            <h3>${data.playTitle}</h3>
            <p><strong>Fecha:</strong> ${data.date}</p>
            <p><strong>Hora:</strong> ${data.time}</p>
            <p><strong>ID de Entrada:</strong> ${data.ticketId}</p>
          </div>
          
          <p><strong>No olvides:</strong></p>
          <ul>
            <li>Llegar 15 minutos antes del inicio</li>
            <li>Traer tu entrada o código QR</li>
            <li>Disfrutar del espectáculo</li>
          </ul>
          
          <p>¡Nos vemos mañana!</p>
        </div>
        
        <div class="footer">
          <p>© 2024 TeclaWEB - Colegio Claret Sevilla</p>
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateContactNotificationHTML(contactData: any): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Mensaje de Contacto</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .message-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 Nuevo Mensaje de Contacto</h1>
          <p>Se ha recibido un nuevo mensaje</p>
        </div>
        
        <div class="content">
          <h2>Detalles del mensaje:</h2>
          
          <div class="message-info">
            <p><strong>Nombre:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Asunto:</strong> ${contactData.subject}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${contactData.message}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          
          <p>Responde a este mensaje desde el panel de administración.</p>
        </div>
        
        <div class="footer">
          <p>© 2024 TeclaWEB - Colegio Claret Sevilla</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateGroupTicketEmailHTML(data: GroupTicketEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Entradas de Grupo</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .group-details {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #4CAF50;
          }
          .qr-code {
            text-align: center;
            margin: 20px 0;
          }
          .qr-code img {
            max-width: 200px;
            height: auto;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎭 Confirmación de Entradas de Grupo</h1>
          <p>Tus entradas han sido confirmadas</p>
        </div>
        
        <div class="content">
          <h2>Hola ${data.userName},</h2>
          <p>Gracias por tu compra. Tus entradas de grupo han sido confirmadas para el siguiente evento:</p>
          
          <div class="ticket-info">
            <h3>${data.playTitle}</h3>
            <p><strong>Fecha:</strong> ${data.date}</p>
            <p><strong>Hora:</strong> ${data.time}</p>
            <p><strong>ID de Entradas:</strong> ${data.ticketId}</p>
          </div>

          <div class="group-details">
            <h4>📋 Detalles del Grupo</h4>
            <p><strong>Total de entradas:</strong> ${data.adultTickets + data.childTickets}</p>
            <p><strong>Adultos:</strong> ${data.adultTickets} entrada(s)</p>
            <p><strong>Niños:</strong> ${data.childTickets} entrada(s) (1 entrada por cada 2 niños)</p>
            <p><strong>Precio total:</strong> €${data.totalPrice.toFixed(2)}</p>
          </div>
          
          ${data.qrCodeUrl ? `
            <div class="qr-code">
              <p><strong>Código QR para entrada del grupo:</strong></p>
              <img src="${data.qrCodeUrl}" alt="QR Code" />
              <p><em>Este código QR es válido para todo el grupo</em></p>
            </div>
          ` : ''}
          
          <p><strong>Instrucciones importantes:</strong></p>
          <ul>
            <li>Llega 15 minutos antes del inicio</li>
            <li>Presenta este email o el código QR en la entrada</li>
            <li>El código QR es válido para todo el grupo</li>
            <li>No se permiten cambios ni devoluciones</li>
          </ul>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <div style="text-align: center;">
            <a href="mailto:info@teclaweb.com" class="button">Contactar Soporte</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 TeclaWEB - Colegio Claret Sevilla</p>
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService(); 