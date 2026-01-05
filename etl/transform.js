const { applyTransformations } = require('./transformationRules');
const { validateValue } = require('./validators');

/**
 * Transform Module - Apply transformations and validations to extracted data
 * 
 * Uses the existing transformation and validation engines
 */

class DataTransformer {
    constructor(schemaMapping, datasetConfig) {
        this.schemaMapping = schemaMapping;
        this.datasetConfig = datasetConfig;
        this.uniqueTrackers = {}; // Track unique values per column
    }

    /**
     * Transform a single record
     * @param {Object} record - Raw record from Google Sheets
     * @param {number} rowIndex - Original row index (for error reporting)
     * @returns {Object} - { success: boolean, data: {}, errors: [] }
     */
    transformRecord(record, rowIndex) {
        const transformed = {};
        const errors = [];

        // Get schema columns
        const columns = this.datasetConfig.schema.columns;

        columns.forEach(columnDef => {
            const sourceName = columnDef.sourceName;
            const targetName = columnDef.targetName;
            let value = record[sourceName];

            try {
                // Apply transformations
                if (this.schemaMapping.transformations[targetName]) {
                    const transformList = this.schemaMapping.transformations[targetName];
                    value = applyTransformations(value, transformList, this.schemaMapping);
                }

                // Apply validations
                if (this.schemaMapping.validations[targetName]) {
                    const validationRules = this.schemaMapping.validations[targetName];
                    const validationResult = validateValue(
                        value,
                        validationRules,
                        targetName,
                        this.uniqueTrackers
                    );

                    if (!validationResult.valid) {
                        errors.push({
                            field: targetName,
                            value: value,
                            errors: validationResult.errors,
                            sourceName: sourceName
                        });
                    }
                }

                transformed[targetName] = value;

            } catch (error) {
                errors.push({
                    field: targetName,
                    value: value,
                    errors: [`Transformation error: ${error.message}`],
                    sourceName: sourceName
                });
            }
        });

        return {
            success: errors.length === 0,
            data: transformed,
            errors: errors,
            rowIndex: rowIndex
        };
    }

    /**
     * Transform all records
     * @param {Array} records - Array of raw records
     * @returns {Object} - { valid: [], invalid: [], summary: {} }
     */
    transformAll(records) {
        const valid = [];
        const invalid = [];
        const errorLog = [];

        records.forEach((record, index) => {
            const result = this.transformRecord(record, record._rowIndex || index + 2);

            if (result.success) {
                valid.push(result.data);
            } else {
                invalid.push({
                    rowIndex: result.rowIndex,
                    data: result.data,
                    errors: result.errors,
                    originalData: record
                });

                // Log errors
                result.errors.forEach(err => {
                    errorLog.push({
                        rowIndex: result.rowIndex,
                        field: err.field,
                        sourceName: err.sourceName,
                        value: err.value,
                        errors: err.errors
                    });
                });
            }
        });

        return {
            valid,
            invalid,
            errorLog,
            summary: {
                totalRecords: records.length,
                validRecords: valid.length,
                invalidRecords: invalid.length,
                successRate: ((valid.length / records.length) * 100).toFixed(2) + '%'
            }
        };
    }
}

/**
 * Transform extracted data
 * @param {Array} records - Raw records from extraction
 * @param {Object} schemaMapping - Schema mapping configuration
 * @param {Object} datasetConfig - Dataset configuration
 * @returns {Object} - Transformation results
 */
function transformData(records, schemaMapping, datasetConfig) {
    const transformer = new DataTransformer(schemaMapping, datasetConfig);
    return transformer.transformAll(records);
}

module.exports = {
    DataTransformer,
    transformData
};
