import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import serveIndex from 'serve-index';

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure pdfs directory exists
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
  console.log('Created pdfs directory');
}

app.use(cors());
app.use(express.json());
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.use('/pdfs', serveIndex(path.join(__dirname, 'pdfs'), { icons: true })); 

app.post('/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { content, page } = req.body;

    const html = generateHTML(content, page);
    const filename = `Page-${page}.pdf`;
    const filepath = path.join(__dirname, 'pdfs', filename);

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      })
    });

    const pageObj = await browser.newPage();
    await pageObj.setContent(html, { waitUntil: 'networkidle0' });

    await pageObj.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '30mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
    });

    await browser.close();

    res.status(200).json({
      message: `PDF generated for Page ${page}`,
      fileUrl: `http://localhost:${PORT}/pdfs/${filename}`,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error stack:', errorStack);
    console.error('Error message:', errorMessage);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && errorStack && { stack: errorStack })
    });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'PDF Generation API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    service: 'PDF Generation API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ PDF API running at http://localhost:${PORT}`);
});

function generateHTML(content: string, pageNumber: number): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <title>DayOnes | Page ${pageNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
          color: #333;
        }
        .header-image {
          background: url('https://source.unsplash.com/featured/?linen,clothing') center/cover no-repeat;
          height: 200px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        h1 {
          color: #1a73e8;
          font-size: 28px;
        }
        p {
          font-size: 16px;
          line-height: 1.7;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #aaa;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="header-image"></div>
      <h1>Page ${pageNumber}</h1>
      <p>${content.replace(/\n/g, '<br>')}</p>
      <div class="footer">DayOnes • Page ${pageNumber}</div>
    </body>
  </html>
  `;
}