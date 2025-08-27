import * as puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

interface TicketData {
  ticketId: string;
  playTitle: string;
  userName: string;
  date: string;
  time: string;
  price: number;
  seatNumber?: string;
  qrCodeData?: string;
}

class PDFService {
  private browser: puppeteer.Browser | null = null;

  constructor() {
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    try {
      // Try to find Chrome/Chromium executable
      const chromePaths = [
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : null,
        process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null
      ].filter(Boolean);

      let executablePath: string | null = null;
      for (const path of chromePaths) {
        try {
          const fs = await import('fs');
          if (path && fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      };

      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      this.browser = await puppeteer.launch(launchOptions);
      console.log('Browser initialized successfully');
      
      // Set up browser error handling
      this.browser.on('disconnected', () => {
        console.log('Browser disconnected, will reinitialize on next request');
        this.browser = null;
      });
      
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize PDF browser: ${errorMessage}`);
    }
  }

  private async ensureBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      console.log('Browser not available, reinitializing...');
      await this.initializeBrowser();
    }
    
    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }
    
    return this.browser;
  }

  async generateTicketPDF(data: TicketData): Promise<Buffer> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    
    try {
      // Generate QR code if not provided
      let qrCodeDataUrl = data.qrCodeData;
      if (!qrCodeDataUrl) {
        qrCodeDataUrl = await QRCode.toDataURL(data.ticketId, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
      }
      
      // Ensure QR code is properly formatted
      if (!qrCodeDataUrl.startsWith('data:image/')) {
        qrCodeDataUrl = `data:image/png;base64,${qrCodeDataUrl}`;
      }

      // Read the ticket template
      const templatePath = path.join(process.cwd(), 'attached_assets', 'ticket-sample.html');
      if (!fs.existsSync(templatePath)) {
        throw new Error('Ticket template not found');
      }
      
      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders with actual data
      template = template
        .replace(/{{TITLE}}/g, data.playTitle)
        .replace(/{{NAME}}/g, data.userName)
        .replace(/{{DATE}}/g, data.date)
        .replace(/{{TIME}}/g, data.time)
        .replace(/{{PRICE}}/g, `€${data.price.toFixed(2)}`)
        .replace(/{{SEAT}}/g, data.seatNumber || 'General')
        .replace(/{{TICKET_ID}}/g, data.ticketId)
        .replace(/{{QR_CODE}}/g, qrCodeDataUrl);
      
      // Debug: Log QR code data URL length
      console.log(`QR Code data URL length: ${qrCodeDataUrl.length}`);
      console.log(`QR Code data URL starts with: ${qrCodeDataUrl.substring(0, 50)}...`);

      // Set content and generate PDF
      await page.setContent(template, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait for images to load with better error handling
      try {
        await page.waitForFunction(() => {
          const images = document.querySelectorAll('img');
          if (images.length === 0) return true;
          return Array.from(images).every(img => img.complete && img.naturalWidth > 0);
        }, { timeout: 15000 });
        
        // Debug: Check image status after loading
        const imageStatus = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          return Array.from(images).map((img, index) => ({
            index,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            src: img.src.substring(0, 50) + '...'
          }));
        });
        console.log('Image status after loading:', imageStatus);
      } catch (error) {
        console.log('Image loading timeout, proceeding with PDF generation...');
      }
      
      // Additional wait to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      if (!pdf || pdf.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      return Buffer.from(pdf);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // If it's a connection error, try to reinitialize browser and retry once
      if (error instanceof Error && error.message.includes('Connection closed')) {
        console.log('Connection error detected, reinitializing browser and retrying...');
        this.browser = null;
        
        try {
          const browser = await this.ensureBrowser();
          const retryPage = await browser.newPage();
          
          // Retry the PDF generation
          let qrCodeDataUrl = data.qrCodeData;
          if (!qrCodeDataUrl) {
            qrCodeDataUrl = await QRCode.toDataURL(data.ticketId, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              errorCorrectionLevel: 'M'
            });
          }
          
          if (!qrCodeDataUrl.startsWith('data:image/')) {
            qrCodeDataUrl = `data:image/png;base64,${qrCodeDataUrl}`;
          }

          const templatePath = path.join(process.cwd(), 'attached_assets', 'ticket-sample.html');
          if (!fs.existsSync(templatePath)) {
            throw new Error('Ticket template not found');
          }
          
          let template = fs.readFileSync(templatePath, 'utf-8');

          template = template
            .replace(/{{TITLE}}/g, data.playTitle)
            .replace(/{{NAME}}/g, data.userName)
            .replace(/{{DATE}}/g, data.date)
            .replace(/{{TIME}}/g, data.time)
            .replace(/{{PRICE}}/g, `€${data.price.toFixed(2)}`)
            .replace(/{{SEAT}}/g, data.seatNumber || 'General')
            .replace(/{{TICKET_ID}}/g, data.ticketId)
            .replace(/{{QR_CODE}}/g, qrCodeDataUrl);

          await retryPage.setContent(template, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });
          
          await retryPage.waitForFunction(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).every(img => img.complete);
          }, { timeout: 10000 });

          const pdf = await retryPage.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '0.5in',
              right: '0.5in',
              bottom: '0.5in',
              left: '0.5in'
            },
            preferCSSPageSize: true,
            displayHeaderFooter: false
          });

          if (!pdf || pdf.length === 0) {
            throw new Error('Generated PDF is empty');
          }

          await retryPage.close();
          return Buffer.from(pdf);
          
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw new Error(`Failed to generate PDF after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  async generateTicketPDFFromHTML(html: string): Promise<Buffer> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      if (!pdf || pdf.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      return Buffer.from(pdf);
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      
      // If it's a connection error, try to reinitialize browser and retry once
      if (error instanceof Error && error.message.includes('Connection closed')) {
        console.log('Connection error detected in HTML generation, reinitializing browser and retrying...');
        this.browser = null;
        
        try {
          const browser = await this.ensureBrowser();
          const retryPage = await browser.newPage();
          
          await retryPage.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });

          const pdf = await retryPage.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '0.5in',
              right: '0.5in',
              bottom: '0.5in',
              left: '0.5in'
            },
            preferCSSPageSize: true,
            displayHeaderFooter: false
          });

          if (!pdf || pdf.length === 0) {
            throw new Error('Generated PDF is empty');
          }

          await retryPage.close();
          return Buffer.from(pdf);
          
        } catch (retryError) {
          console.error('HTML retry failed:', retryError);
          throw new Error(`Failed to generate PDF from HTML after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      throw new Error(`Failed to generate PDF from HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  async generateCustomTicketHTML(data: TicketData): Promise<string> {
    // Generate QR code if not provided
    let qrCodeDataUrl = data.qrCodeData;
    if (!qrCodeDataUrl) {
      qrCodeDataUrl = await QRCode.toDataURL(data.ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entrada - ${data.playTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .ticket {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 400px;
            width: 100%;
            position: relative;
          }
          
          .ticket::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
          }
          
          .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px #667eea;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            font-weight: 500;
            color: #666;
            font-size: 14px;
          }
          
          .info-value {
            font-weight: 600;
            color: #333;
            font-size: 14px;
            text-align: right;
          }
          
          .qr-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #e0e0e0;
          }
          
          .qr-code {
            display: inline-block;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 10px;
          }
          
          .qr-code img {
            width: 120px;
            height: 120px;
          }
          
          .ticket-id {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #666;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 6px;
            display: inline-block;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          
          .footer p {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .footer .logo {
            font-weight: 700;
            color: #667eea;
            font-size: 14px;
          }
          
          @media print {
            body {
              background: white;
            }
            .ticket {
              box-shadow: none;
              border: 1px solid #ddd;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>🎭 ${data.playTitle}</h1>
            <p>Entrada Confirmada</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${data.userName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span class="info-value">${data.date}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Hora:</span>
              <span class="info-value">${data.time}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Asiento:</span>
              <span class="info-value">${data.seatNumber || 'General'}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Precio:</span>
              <span class="info-value">€${data.price.toFixed(2)}</span>
            </div>
            
            <div class="qr-section">
              <div class="qr-code">
                <img src="${qrCodeDataUrl}" alt="QR Code" />
              </div>
              <div class="ticket-id">${data.ticketId}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>Presenta este código QR en la entrada</p>
            <p class="logo">TeclaWEB</p>
            <p>Colegio Claret Sevilla</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService(); 