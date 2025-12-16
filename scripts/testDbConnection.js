require('dotenv').config();
const { Pool } = require('pg');

// ANSI color codes for better terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

// Helper function for formatted output
const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function testDatabaseConnection() {
    log.header('🔍 Testing NeonDB Connection...');

    // Validate environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        log.error('Missing required environment variables:');
        missingVars.forEach(varName => {
            console.log(`  ${colors.red}✗${colors.reset} ${varName}`);
        });
        log.warning('\nPlease ensure your .env file contains all required variables.');
        process.exit(1);
    }

    log.success('All required environment variables present');

    // Display configuration (hide password)
    log.info('Connection Configuration:');
    console.log(`  Host:     ${colors.cyan}${process.env.DB_HOST}${colors.reset}`);
    console.log(`  Port:     ${colors.cyan}${process.env.DB_PORT}${colors.reset}`);
    console.log(`  Database: ${colors.cyan}${process.env.DB_NAME}${colors.reset}`);
    console.log(`  User:     ${colors.cyan}${process.env.DB_USER}${colors.reset}`);
    console.log(`  Password: ${colors.cyan}${'•'.repeat(Math.min(process.env.DB_PASSWORD.length, 12))}${colors.reset}`);
    console.log(`  SSL:      ${colors.cyan}${process.env.DB_SSL === 'true' ? 'enabled' : 'disabled'}${colors.reset}\n`);

    // Create connection pool
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
    });

    try {
        // Test connection
        log.info('Attempting to connect to database...');
        const client = await pool.connect();
        log.success('Database connection successful!');

        // Test query - get database version
        log.info('Running test query...');
        const versionResult = await client.query('SELECT version()');
        const version = versionResult.rows[0].version;

        // Extract PostgreSQL version number
        const versionMatch = version.match(/PostgreSQL ([\d.]+)/);
        const pgVersion = versionMatch ? versionMatch[1] : 'Unknown';

        log.success(`PostgreSQL version: ${pgVersion}`);

        // Get current timestamp from database
        const timeResult = await client.query('SELECT NOW() as current_time');
        const dbTime = timeResult.rows[0].current_time;
        log.success(`Database time: ${dbTime}`);

        // Check SSL status
        const sslResult = await client.query("SHOW ssl");
        const sslStatus = sslResult.rows[0].ssl;
        log.success(`SSL connection: ${sslStatus}`);

        // Get database size
        const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size($1)) as size
    `, [process.env.DB_NAME]);
        const dbSize = sizeResult.rows[0].size;
        log.success(`Database size: ${dbSize}`);

        // Count tables
        const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const tableCount = tablesResult.rows[0].table_count;
        log.info(`Tables in database: ${tableCount}`);

        // Release client back to pool
        client.release();

        // Success summary
        log.header('✅ Connection Test Successful!');
        console.log(`${colors.green}Your NeonDB connection is working perfectly.${colors.reset}`);
        console.log(`${colors.cyan}You can now proceed with the next steps:${colors.reset}`);
        console.log(`  1. Set up Google Sheets API`);
        console.log(`  2. Design your database schema`);
        console.log(`  3. Build the ETL pipeline\n`);

    } catch (error) {
        log.header('❌ Connection Test Failed');
        log.error('Failed to connect to database');

        console.log(`\n${colors.red}Error Details:${colors.reset}`);
        console.log(`  Type: ${error.name}`);
        console.log(`  Message: ${error.message}`);

        // Provide helpful error-specific guidance
        if (error.code === 'ENOTFOUND') {
            log.warning('\nPossible Issues:');
            console.log('  • Check if DB_HOST is correct');
            console.log('  • Verify internet connection');
            console.log('  • Ensure NeonDB cluster is active');
        } else if (error.code === 'ECONNREFUSED') {
            log.warning('\nPossible Issues:');
            console.log('  • Check if DB_PORT is correct (should be 5432)');
            console.log('  • Verify firewall settings');
        } else if (error.message.includes('password authentication failed')) {
            log.warning('\nPossible Issues:');
            console.log('  • Check if DB_USER is correct');
            console.log('  • Verify DB_PASSWORD is correct');
            console.log('  • No extra spaces or quotes in .env values');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            log.warning('\nPossible Issues:');
            console.log('  • Check if DB_NAME matches database name in NeonDB');
            console.log('  • Database names are case-sensitive');
        }

        console.log(`\n${colors.cyan}For help, see: docs/NEONDB_SETUP_GUIDE.md${colors.reset}\n`);
        process.exit(1);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the test
testDatabaseConnection().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
