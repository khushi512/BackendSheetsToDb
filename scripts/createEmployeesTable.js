require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Create employees table for testing generalization
 */

async function createEmployeesTable() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✓ Connected');

        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'sql', 'create-employees-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Creating employees table...');
        await client.query(sql);
        console.log('✓ Employees table created');

        // Verify
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_schema = 'university' AND table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('\n✓ Table structure:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

createEmployeesTable().catch(error => {
    console.error('\nFatal error:', error.message);
    process.exit(1);
});
