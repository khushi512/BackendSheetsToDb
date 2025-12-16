require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

// Helper function for formatted output
const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function testGoogleSheetsConnection() {
    log.header('🔍 Testing Google Sheets API Connection...');

    // Step 1: Validate environment variables
    log.info('Step 1: Checking environment variables...');

    const requiredEnvVars = ['GOOGLE_CREDENTIALS_PATH', 'GOOGLE_SHEET_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        log.error('Missing required environment variables:');
        missingVars.forEach(varName => {
            console.log(`  ${colors.red}✗${colors.reset} ${varName}`);
        });
        log.warning('\nPlease add these to your .env file:');
        console.log('  GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json');
        console.log('  GOOGLE_SHEET_ID=your-sheet-id-here');
        process.exit(1);
    }

    log.success('Environment variables present');
    console.log(`  Credentials Path: ${colors.cyan}${process.env.GOOGLE_CREDENTIALS_PATH}${colors.reset}`);
    console.log(`  Sheet ID: ${colors.cyan}${process.env.GOOGLE_SHEET_ID}${colors.reset}\n`);

    // Step 2: Check credentials file exists
    log.info('Step 2: Checking credentials file...');

    const credentialsPath = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH);

    if (!fs.existsSync(credentialsPath)) {
        log.error(`Credentials file not found at: ${credentialsPath}`);
        log.warning('\nPlease make sure you:');
        console.log('  1. Downloaded the JSON credentials from Google Cloud Console');
        console.log('  2. Saved it to the credentials/ folder');
        console.log('  3. Updated GOOGLE_CREDENTIALS_PATH in .env');
        process.exit(1);
    }

    log.success(`Credentials file found: ${path.basename(credentialsPath)}`);

    // Step 3: Load and validate credentials
    log.info('Step 3: Loading credentials...');

    let credentials;
    try {
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsContent);

        // Validate required fields
        const requiredFields = ['client_email', 'private_key', 'project_id'];
        const missingFields = requiredFields.filter(field => !credentials[field]);

        if (missingFields.length > 0) {
            log.error('Invalid credentials file. Missing fields:');
            missingFields.forEach(field => console.log(`  ${colors.red}✗${colors.reset} ${field}`));
            process.exit(1);
        }

        log.success('Credentials loaded successfully');
        console.log(`  Service Account: ${colors.cyan}${credentials.client_email}${colors.reset}`);
        console.log(`  Project ID: ${colors.cyan}${credentials.project_id}${colors.reset}\n`);

    } catch (error) {
        log.error('Failed to parse credentials file');
        console.error(`  Error: ${error.message}`);
        log.warning('\nMake sure the credentials file is valid JSON format.');
        process.exit(1);
    }

    // Step 4: Initialize Google Sheets API
    log.info('Step 4: Initializing Google Sheets API...');

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        log.success('Google Sheets API initialized');

        // Step 5: Test connection by getting spreadsheet metadata
        log.info('Step 5: Connecting to Google Sheet...');

        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
        });

        log.success('Successfully connected to Google Sheet!');
        console.log(`  Sheet Title: ${colors.cyan}${spreadsheet.data.properties.title}${colors.reset}`);
        console.log(`  Sheet URL: ${colors.cyan}https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}${colors.reset}`);
        console.log(`  Number of Sheets: ${colors.cyan}${spreadsheet.data.sheets.length}${colors.reset}\n`);

        // List all sheet tabs
        log.info('Available sheets:');
        spreadsheet.data.sheets.forEach((sheet, index) => {
            console.log(`  ${index + 1}. ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows × ${sheet.properties.gridProperties.columnCount} columns)`);
        });

        // Step 6: Try to read some data
        log.info('\nStep 6: Reading sample data...');

        const firstSheetName = spreadsheet.data.sheets[0].properties.title;
        const range = `${firstSheetName}!A1:Z10`; // Read first 10 rows, all columns

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            log.warning('Sheet appears to be empty');
            console.log('  Add some data to your sheet to test data extraction.');
        } else {
            log.success(`Retrieved ${rows.length} rows from sheet`);

            // Display first few rows
            console.log('\n  Preview of data:');
            const previewRows = rows.slice(0, 5);
            previewRows.forEach((row, index) => {
                const rowData = row.slice(0, 5).join(', '); // Show first 5 columns
                const more = row.length > 5 ? '...' : '';
                console.log(`    Row ${index + 1}: ${rowData}${more}`);
            });

            if (rows.length > 5) {
                console.log(`    ... and ${rows.length - 5} more rows`);
            }
        }

        // Success summary
        log.header('✅ Google Sheets API Test Successful!');
        console.log(`${colors.green}Your Google Sheets API connection is working perfectly.${colors.reset}\n`);

        log.info('Important Reminders:');
        console.log(`  1. Make sure you shared the sheet with: ${credentials.client_email}`);
        console.log(`  2. The service account should have at least "Viewer" permissions`);
        console.log(`  3. For ETL operations, you may need "Editor" permissions\n`);

        console.log(`${colors.cyan}You can now proceed with:${colors.reset}`);
        console.log(`  1. Designing your database schema`);
        console.log(`  2. Building the ETL pipeline`);
        console.log(`  3. Creating the auto-registration workflow\n`);

    } catch (error) {
        log.header('❌ Connection Test Failed');
        log.error('Failed to connect to Google Sheets');

        console.log(`\n${colors.red}Error Details:${colors.reset}`);
        console.log(`  Type: ${error.name || 'Unknown'}`);
        console.log(`  Message: ${error.message}`);

        // Provide helpful error-specific guidance
        if (error.message.includes('Unable to parse')) {
            log.warning('\nPossible Issues:');
            console.log('  • Credentials file is corrupted or invalid JSON');
            console.log('  • Re-download credentials from Google Cloud Console');
        } else if (error.message.includes('Requested entity was not found')) {
            log.warning('\nPossible Issues:');
            console.log('  • Sheet ID is incorrect');
            console.log('  • Sheet does not exist');
            console.log('  • Check the URL of your Google Sheet for the correct ID');
        } else if (error.message.includes('does not have permission')) {
            log.warning('\nPossible Issues:');
            console.log('  • Sheet is not shared with the service account');
            console.log(`  • Share the sheet with: ${credentials.client_email}`);
            console.log('  • Grant at least "Viewer" permission');
        } else if (error.message.includes('API has not been used')) {
            log.warning('\nPossible Issues:');
            console.log('  • Google Sheets API is not enabled in your project');
            console.log('  • Go to Google Cloud Console → APIs & Services → Library');
            console.log('  • Search for "Google Sheets API" and enable it');
        }

        console.log(`\n${colors.cyan}For help, see: docs/GOOGLE_SHEETS_API_SETUP.md${colors.reset}\n`);

        if (error.response) {
            console.log(`\nFull error response:`);
            console.log(JSON.stringify(error.response.data, null, 2));
        }

        process.exit(1);
    }
}

// Run the test
testGoogleSheetsConnection().catch(error => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
});
