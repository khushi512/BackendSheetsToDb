require('dotenv').config();
const { Pool } = require('pg');

console.log('\n=== Database Connection Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'MISSING');
console.log('DB_PORT:', process.env.DB_PORT || 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME || 'MISSING');
console.log('DB_USER:', process.env.DB_USER || 'MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'MISSING');
console.log('DB_SSL:', process.env.DB_SSL || 'MISSING');
console.log('');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
});

async function test() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('✓ Connected successfully!');

        const result = await client.query('SELECT version(), NOW()');
        console.log('✓ Query executed successfully');
        console.log('Database:', result.rows[0]);

        client.release();
        console.log('\n✓ Connection test PASSED!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Connection test FAILED!');
        console.error('Error:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

test();
