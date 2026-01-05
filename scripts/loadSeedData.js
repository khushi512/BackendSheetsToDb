require('dotenv').config();
const { Client } = require('pg');

/**
 * Test Script: Load Seed Data into NeonDB
 * 
 * This script:
 * 1. Connects to NeonDB
 * 2. Creates the schema (if not exists)
 * 3. Loads seed data
 * 4. Verifies data insertion
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

async function loadSeedData() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        log.header('📦 Loading Seed Data into NeonDB...');

        // Connect
        log.info('Connecting to database...');
        await client.connect();
        log.success('Connected to NeonDB');

        // Read seed.sql file
        const fs = require('fs');
        const path = require('path');
        const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');

        log.info('Reading seed.sql file...');
        const seedSQL = fs.readFileSync(seedPath, 'utf8');
        log.success('Seed file loaded');

        // Execute seed SQL
        log.info('Executing seed data insertion...');
        await client.query(seedSQL);
        log.success('Seed data executed');

        // Verify data counts
        log.header('📊 Verification Results:');

        const tables = ['departments', 'students', 'courses', 'enrollments'];
        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM university.${table}`);
            const count = parseInt(result.rows[0].count);
            log.success(`${table}: ${count} rows`);
        }

        // Sample queries
        log.header('🔍 Sample Data Queries:');

        // Students per department
        const deptQuery = `
            SELECT d.department_name, COUNT(s.student_id) as student_count
            FROM university.departments d
            LEFT JOIN university.students s ON d.department_id = s.department_id
            GROUP BY d.department_name
            ORDER BY student_count DESC;
        `;
        const deptResult = await client.query(deptQuery);

        log.info('Students per department:');
        deptResult.rows.forEach(row => {
            console.log(`  - ${row.department_name}: ${row.student_count} students`);
        });

        // Active enrollments
        const enrollQuery = `
            SELECT COUNT(*) as active_enrollments
            FROM university.enrollments
            WHERE status = 'Active';
        `;
        const enrollResult = await client.query(enrollQuery);
        log.success(`Active enrollments: ${enrollResult.rows[0].active_enrollments}`);

        log.header('✅ Seed Data Loaded Successfully!');
        console.log(`${colors.green}Database is ready for testing!${colors.reset}\n`);

    } catch (error) {
        log.header('❌ Error Loading Seed Data');
        log.error(`Error: ${error.message}`);

        if (error.message.includes('does not exist')) {
            log.warning('\nSchema might not exist yet. Try running:');
            console.log('  1. node scripts/loadSchema.js');
            console.log('  2. node scripts/loadSeedData.js');
        }

        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run
loadSeedData().catch(error => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
});
