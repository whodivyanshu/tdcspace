import express, { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
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

    const filename = `Page-${page}.pdf`;
    const filepath = path.join(__dirname, 'pdfs', filename);

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 85, // 30mm
        bottom: 57, // 20mm
        left: 57, // 20mm
        right: 57 // 20mm
      }
    });

    // Pipe the PDF to a write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add content to PDF
    generatePDF(doc, content, page);

    // Finalize the PDF
    doc.end();

    // Wait for the stream to finish writing
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

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

function generatePDF(doc: any, content: string, pageNumber: number): void {
  // Add a subtle background color (optional)
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fill('#ffffff');

  // Add header image placeholder (colored rectangle for now)
  doc.rect(57, 85, 498, 150) // A4 width - margins = 498
     .fill('#f0f0f0')
     .stroke('#ddd');
  
  // Add "Image Placeholder" text in the rectangle
  doc.fill('#999')
     .fontSize(14)
     .text('Header Image Placeholder', 57, 150, { align: 'center', width: 498 });

  // Add main title
  doc.fill('#1a73e8')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text(`Page ${pageNumber}`, 57, 270);

  // Add main content
  doc.fill('#333')
     .fontSize(16)
     .font('Helvetica')
     .text(content, 57, 320, {
       width: 498,
       lineGap: 5,
       align: 'left'
     });

  // Add footer
  const footerY = doc.page.height - 100;
  doc.fill('#aaa')
     .fontSize(12)
     .text(`DayOnes • Page ${pageNumber}`, 57, footerY, {
       width: 498,
       align: 'right'
     });
}