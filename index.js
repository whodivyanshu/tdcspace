"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const serve_index_1 = __importDefault(require("serve-index"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Ensure pdfs directory exists
const pdfsDir = path_1.default.join(__dirname, 'pdfs');
if (!fs_1.default.existsSync(pdfsDir)) {
    fs_1.default.mkdirSync(pdfsDir, { recursive: true });
    console.log('Created pdfs directory');
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/pdfs', express_1.default.static(path_1.default.join(__dirname, 'pdfs')));
app.use('/pdfs', (0, serve_index_1.default)(path_1.default.join(__dirname, 'pdfs'), { icons: true }));
app.post('/generate-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, page } = req.body;
        const filename = `Page-${page}.pdf`;
        const filepath = path_1.default.join(__dirname, 'pdfs', filename);
        // Create a new PDF document
        const doc = new pdfkit_1.default({
            size: 'A4',
            margins: {
                top: 85, // 30mm
                bottom: 57, // 20mm
                left: 57, // 20mm
                right: 57 // 20mm
            }
        });
        // Pipe the PDF to a write stream
        const stream = fs_1.default.createWriteStream(filepath);
        doc.pipe(stream);
        // Add content to PDF
        generatePDF(doc, content, page);
        // Finalize the PDF
        doc.end();
        // Wait for the stream to finish writing
        yield new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
        res.status(200).json({
            message: `PDF generated for Page ${page}`,
            fileUrl: `http://localhost:${PORT}/pdfs/${filename}`,
        });
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Error stack:', errorStack);
        console.error('Error message:', errorMessage);
        res.status(500).json(Object.assign({ error: 'Failed to generate PDF', message: errorMessage }, (process.env.NODE_ENV !== 'production' && errorStack && { stack: errorStack })));
    }
}));
app.get('/', (req, res) => {
    res.json({
        message: 'PDF Generation API is running',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'PDF Generation API',
        timestamp: new Date().toISOString()
    });
});
app.listen(PORT, () => {
    console.log(`✅ PDF API running at http://localhost:${PORT}`);
});
function generatePDF(doc, content, pageNumber) {
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
