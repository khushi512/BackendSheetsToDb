require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Extract Module - Fetches data from Google Sheets using the Sheets API
 */

class GoogleSheetsExtractor {
    constructor(credentialsPath, sheetId) {
        this.credentialsPath = credentialsPath;
        this.sheetId = sheetId;
        this.sheets = null;
    }

    
    //Initialize Google Sheets API client

    async initialize() {
        const auth = new google.auth.GoogleAuth({
            keyFile: this.credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    /**
     * Extract data from a specific range in Google Sheets
     * @param {string} sheetName - Name of the sheet tab
     * @param {string} range - Range to extract (e.g., 'A:J' or 'A1:J100')
     * @returns {Object} - { headers: [...], rows: [[...], [...]] }
     */
    async extract(sheetName, range = 'A:Z') {
        if (!this.sheets) {
            await this.initialize();
        }

        try {
            const fullRange = `${sheetName}!${range}`;

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: fullRange,
            });

            const values = response.data.values;

            if (!values || values.length === 0) {
                return {
                    headers: [],
                    rows: [],
                    metadata: {
                        sheetName,
                        range,
                        rowCount: 0
                    }
                };
            }

            // First row is headers
            const headers = values[0];
            const rows = values.slice(1);

            return {
                headers,
                rows,
                metadata: {
                    sheetName,
                    range,
                    rowCount: rows.length,
                    columnCount: headers.length,
                    extractedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            throw new Error(`Failed to extract data from Google Sheets: ${error.message}`);
        }
    }

    /**
     * Extract data based on dataset configuration
     * @param {Object} datasetConfig - Configuration from dataset-config.json
     * @returns {Object} - Extracted data with metadata
     */
    async extractFromConfig(datasetConfig) {
        const { source } = datasetConfig;

        if (!source || source.type !== 'google_sheets') {
            throw new Error('Invalid dataset configuration: must specify google_sheets source');
        }

        // Override sheetId if specified in config
        if (source.sheetId) {
            this.sheetId = source.sheetId;
        }

        const data = await this.extract(source.sheetName, source.range);

        // Add dataset metadata
        data.metadata.datasetName = datasetConfig.datasetName;
        data.metadata.description = datasetConfig.description;

        return data;
    }

    /**
     * Convert raw rows to structured objects using headers
     * @param {Array} headers - Column headers
     * @param {Array} rows - Data rows
     * @returns {Array} - Array of objects with header keys
     */
    rowsToObjects(headers, rows) {
        return rows.map((row, index) => {
            const obj = { _rowIndex: index + 2 }; // +2 because: 0-indexed + skip header

            headers.forEach((header, colIndex) => {
                obj[header] = row[colIndex] || null;
            });

            return obj;
        });
    }
}

/**
 * Extract data from Google Sheets
 * @param {Object} config - Configuration object or path to config file
 * @returns {Object} - Extracted data
 */
async function extractData(config) {
    // Load config if it's a path
    if (typeof config === 'string') {
        const configPath = path.resolve(config);
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Use credentials and sheet ID from environment or config
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || config.source?.credentialsPath;
    const sheetId = process.env.GOOGLE_SHEET_ID || config.source?.sheetId;

    if (!credentialsPath || !sheetId) {
        throw new Error('Missing Google Sheets credentials or sheet ID');
    }

    const extractor = new GoogleSheetsExtractor(credentialsPath, sheetId);
    const rawData = await extractor.extractFromConfig(config);

    // Convert rows to objects for easier transformation
    const records = extractor.rowsToObjects(rawData.headers, rawData.rows);

    return {
        records,
        metadata: rawData.metadata,
        config
    };
}

module.exports = {
    GoogleSheetsExtractor,
    extractData
};
