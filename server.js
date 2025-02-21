require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

// Initialize OpenAI API with the correct method
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Home route - Upload form
app.get('/', (req, res) => {
    res.render('index');
});

// Handle file upload and resume analysis
app.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        // Read uploaded PDF file
        const pdfBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(pdfBuffer);
        const resumeText = data.text;

        // Send extracted text to OpenAI for analysis
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'system', content: `Analyze this resume and suggest improvements:\n\n${resumeText}` }],
            max_tokens: 500
        });

        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        // Render results page
        res.render('result', { text: resumeText, suggestions: aiResponse.choices[0].message.content });
    } catch (error) {
        console.error("Error processing resume:", error);
        res.status(500).send('Error processing the resume. Please try again.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
