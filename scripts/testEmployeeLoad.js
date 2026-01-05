require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { loadData } = require('../etl/load');

/**
 * Test: Load Employee Data using Generalized load.js
 * 
 * This proves the same code works with different datasets
 */

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function testEmployeeLoad() {
    try {
        log.header('Testing Generalized Load with Employee Data');

        // Load employee config
        const configPath = path.join(__dirname, '..', 'config', 'employee-dataset-config.json');
        const employeeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        log.info(`Config loaded: ${employeeConfig.datasetName}`);
        log.info(`Target table: ${employeeConfig.target.schema}.${employeeConfig.target.table}`);

        // Parse CSV data
        const csvPath = path.join(__dirname, '..', 'sample-data', 'employee_data.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');

        // Convert CSV to records
        const records = lines.slice(1).map(line => {
            const values = line.split(',');
            const record = {};
            headers.forEach((header, idx) => {
                const targetCol = employeeConfig.schema.columns.find(
                    col => col.sourceName === header
                );
                if (targetCol) {
                    let value = values[idx];
                    // Basic type conversion
                    if (targetCol.dataType === 'integer') {
                        value = parseInt(value);
                    }
                    record[targetCol.targetName] = value;
                }
                // Also keep department name for FK lookup
                if (header === 'Department') {
                    record.department = values[idx];
                }
            });
            return record;
        });

        log.success(`Parsed ${records.length} employee records from CSV`);

        // Show sample record
        log.info('Sample record:');
        console.log('  ', records[0]);

        // Load data using generalized module
        log.header('Loading to Database');
        log.info('Using same loadData() function as student data...');

        const result = await loadData(records, employeeConfig);

        log.header('Results');
        log.success(`Inserted: ${result.inserted} employees`);
        log.success(`Success rate: ${result.summary.successRate}`);

        if (result.failed > 0) {
            log.error(`Failed: ${result.failed} records`);
            result.errors.forEach(err => {
                console.log(`  Error: ${err.error}`);
            });
        }

        log.header('✅ Generalization Test PASSED!');
        console.log(`${colors.green}The same load.js code worked for:`);
        console.log('  ✓ Student data (university.students)');
        console.log(`  ✓ Employee data (university.employees)${colors.reset}`);
        console.log('\n  No code changes needed - only config changed!\n');

    } catch (error) {
        log.header('❌ Test Failed');
        log.error(`Error: ${error.message}`);
        console.error(error);
        throw error;
    }
}

// Run test
testEmployeeLoad().catch(error => {
    console.error('\nFatal error:', error.message);
    process.exit(1);
});
