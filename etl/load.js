require('dotenv').config();
const { Client } = require('pg');

/**
 * Load Module - Insert transformed data into PostgreSQL/NeonDB
 * 
 * Handles batch insertion with transactions and error handling
 */

class DatabaseLoader {
    constructor(dbConfig = {}) {
        this.config = {
            host: dbConfig.host || process.env.DB_HOST,
            port: dbConfig.port || process.env.DB_PORT,
            database: dbConfig.database || process.env.DB_NAME,
            user: dbConfig.user || process.env.DB_USER,
            password: dbConfig.password || process.env.DB_PASSWORD,
            ssl: (dbConfig.ssl !== undefined ? dbConfig.ssl : process.env.DB_SSL === 'true')
                ? { rejectUnauthorized: false }
                : false
        };
        this.client = null;
    }

    /**
     * Connect to database
     */
    async connect() {
        this.client = new Client(this.config);
        await this.client.connect();
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (this.client) {
            await this.client.end();
            this.client = null;
        }
    }

    /**
     * Build dynamic INSERT query based on dataset configuration
     * @param {Object} record - Transformed record
     * @param {Object} datasetConfig - Dataset configuration
     * @returns {Object} - { query, values }
     */
    buildDynamicInsertQuery(record, datasetConfig) {
        const { target, schema } = datasetConfig;
        const { schema: dbSchema, table, conflictColumns, foreignKeys } = target;

        // Extract columns (excluding FK source fields)
        const columns = schema.columns.map(col => col.targetName);
        const values = [];
        const placeholders = [];
        let placeholderIndex = 1;

        // Build column list and values
        const insertColumns = [];

        for (const columnDef of schema.columns) {
            const targetName = columnDef.targetName;
            insertColumns.push(targetName);

            // Check if this column has a foreign key lookup
            const fkConfig = foreignKeys && foreignKeys[targetName];

            if (fkConfig) {
                // Build FK subquery: (SELECT return_col FROM table WHERE lookup_col = $N)
                const sourceValue = record[fkConfig.sourceField];
                values.push(sourceValue);

                const fkSubquery = `(SELECT ${fkConfig.returnColumn} FROM ${dbSchema}.${fkConfig.lookupTable} WHERE ${fkConfig.lookupColumn} = $${placeholderIndex})`;
                placeholders.push(fkSubquery);
                placeholderIndex++;
            } else {
                // Regular column value
                values.push(record[targetName]);
                placeholders.push(`$${placeholderIndex}`);
                placeholderIndex++;
            }
        }

        // Build INSERT clause
        const insertClause = `INSERT INTO ${dbSchema}.${table} (${insertColumns.join(', ')})`;
        const valuesClause = `VALUES (${placeholders.join(', ')})`;

        // Build ON CONFLICT clause for upsert
        let conflictClause = '';
        if (conflictColumns && conflictColumns.length > 0) {
            const updateSet = insertColumns
                .filter(col => !conflictColumns.includes(col))
                .map(col => `${col} = EXCLUDED.${col}`)
                .join(',\n                ');

            conflictClause = `\n            ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET\n                ${updateSet}`;
        }

        const query = `${insertClause}\n            ${valuesClause}${conflictClause}`;

        return { query, values };
    }

    /**
     * Load single record
     * @param {Object} record - Transformed record
     * @param {Object} datasetConfig - Dataset configuration
     * @returns {Object} - Insert result
     */
    async loadRecord(record, datasetConfig) {
        try {
            const queryInfo = this.buildDynamicInsertQuery(record, datasetConfig);
            const result = await this.client.query(queryInfo.query, queryInfo.values);
            return { success: true, rowCount: result.rowCount };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                record: record
            };
        }
    }

    /**
     * Load multiple records with transaction
     * @param {Array} records - Array of transformed records
     * @param {Object} datasetConfig - Dataset configuration
     * @returns {Object} - { inserted: number, failed: number, errors: [] }
     */
    async loadBatch(records, datasetConfig) {
        let inserted = 0;
        const errors = [];

        try {
            // Start transaction
            await this.client.query('BEGIN');

            for (const record of records) {
                const result = await this.loadRecord(record, datasetConfig);

                if (result.success) {
                    inserted += result.rowCount;
                } else {
                    errors.push({
                        record: result.record,
                        error: result.error
                    });
                }
            }

            // Commit transaction
            await this.client.query('COMMIT');

            return {
                inserted,
                failed: errors.length,
                errors,
                summary: {
                    totalRecords: records.length,
                    insertedRecords: inserted,
                    failedRecords: errors.length,
                    successRate: ((inserted / records.length) * 100).toFixed(2) + '%'
                }
            };

        } catch (error) {
            // Rollback on error
            await this.client.query('ROLLBACK');
            throw new Error(`Batch load failed: ${error.message}`);
        }
    }
}

/**
 * Load transformed data into database
 * @param {Array} records - Transformed records
 * @param {Object} datasetConfig - Dataset configuration (contains target table info)
 * @param {Object} dbConfig - Database configuration (optional)
 * @returns {Object} - Load results
 */
async function loadData(records, datasetConfig, dbConfig = {}) {
    const loader = new DatabaseLoader(dbConfig);

    try {
        await loader.connect();
        const result = await loader.loadBatch(records, datasetConfig);
        return result;
    } finally {
        await loader.disconnect();
    }
}

module.exports = {
    DatabaseLoader,
    loadData
};
