require('dotenv').config();

console.log('\n=== Environment Variables Check ===\n');

const envVars = {
    'DB_HOST': process.env.DB_HOST,
    'DB_PORT': process.env.DB_PORT,
    'DB_NAME': process.env.DB_NAME,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD,
    'DB_SSL': process.env.DB_SSL,
};

let allPresent = true;

for (const [key, value] of Object.entries(envVars)) {
    if (!value || value.trim() === '') {
        console.log(`✗ ${key}: MISSING or EMPTY`);
        allPresent = false;
    } else {
        if (key === 'DB_PASSWORD') {
            console.log(`✓ ${key}: ${'*'.repeat(value.length)} (${value.length} characters)`);
        } else {
            console.log(`✓ ${key}: ${value}`);
        }
    }
}

console.log('');

if (!allPresent) {
    console.log('ERROR: Some environment variables are missing!');
    console.log('Please check your .env file.\n');
    process.exit(1);
}

// Check for common issues
console.log('=== Validation Checks ===\n');

// Check port
const port = parseInt(process.env.DB_PORT);
if (isNaN(port)) {
    console.log(`✗ DB_PORT is not a valid number: ${process.env.DB_PORT}`);
} else if (port !== 5432) {
    console.log(`⚠ DB_PORT is ${port} (expected 5432 for standard PostgreSQL)`);
    console.log(`  Note: NeonDB might use a different port. This is just a warning.`);
} else {
    console.log(`✓ DB_PORT is valid: ${port}`);
}

// Check host format
if (!process.env.DB_HOST.includes('.neon.tech')) {
    console.log(`⚠ DB_HOST doesn't appear to be a NeonDB host`);
    console.log(`  Expected format: ep-xxxxx-xxxxx.region.aws.neon.tech`);
} else {
    console.log(`✓ DB_HOST appears to be a valid NeonDB host`);
}

// Check SSL
if (process.env.DB_SSL === 'true') {
    console.log(`✓ DB_SSL is enabled`);
} else {
    console.log(`⚠ DB_SSL is not set to 'true' - NeonDB requires SSL`);
}

console.log('\n=== All checks complete ===\n');
