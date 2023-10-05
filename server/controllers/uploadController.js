const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.use(cors());

const fs = require("fs").promises;
const path = require("path");
const papa = require("papaparse");

/**
 *
 * @param {filePath} filePath path for csv file to be parsed
 * @returns parsed array of arrays corressponding to the CSV provided
 */
function parseCSVtoAOA(filePath) {
    return new Promise((resolve, reject) => {
        // Read the CSV file
        fs.readFile(filePath, "utf8")
            .then((data) => {
                // Parse the CSV data using papaparse
                const parsedData = papa.parse(data, {
                    header: true, // Set to true if your CSV has headers
                    dynamicTyping: true, // Convert numeric and boolean values to their respective types
                });

                // Access the data as an array of objects (if header is true)
                // or as an array of arrays (if header is false)
                const dataArray = parsedData.data;

                // Resolve the Promise with the parsed data
                resolve(dataArray);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

// route - http://localhost:5000/upload
const uploadControl = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = path.join(
        __dirname,
        `../uploads/${req.file.originalname}`
    );

    try {
        const dataArray = await parseCSVtoAOA(filePath); // Parse CSV with headers
        console.log(Object.keys(dataArray[0]));

        return res.status(200).json({
            preferredLabels: Object.keys(dataArray[0]),
            filename: req.file.originalname,
        });
    } catch (error) {
        console.error("Error parsing CSV:", error);
    }
};

module.exports = {
    uploadControl,
};
