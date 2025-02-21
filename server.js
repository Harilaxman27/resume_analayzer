const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Load homepage
app.get("/", (req, res) => {
    res.render("index");
});

// Handle resume upload
app.post("/upload", upload.single("resume"), async (req, res) => {
    try {
        // Ensure file is uploaded
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const filePath = req.file.path;
        const fileData = fs.readFileSync(filePath, "utf8");

        // Send resume text to Gemini API
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            {
                contents: [{ parts: [{ text: `Analyze this resume and provide improvement suggestions:\n\n${fileData}` }] }]
            },
            { params: { key: process.env.GEMINI_API_KEY } }
        );

        // Extract suggestions from the API response
        const suggestions = response.data.candidates[0].content.parts[0].text;

        // Delete uploaded file after processing
        fs.unlinkSync(filePath);

        // Render the results page with analysis suggestions
        res.render("result", { suggestions });
    } catch (error) {
        console.error("Error processing resume:", error);
        res.status(500).send("Error processing the resume. Please try again.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
