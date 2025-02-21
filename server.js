const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
require("dotenv").config();

const app = express();
const upload = multer();

app.post("/analyze-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Extract text from the PDF
        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text.trim();

        if (!resumeText) {
            return res.status(400).json({ error: "Could not extract text from the PDF" });
        }

        // Prepare request to Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents: [{ parts: [{ text: `Analyze this resume and suggest improvements:\n\n${resumeText}` }] }],
            },
            { headers: { "Content-Type": "application/json" } }
        );

        res.json(response.data);
    } catch (error) {
        console.error("Error processing resume:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
