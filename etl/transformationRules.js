/**
 * Reusable Transformation Functions
 * These transformations work on any data type and can be configured via schema-mapping.json
 */

/**
 * Helper: Validate a date (year, month, day)
 * CRITICAL FIX: Prevents invalid dates like Feb 30, Month 13, etc.
 */
function isValidDate(year, month, day) {
    // Check reasonable year range (1900-2100)
    if (year < 1900 || year > 2100) return false;

    // Check month range
    if (month < 1 || month > 12) return false;

    // Check day range for the given month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeapYear) {
        daysInMonth[1] = 29;
    }

    if (day < 1 || day > daysInMonth[month - 1]) return false;

    return true;
}

/**
 * Helper: Parse text-based years like "twenty-twenty-three" or "two thousand twenty four"
 */
function parseTextYear(str) {
    const lower = str.toLowerCase().replace(/[^a-z\s-]/g, '');

    // Map of number words to digits
    const numberWords = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
        'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
        'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
        'hundred': 100, 'thousand': 1000
    };

    // Check for patterns like "twenty twenty three" or "twenty-twenty-three"
    const words = lower.split(/[\s-]+/).filter(w => w.length > 0);

    // Pattern: "twenty twenty three" = 2023
    if (words.length === 3 && numberWords[words[0]] && numberWords[words[1]] && numberWords[words[2]]) {
        const first = numberWords[words[0]];
        const second = numberWords[words[1]];
        const third = numberWords[words[2]];

        // twenty (20) twenty (20) three (3) = 2023
        if (first >= 10 && first < 100 && second >= 10 && second < 100 && third < 10) {
            return first * 100 + second + third;
        }
    }

    // Pattern: "twenty twenty four" = 2024
    if (words.length === 3 && numberWords[words[0]] === 20 && numberWords[words[1]] === 20) {
        return 2020 + numberWords[words[2]];
    }

    // Pattern: "two thousand twenty three" = 2023
    if (words.length === 4 && words[0] === 'two' && words[1] === 'thousand') {
        const decade = numberWords[words[2]] || 0;
        const unit = numberWords[words[3]] || 0;
        return 2000 + decade + unit;
    }

    // Pattern: "two thousand and twenty three"
    if (words.length === 5 && words[0] === 'two' && words[1] === 'thousand' && words[2] === 'and') {
        const decade = numberWords[words[3]] || 0;
        const unit = numberWords[words[4]] || 0;
        return 2000 + decade + unit;
    }

    return null;
}

/**
 * Helper: Parse text month dates like "Sept 1, 2023" or "September 1 2023"
 */
function parseTextDate(str) {
    const monthNames = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'sept': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
    };

    // Pattern: "Sept 1, 2023" or "September 1 2023"
    const pattern = /([a-z]+)\s+(\d{1,2})[,\s]+(\d{4})/i;
    const match = str.match(pattern);

    if (match) {
        const monthText = match[1].toLowerCase();
        const day = match[2].padStart(2, '0');
        const year = match[3];

        if (monthNames[monthText]) {
            return `${year}-${monthNames[monthText]}-${day}`;
        }
    }

    return null;
}

const transformations = {
    /**
     * Data Type Conversions
     */

    // CRITICAL FIX: Added safe integer bounds checking
    toInteger: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseInt(value, 10);

        if (isNaN(num)) return null;

        // Check for safe integer range to prevent overflow
        if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
            console.warn(`Integer overflow: ${value} exceeds safe range`);
            return null;
        }

        return num;
    },

    toFloat: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    },

    toString: (value) => {
        if (value === null || value === undefined) return null;
        return String(value);
    },

    toBoolean: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const str = String(value).toLowerCase();
        return ['true', '1', 'yes', 'y'].includes(str);
    },

    /**
     * String Transformations
     */
    trimWhitespace: (value) => {
        return value?.toString().trim() || null;
    },

    toLowerCase: (value) => {
        return value?.toString().toLowerCase() || null;
    },

    toUpperCase: (value) => {
        return value?.toString().toUpperCase() || null;
    },

    titleCase: (value) => {
        if (!value) return null;
        return value
            .toString()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Date Transformations
     * CRITICAL FIX: Now validates dates to reject invalid ones like Feb 30
     */
    standardizeDate: (value) => {
        if (!value) return null;

        const str = value.toString().trim();

        // Handle text-based years like "twenty-twenty-three" or "twenty twenty four"
        const textYear = parseTextYear(str);
        if (textYear) {
            // If only year is provided, default to Jan 1st
            return `${textYear}-01-01`;
        }

        // Try parsing various date formats
        const dateFormats = [
            // ISO format: 2024-01-15
            /^(\d{4})-(\d{2})-(\d{2})$/,
            // US format: 01/15/2024
            /^(\d{2})\/(\d{2})\/(\d{4})$/,
            // European format: 15-01-2024
            /^(\d{2})-(\d{2})-(\d{4})$/,
            // Slash format: 2024/01/15
            /^(\d{4})\/(\d{2})\/(\d{2})$/,
        ];

        // Try ISO format first
        if (dateFormats[0].test(str)) {
            const [year, month, day] = str.split('-').map(Number);
            if (isValidDate(year, month, day)) {
                return str; // Already in ISO format and valid
            }
            return null; // Invalid date
        }

        // Try US format: 01/15/2024
        if (dateFormats[1].test(str)) {
            const parts = str.split('/');
            const year = parseInt(parts[2]);
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);

            if (isValidDate(year, month, day)) {
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
            return null;
        }

        // Try European format: 15-01-2024
        if (dateFormats[2].test(str)) {
            const parts = str.split('-');
            const year = parseInt(parts[2]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[0]);

            if (isValidDate(year, month, day)) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            return null;
        }

        // Try slash format: 2024/01/15
        if (dateFormats[3].test(str)) {
            const parts = str.split('/');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            if (isValidDate(year, month, day)) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            return null;
        }

        // Try text month formats: "Sept 1, 2023" or "September 1 2023"
        const textDate = parseTextDate(str);
        if (textDate) {
            const [year, month, day] = textDate.split('-').map(Number);
            if (isValidDate(year, month, day)) {
                return textDate;
            }
            return null;
        }

        // Try native Date parsing as last resort
        try {
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                const isoDate = date.toISOString().split('T')[0];
                const [year, month, day] = isoDate.split('-').map(n => parseInt(n));

                // Validate the parsed date
                if (isValidDate(year, month, day)) {
                    return isoDate;
                }
            }
        } catch (e) {
            // Invalid date
        }

        // If all else fails, return null (invalid date)
        return null;
    },

    /**
     * Phone Number Transformations
     * CRITICAL FIX: Now supports international formats with country codes
     */
    standardizePhone: (value) => {
        if (!value) return null;

        const str = value.toString().trim();

        // Remove all non-numeric characters except + (for country codes)
        const cleaned = str.replace(/[^\d+]/g, '');

        if (cleaned.length === 0) return null;

        // Check if it has a country code (starts with +)
        if (cleaned.startsWith('+')) {
            // International format - preserve it
            const digits = cleaned.substring(1);

            // Validate length (international numbers are typically 10-15 digits)
            if (digits.length >= 10 && digits.length <= 15) {
                return cleaned; // Return with country code
            }
            return null; // Invalid international number
        }

        // Extract just the digits
        const digits = cleaned.replace(/\D/g, '');

        if (digits.length === 0) return null;

        // Handle US numbers (remove leading 1)
        let phoneDigits = digits;
        if (phoneDigits.length === 11 && phoneDigits[0] === '1') {
            phoneDigits = phoneDigits.substring(1);
        }

        // Format 10-digit US numbers as XXX-XXX-XXXX
        if (phoneDigits.length === 10) {
            return `${phoneDigits.substring(0, 3)}-${phoneDigits.substring(3, 6)}-${phoneDigits.substring(6)}`;
        }

        // For other lengths, check if valid international (10-15 digits)
        if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
            return `+${phoneDigits}`; // Add + prefix for non-US international
        }

        // Invalid phone number
        return null;
    },

    /**
     * Email Transformations
     * CRITICAL FIX: Enhanced validation to prevent edge cases
     */
    validateEmail: (value) => {
        if (!value) return null;

        const email = value.toString().trim().toLowerCase();

        // Enhanced email validation regex
        // Prevents: multiple @, leading/trailing dots, consecutive dots
        const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

        // Additional checks
        if (!emailRegex.test(email)) return null;

        // Check for consecutive dots
        if (email.includes('..')) return null;

        // Check for multiple @ symbols
        if ((email.match(/@/g) || []).length !== 1) return null;

        // Validate domain has at least one dot
        const [, domain] = email.split('@');
        if (!domain || !domain.includes('.')) return null;

        // Check for valid TLD (at least 2 chars)
        const tld = domain.split('.').pop();
        if (!tld || tld.length < 2) return null;

        return email;
    },

    /**
     * Department Normalization (configurable)
     */
    normalizeDepartment: (value, mappingConfig) => {
        if (!value) return null;

        const str = value.toString().trim();

        // Load department mapping from config
        if (mappingConfig && mappingConfig.departmentNormalization) {
            for (const [canonical, variations] of Object.entries(mappingConfig.departmentNormalization)) {
                if (variations.includes(str)) {
                    return canonical;
                }
                if (canonical.toLowerCase() === str.toLowerCase()) {
                    return canonical;
                }
            }
        }

        // Default to title case if no mapping found
        return transformations.titleCase(str);
    },

    /**
     * Status Normalization (configurable)
     */
    normalizeStatus: (value, mappingConfig) => {
        if (!value) return null;

        const str = value.toString().trim();

        // Load status mapping from config
        if (mappingConfig && mappingConfig.statusNormalization) {
            for (const [canonical, variations] of Object.entries(mappingConfig.statusNormalization)) {
                if (variations.includes(str)) {
                    return canonical;
                }
                if (canonical.toLowerCase() === str.toLowerCase()) {
                    return canonical;
                }
            }
        }

        // Default to title case if no mapping found
        return transformations.titleCase(str);
    },

    /**
     * Null Handling
     */
    removeNulls: (value) => {
        if (value === null || value === undefined || value === '' || value === 'null' || value === 'NULL') {
            return null;
        }
        return value;
    },

    setDefault: (defaultValue) => (value) => {
        return value === null || value === undefined || value === '' ? defaultValue : value;
    },
};

/**
 * Apply a chain of transformations to a value
 */
function applyTransformations(value, transformList, mappingConfig = null) {
    let result = value;

    for (const transformName of transformList) {
        const transformFn = transformations[transformName];

        if (!transformFn) {
            console.warn(`Unknown transformation: ${transformName}`);
            continue;
        }

        // Pass mapping config for transformations that need it
        if (['normalizeDepartment', 'normalizeStatus'].includes(transformName)) {
            result = transformFn(result, mappingConfig);
        } else {
            result = transformFn(result);
        }
    }

    return result;
}

module.exports = {
    transformations,
    applyTransformations
};
