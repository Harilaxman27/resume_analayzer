const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Configure Express
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { error: null }); // Pass `error` as null initially
});

app.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    // Read PDF content
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const textContent = pdfData.text;

    // Generate analysis using Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze this resume and provide detailed feedback in the following areas:
    1. Key skills and qualifications
    2. Experience summary
    3. Education background
    4. Areas for improvement
    5. Overall strength score (1-10)

    Resume content:
    ${textContent}`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    // Delete uploaded file after analysis
    fs.unlinkSync(req.file.path);

    // Render results page with analysis
    res.render('result', { analysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('index', { error: error.message }); // Pass `error` to `index.ejs`
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});