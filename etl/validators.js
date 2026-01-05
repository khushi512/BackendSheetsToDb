/**
 * Reusable Validation Functions
 * These validators work on any data type and can be configured via schema-mapping.json
 */

const validators = {
    /**
     * Null/Empty Checks
     */
    isNotNull: (value) => {
        return {
            valid: value !== null && value !== undefined && value !== '',
            error: 'Value cannot be null or empty'
        };
    },

    /**
     * Type Validators
     */
    isInteger: (value) => {
        const num = parseInt(value, 10);
        return {
            valid: !isNaN(num) && Number.isInteger(num),
            error: 'Value must be an integer'
        };
    },

    isFloat: (value) => {
        const num = parseFloat(value);
        return {
            valid: !isNaN(num),
            error: 'Value must be a number'
        };
    },

    isString: (value) => {
        return {
            valid: typeof value === 'string',
            error: 'Value must be a string'
        };
    },

    isBoolean: (value) => {
        return {
            valid: typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value).toLowerCase()),
            error: 'Value must be a boolean'
        };
    },

    /**
     * Format Validators
     */
    isEmail: (value) => {
        if (!value) return { valid: true, error: null }; // Allow empty if not required

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(value),
            error: 'Invalid email format'
        };
    },

    isPhone: (value) => {
        if (!value) return { valid: true, error: null }; // Allow empty if not required

        // Check if contains at least 10 digits
        const digits = value.toString().replace(/\D/g, '');
        return {
            valid: digits.length >= 10 && digits.length <= 15,
            error: 'Phone number must contain 10-15 digits'
        };
    },

    isValidDate: (value) => {
        if (!value) return { valid: false, error: 'Date is required' };

        // Check if date can be parsed
        const date = new Date(value);
        return {
            valid: !isNaN(date.getTime()),
            error: 'Invalid date format'
        };
    },

    isUrl: (value) => {
        if (!value) return { valid: true, error: null };

        try {
            new URL(value);
            return { valid: true, error: null };
        } catch (e) {
            return { valid: false, error: 'Invalid URL format' };
        }
    },

    /**
     * Range Validators
     */
    minLength: (min) => (value) => {
        if (!value) return { valid: true, error: null };

        return {
            valid: value.toString().length >= min,
            error: `Minimum length is ${min} characters`
        };
    },

    maxLength: (max) => (value) => {
        if (!value) return { valid: true, error: null };

        return {
            valid: value.toString().length <= max,
            error: `Maximum length is ${max} characters`
        };
    },

    inRange: (min, max) => (value) => {
        const num = Number(value);
        if (isNaN(num)) return { valid: false, error: 'Value must be a number' };

        return {
            valid: num >= min && num <= max,
            error: `Value must be between ${min} and ${max}`
        };
    },

    /**
     * List Validators
     */
    inList: (allowedValues) => (value) => {
        if (!value) return { valid: false, error: 'Value is required' };

        return {
            valid: allowedValues.includes(value),
            error: `Value must be one of: ${allowedValues.join(', ')}`
        };
    },

    /**
     * Uniqueness Validator (requires context)
     */
    isUnique: (value, columnName, allValues = new Set()) => {
        if (!value) return { valid: true, error: null };

        const isDuplicate = allValues.has(value);
        if (!isDuplicate) {
            allValues.add(value);
        }

        return {
            valid: !isDuplicate,
            error: `Duplicate value found for ${columnName}`
        };
    },

    /**
     * Pattern Validators
     */
    matchesPattern: (pattern) => (value) => {
        if (!value) return { valid: true, error: null };

        const regex = new RegExp(pattern);
        return {
            valid: regex.test(value),
            error: `Value does not match required pattern: ${pattern}`
        };
    }
};

/**
 * Parse validator string with arguments
 * Examples: "maxLength:100", "inRange:2000-2030", "inList:Active,Inactive"
 */
function parseValidator(validatorString) {
    const parts = validatorString.split(':');
    const name = parts[0];
    const args = parts[1];

    if (!validators[name]) {
        return null;
    }

    // Return validator function with parsed arguments
    if (args) {
        if (name === 'maxLength' || name === 'minLength') {
            return validators[name](parseInt(args, 10));
        } else if (name === 'inRange') {
            const [min, max] = args.split('-').map(n => parseInt(n, 10));
            return validators[name](min, max);
        } else if (name === 'inList') {
            const list = args.split(',').map(v => v.trim());
            return validators[name](list);
        } else if (name === 'matchesPattern') {
            return validators[name](args);
        }
    }

    return validators[name];
}

/**
 * Apply validation rules to a value
 */
function validateValue(value, validationRules, columnName = '', uniqueTracker = {}) {
    const errors = [];

    for (const ruleString of validationRules) {
        let validatorFn = parseValidator(ruleString);

        // Handle simple validator names
        if (!validatorFn) {
            validatorFn = validators[ruleString];
        }

        if (!validatorFn) {
            console.warn(`Unknown validator: ${ruleString}`);
            continue;
        }

        // Special handling for isUnique
        if (ruleString === 'isUnique') {
            if (!uniqueTracker[columnName]) {
                uniqueTracker[columnName] = new Set();
            }
            const result = validators.isUnique(value, columnName, uniqueTracker[columnName]);
            if (!result.valid) {
                errors.push(result.error);
            }
        } else {
            const result = validatorFn(value);
            if (!result.valid) {
                errors.push(result.error);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

module.exports = {
    validators,
    parseValidator,
    validateValue
};
