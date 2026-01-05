require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { extractData } = require('./extract');
const { transformData } = require('./transform');
const { loadData } = require('./load');

/**
 * ETL Pipeline Main file for processing
 * Coordinates Extract → Transform → Load workflow
 */

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

class ETLPipeline {
    constructor() {
        this.results = {
            extract: null,
            transform: null,
            load: null,
            startTime: null,
            endTime: null
        };
    }

    /**
     * Load configuration files
     */
    loadConfigs() {
        const datasetConfigPath = path.join(__dirname, '..', 'config', 'dataset-config.json');
        const schemaMappingPath = path.join(__dirname, '..', 'config', 'schema-mapping.json');

        const datasetConfig = JSON.parse(fs.readFileSync(datasetConfigPath, 'utf8'));
        const schemaMapping = JSON.parse(fs.readFileSync(schemaMappingPath, 'utf8'));

        return { datasetConfig, schemaMapping };
    }

    /**
     * Run complete ETL pipeline
     * @param {Object} options - Pipeline options
     * @returns {Object} - Pipeline results
     */
    async run(options = {}) {
        this.results.startTime = new Date();

        try {
            log.header(' Starting ETL Pipeline...');

            // Load configurations
            log.info('Loading configurations...');
            const { datasetConfig, schemaMapping } = this.loadConfigs();
            log.success('Configurations loaded');

            // EXTRACT
            log.header('EXTRACT: Fetching data from Google Sheets');
            const extractResult = await extractData(datasetConfig);
            this.results.extract = extractResult;

            log.success(`Extracted ${extractResult.records.length} records`);
            log.info(`Sheet: ${extractResult.metadata.sheetName}`);
            log.info(`Columns: ${extractResult.metadata.columnCount}`);

            // TRANSFORM
            log.header('TRANSFORM: Applying transformations and validations');
            const transformResult = transformData(
                extractResult.records,
                schemaMapping,
                datasetConfig
            );
            this.results.transform = transformResult;

            log.success(`Valid records: ${transformResult.valid.length}`);
            log.warning(`Invalid records: ${transformResult.invalid.length}`);
            log.info(`Success rate: ${transformResult.summary.successRate}`);

            // Show sample errors if any
            if (transformResult.errorLog.length > 0) {
                log.warning('\nSample validation errors:');
                transformResult.errorLog.slice(0, 5).forEach(err => {
                    console.log(`  Row ${err.rowIndex}, Field: ${err.field} - ${err.errors.join(', ')}`);
                });
                if (transformResult.errorLog.length > 5) {
                    console.log(`  ... and ${transformResult.errorLog.length - 5} more errors\n`);
                }
            }

            // LOAD
            if (transformResult.valid.length > 0) {
                log.header('LOAD: Inserting data into NeonDB');
                const loadResult = await loadData(transformResult.valid, datasetConfig);
                this.results.load = loadResult;

                log.success(`Inserted: ${loadResult.inserted} records`);
                if (loadResult.failed > 0) {
                    log.error(`Failed: ${loadResult.failed} records`);
                }
                log.info(`Load success rate: ${loadResult.summary.successRate}`);
            } else {
                log.error('No valid records to load!');
                this.results.load = { inserted: 0, failed: 0, errors: [] };
            }

            // SUMMARY
            this.results.endTime = new Date();
            this.printSummary();

            // Save detailed logs if requested
            if (options.saveLogs !== false) {
                this.saveExecutionLog();
            }

            return this.results;

        } catch (error) {
            log.header('ETL Pipeline Failed');
            log.error(`Error: ${error.message}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Print pipeline summary
     */
    printSummary() {
        const duration = ((this.results.endTime - this.results.startTime) / 1000).toFixed(2);

        log.header('ETL Pipeline Summary');
        console.log(`${colors.cyan}Duration:${colors.reset} ${duration}s`);
        console.log(`${colors.cyan}Extracted:${colors.reset} ${this.results.extract?.records.length || 0} records`);
        console.log(`${colors.cyan}Transformed:${colors.reset} ${this.results.transform?.valid.length || 0} valid, ${this.results.transform?.invalid.length || 0} invalid`);
        console.log(`${colors.cyan}Loaded:${colors.reset} ${this.results.load?.inserted || 0} records inserted`);

        const totalSuccess = this.results.load?.inserted || 0;
        const totalRecords = this.results.extract?.records.length || 1;
        const endToEndRate = ((totalSuccess / totalRecords) * 100).toFixed(2);

        console.log(`${colors.cyan}End-to-end success rate:${colors.reset} ${endToEndRate}%\n`);

        if (endToEndRate >= 90) {
            log.success('ETL Pipeline completed successfully!');
        } else if (endToEndRate >= 70) {
            log.warning('ETL Pipeline completed with some errors');
        } else {
            log.error('ETL Pipeline completed with significant errors');
        }
    }

    /**
     * Save execution log to file
     */
    saveExecutionLog() {
        const logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const timestamp = Date.now();
        const logFile = path.join(logDir, `etl-execution-${timestamp}.json`);

        const logData = {
            timestamp: new Date().toISOString(),
            duration: ((this.results.endTime - this.results.startTime) / 1000) + 's',
            extract: {
                recordCount: this.results.extract?.records.length || 0,
                metadata: this.results.extract?.metadata
            },
            transform: {
                valid: this.results.transform?.valid.length || 0,
                invalid: this.results.transform?.invalid.length || 0,
                successRate: this.results.transform?.summary.successRate,
                errors: this.results.transform?.errorLog || []
            },
            load: {
                inserted: this.results.load?.inserted || 0,
                failed: this.results.load?.failed || 0,
                successRate: this.results.load?.summary?.successRate,
                errors: this.results.load?.errors || []
            }
        };

        fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
        log.info(`Execution log saved: ${path.basename(logFile)}`);
    }
}

/**
 * Run ETL pipeline
 * @param {Object} options - Pipeline options
 */
async function runETL(options = {}) {
    const pipeline = new ETLPipeline();
    return await pipeline.run(options);
}

// Run pipeline if executed directly
if (require.main === module) {
    runETL().catch(error => {
        console.error('\nFatal error:', error.message);
        process.exit(1);
    });
}

module.exports = {
    ETLPipeline,
    runETL
};
