require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Generic Data Audit Tool
 * Analyzes any dataset based on configuration file
 */
async function dataAudit(datasetName = 'student_registration') {
    log.header(`📊 Data Audit: ${datasetName}`);

    // Load configuration
    const configPath = path.join(__dirname, '..', 'config', 'dataset-config.json');

    if (!fs.existsSync(configPath)) {
        log.error(`Configuration file not found: ${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    log.success(`Loaded configuration for: ${config.datasetName}`);

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // Extract data from Google Sheets
        log.info('Step 1: Extracting data from Google Sheets...');

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.source.sheetId,
            range: config.source.range,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            log.warning('No data found in the sheet');
            return;
        }

        const headers = config.source.hasHeader ? rows[0] : [];
        const dataRows = config.source.hasHeader ? rows.slice(1) : rows;

        log.success(`Extracted ${dataRows.length} rows with ${headers.length} columns`);
        console.log(`  Headers: ${headers.join(', ')}\n`);

        // Initialize audit report
        const auditReport = {
            dataset: config.datasetName,
            analyzedAt: new Date().toISOString(),
            totalRows: dataRows.length,
            totalColumns: headers.length,
            columns: {},
            issues: {
                missingValues: [],
                duplicates: [],
                formatIssues: [],
                invalidValues: []
            },
            summary: {}
        };

        // Step 2: Analyze each column
        log.info('Step 2: Analyzing columns...\n');

        config.schema.columns.forEach((columnDef, colIndex) => {
            const sourceName = columnDef.sourceName;
            const headerIndex = headers.indexOf(sourceName);

            if (headerIndex === -1) {
                log.warning(`Column "${sourceName}" not found in sheet`);
                return;
            }

            // Extract column values
            const columnValues = dataRows.map(row => row[headerIndex]);

            // Analyze column
            const columnAnalysis = analyzeColumn(columnValues, columnDef, dataRows);
            auditReport.columns[sourceName] = columnAnalysis;

            // Display results
            console.log(`${colors.cyan}Column: ${sourceName}${colors.reset}`);
            console.log(`  Data Type: ${columnDef.dataType}`);
            console.log(`  Required: ${columnDef.required ? 'Yes' : 'No'}`);
            console.log(`  Total Values: ${columnAnalysis.totalValues}`);
            console.log(`  Null/Empty: ${columnAnalysis.nullCount} (${columnAnalysis.nullPercentage.toFixed(1)}%)`);
            console.log(`  Unique Values: ${columnAnalysis.uniqueCount}`);

            if (columnAnalysis.duplicateCount > 0) {
                console.log(`  ${colors.yellow}Duplicates: ${columnAnalysis.duplicateCount}${colors.reset}`);
            }

            if (columnAnalysis.invalidCount > 0) {
                console.log(`  ${colors.red}Invalid: ${columnAnalysis.invalidCount}${colors.reset}`);
            }

            console.log('');
        });

        // Step 3: Detect duplicate rows
        log.info('Step 3: Detecting duplicate rows...');
        const duplicates = detectDuplicates(dataRows, headers, config);
        auditReport.issues.duplicates = duplicates;

        if (duplicates.length > 0) {
            log.warning(`Found ${duplicates.length} duplicate record(s)`);
            duplicates.forEach(dup => {
                console.log(`  Row ${dup.rowNumbers.join(', ')}: ${dup.key}`);
            });
        } else {
            log.success('No duplicate rows found');
        }

        // Step 4: Calculate data quality score
        log.info('\nStep 4: Calculating data quality score...');
        const qualityScore = calculateQualityScore(auditReport, config);
        auditReport.dataQualityScore = qualityScore;

        console.log(`\n${colors.bright}Data Quality Score: ${getScoreColor(qualityScore)}${qualityScore.toFixed(1)}%${colors.reset}\n`);

        // Step 5: Generate summary
        const summary = generateSummary(auditReport, config);
        auditReport.summary = summary;

        displaySummary(summary);

        // Step 6: Save report
        log.info('Step 6: Saving audit report...');
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, `data-audit-${datasetName}-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
        log.success(`Report saved: ${path.basename(reportPath)}`);

        log.header('✅ Data Audit Complete!');

    } catch (error) {
        log.error('Data audit failed');
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Analyze a single column
 */
function analyzeColumn(values, columnDef, allRows) {
    const analysis = {
        totalValues: values.length,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        sampleValues: [],
        patterns: {}
    };

    const uniqueValues = new Set();
    const valueCounts = {};

    values.forEach(value => {
        // Check for null/empty
        if (value === null || value === undefined || value === '') {
            analysis.nullCount++;
            return;
        }

        // Track unique values
        uniqueValues.add(value);
        valueCounts[value] = (valueCounts[value] || 0) + 1;

        // Basic validation
        if (columnDef.dataType === 'integer' && isNaN(parseInt(value))) {
            analysis.invalidCount++;
        }

        if (columnDef.validation === 'email' && !isValidEmail(value)) {
            analysis.invalidCount++;
        }
    });

    analysis.uniqueCount = uniqueValues.size;
    analysis.nullPercentage = (analysis.nullCount / analysis.totalValues) * 100;

    // Find duplicates
    Object.entries(valueCounts).forEach(([value, count]) => {
        if (count > 1 && columnDef.unique) {
            analysis.duplicateCount += count - 1;
        }
    });

    // Sample values (first 5 unique)
    analysis.sampleValues = Array.from(uniqueValues).slice(0, 5);

    return analysis;
}

/**
 * Detect duplicate rows
 */
function detectDuplicates(rows, headers, config) {
    const duplicates = [];
    const seen = new Map();

    const primaryKeyIndex = headers.indexOf(
        config.schema.columns.find(c => c.targetName === config.schema.primaryKey)?.sourceName
    );

    rows.forEach((row, index) => {
        const key = row[primaryKeyIndex];

        if (key && key !== '') {
            if (seen.has(key)) {
                seen.get(key).push(index + 2); // +2 for header row and 1-indexed
            } else {
                seen.set(key, [index + 2]);
            }
        }
    });

    seen.forEach((rowNumbers, key) => {
        if (rowNumbers.length > 1) {
            duplicates.push({ key, rowNumbers });
        }
    });

    return duplicates;
}

/**
 * Calculate overall data quality score
 */
function calculateQualityScore(auditReport, config) {
    let totalScore = 0;
    let weights = 0;

    // Completeness score (70% weight)
    const requiredColumns = config.schema.columns.filter(c => c.required);
    let completenessScore = 0;

    requiredColumns.forEach(col => {
        const analysis = auditReport.columns[col.sourceName];
        if (analysis) {
            completenessScore += (100 - analysis.nullPercentage);
        }
    });

    completenessScore = completenessScore / requiredColumns.length;
    totalScore += completenessScore * 0.7;
    weights += 0.7;

    // Uniqueness score (15% weight)
    const uniqueColumns = config.schema.columns.filter(c => c.unique);
    let uniquenessScore = 100;

    if (auditReport.issues.duplicates.length > 0) {
        uniquenessScore = Math.max(0, 100 - (auditReport.issues.duplicates.length / auditReport.totalRows) * 100);
    }

    totalScore += uniquenessScore * 0.15;
    weights += 0.15;

    // Validity score (15% weight)
    let totalInvalid = 0;
    Object.values(auditReport.columns).forEach(col => {
        totalInvalid += col.invalidCount || 0;
    });

    const validityScore = Math.max(0, 100 - (totalInvalid / auditReport.totalRows) * 100);
    totalScore += validityScore * 0.15;
    weights += 0.15;

    return totalScore / weights;
}

/**
 * Generate summary
 */
function generateSummary(auditReport, config) {
    return {
        totalRecords: auditReport.totalRows,
        completeRecords: auditReport.totalRows - auditReport.issues.missingValues.length,
        duplicateRecords: auditReport.issues.duplicates.length,
        invalidRecords: Object.values(auditReport.columns)
            .reduce((sum, col) => sum + (col.invalidCount || 0), 0),
        qualityScore: auditReport.dataQualityScore,
        recommendation: getRecommendation(auditReport.dataQualityScore)
    };
}

/**
 * Display summary
 */
function displaySummary(summary) {
    log.header('📋 Summary');
    console.log(`Total Records: ${colors.cyan}${summary.totalRecords}${colors.reset}`);
    console.log(`Complete Records: ${colors.green}${summary.completeRecords}${colors.reset}`);
    console.log(`Duplicate Records: ${colors.yellow}${summary.duplicateRecords}${colors.reset}`);
    console.log(`Invalid Records: ${colors.red}${summary.invalidRecords}${colors.reset}`);
    console.log(`\nRecommendation: ${summary.recommendation}\n`);
}

/**
 * Helper functions
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getScoreColor(score) {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.yellow;
    return colors.red;
}

function getRecommendation(score) {
    if (score >= 90) return 'Excellent data quality. Minor cleanup needed.';
    if (score >= 75) return 'Good data quality. Address missing and duplicate values.';
    if (score >= 60) return 'Fair data quality. Significant cleanup required.';
    return 'Poor data quality. Extensive data cleaning needed before migration.';
}

// Run audit
const datasetName = process.argv[2] || 'student_registration';
dataAudit(datasetName).catch(console.error);
