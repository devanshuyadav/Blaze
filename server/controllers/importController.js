const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs").promises;
const path = require("path");
const papa = require("papaparse");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

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

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorizeGoogleSheets() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Creates a new spreadsheet
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function createNewSheet(auth, filename) {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheet = await sheets.spreadsheets.create({
        resource: {
            properties: {
                title: `${Date.now()}-${filename}`,
            },
        },
    });
    return spreadsheet.data.spreadsheetId; // Return the ID of the newly created sheet
}

/**
 * Populate give data into spreadsheet corresponding to the spreadsheetID provided
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client
 * @param spreadsheetId ID for the spreadsheet where data needs to be inserted
 * @param data the csv data that needs to be inserted
 */
async function populateSheet(auth, spreadsheetId, data) {
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1", // Update with the correct sheet name or range
        valueInputOption: "RAW", // Use 'RAW' for simple values
        insertDataOption: "INSERT_ROWS", // Choose how to insert data
        resource: {
            values: data, // Insert your CSV data here
        },
    });
    return response.data;
}

// route - http://localhost:5000/import
const importControl = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "No data found." });
    }

    console.log("this hit");
    console.log(req.body);

    const { filename, preferredLabels } = req.body; // Destructure the values from the request body

    // console.log("Received filename:", filename);
    // console.log("Received preferredLabels:", preferredLabels);

    const selectedColumns = preferredLabels
        .filter((label) => label.checked)
        .map((label) => label.ColumnName);

    // console.log("Selected Columns:", selectedColumns);

    authorizeGoogleSheets()
        .then(async (auth) => {
            console.log("Google Sheets Authorized!");
            const filepath = path.join(__dirname, `../uploads/${filename}`);

            try {
                // 1. create dataArray from CSV file
                const dataArray = await parseCSVtoAOA(filepath); // Parse CSV with headers
                // console.log("Parsed CSV Data:", dataArray);

                let columnLabels = [];

                // 2. use Object.keys() to generate list of all columm labels (in correct order)
                const correctOrderLabels = Object.keys(dataArray[0]);
                // console.log("correctOrderLabels:", correctOrderLabels);

                // 3. Iterate over allColumnLabels arrray, for each item in the array check if it's included in userGivenArray
                correctOrderLabels.forEach((label) => {
                    if (selectedColumns.includes(label)) {
                        columnLabels.push(label);
                    }
                });

                // console.log("columnlabels:", columnLabels);

                // 5. generate ValuesToInsert (dataArray.map)
                const valuesToInsert = dataArray.map((row) => [
                    ...columnLabels.map((label) => row[label]),
                ]);

                // console.log("value to insert:", valuesToInsert);

                // 6. append columnLabels to the start of valuesToInsert
                const newValuesToInsert = [selectedColumns, ...valuesToInsert];
                // console.log("new value to insert:", newValuesToInsert);

                const spreadsheetID = await createNewSheet(auth, filename);
                // console.log("spreadsheetID:", spreadsheetID);
                // console.log("value to insert:", newValuesToInsert);
                const populateSheetResponse = await populateSheet(
                    auth,
                    spreadsheetID,
                    newValuesToInsert
                );
                // console.log("Populate Sheet response:", populateSheetResponse);
                console.log("Values inserted in sheet!!");
                return res.status(200).json({
                    message: "Final Server message OK",
                    spreadsheetID: spreadsheetID,
                });
            } catch (error) {
                console.error("Error importing to sheets:", error);
            }
        })
        .catch((err) => {
            console.error(err);
        });
};

module.exports = {
    importControl,
};
