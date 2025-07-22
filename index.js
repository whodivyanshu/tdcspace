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
const puppeteer_1 = __importDefault(require("puppeteer"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const serve_index_1 = __importDefault(require("serve-index"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/pdfs', express_1.default.static(path_1.default.join(__dirname, 'pdfs')));
app.use('/pdfs', (0, serve_index_1.default)(path_1.default.join(__dirname, 'pdfs'), { icons: true }));
app.post('/generate-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, page } = req.body;
        const html = generateHTML(content, page);
        const filename = `Page-${page}.pdf`;
        const filepath = path_1.default.join(__dirname, 'pdfs', filename);
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const pageObj = yield browser.newPage();
        yield pageObj.setContent(html, { waitUntil: 'networkidle0' });
        yield pageObj.pdf({
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
        yield browser.close();
        res.status(200).json({
            message: `PDF generated for Page ${page}`,
            fileUrl: `http://localhost:${PORT}/pdfs/${filename}`,
        });
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Failed to generate PDF');
    }
}));
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.listen(PORT, () => {
    console.log(`✅ PDF API running at http://localhost:${PORT}`);
});
function generateHTML(content, pageNumber) {
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
