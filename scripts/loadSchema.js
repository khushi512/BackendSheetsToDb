require('dotenv').config();
const { Client } = require('pg');

/**
 * Test Script: Load Database Schema into NeonDB
 * 
 * This script loads the schema.sql file into your NeonDB instance
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

async function loadSchema() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        log.header('🏗️  Loading Database Schema...');

        // Connect
        log.info('Connecting to database...');
        await client.connect();
        log.success('Connected to NeonDB');

        // Read schema.sql file
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

        log.info('Reading schema.sql file...');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        log.success('Schema file loaded');

        // Execute schema SQL
        log.info('Creating schema and tables...');
        await client.query(schemaSQL);
        log.success('Schema created successfully');

        // Verify tables created
        log.header('📋 Verification:');

        const tableQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'university'
            ORDER BY table_name;
        `;

        const result = await client.query(tableQuery);

        if (result.rows.length > 0) {
            log.success('Tables created:');
            result.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        log.header('✅ Schema Loaded Successfully!');
        console.log(`${colors.green}Next step: Load seed data${colors.reset}`);
        console.log(`  Run: ${colors.cyan}node scripts/loadSeedData.js${colors.reset}\n`);

    } catch (error) {
        log.header('❌ Error Loading Schema');
        log.error(`Error: ${error.message}`);

        if (error.code) {
            log.error(`Error Code: ${error.code}`);
        }

        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run
loadSchema().catch(error => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
});
