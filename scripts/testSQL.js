require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Test Script: Execute SQL queries and show results
 * 
 * Runs sample queries from queries.sql and displays results
 */

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function runSQLTests() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        log.header('Testing SQL Queries');

        await client.connect();
        log.success('Connected to NeonDB');

        // Test Query 1: Students per department
        log.header('Query 1: Students Per Department');
        const q1 = await client.query(`
            SELECT 
                d.department_name,
                COUNT(s.student_id) AS student_count
            FROM university.departments d
            LEFT JOIN university.students s ON d.department_id = s.department_id
            GROUP BY d.department_id, d.department_name
            ORDER BY student_count DESC, d.department_name;
        `);
        console.table(q1.rows);

        // Test Query 2: Active enrollments
        log.header('Query 2: Active Enrollments (First 10)');
        const q2 = await client.query(`
            SELECT 
                s.student_id,
                s.first_name || ' ' || s.last_name AS student_name,
                c.course_code,
                d.department_name,
                e.status
            FROM university.enrollments e
            JOIN university.students s ON e.student_id = s.student_id
            JOIN university.courses c ON e.course_id = c.course_id
            JOIN university.departments d ON s.department_id = d.department_id
            WHERE e.status = 'Active'
            ORDER BY s.last_name, s.first_name
            LIMIT 10;
        `);
        console.table(q2.rows);

        // Test Query 5: Average enrollments
        log.header('Query 5: Enrollment Statistics');
        const q5 = await client.query(`
            SELECT 
                AVG(enrollment_count) AS avg_enrollments_per_student,
                MIN(enrollment_count) AS min_enrollments,
                MAX(enrollment_count) AS max_enrollments
            FROM (
                SELECT 
                    s.student_id,
                    COUNT(e.enrollment_id) AS enrollment_count
                FROM university.students s
                LEFT JOIN university.enrollments e ON s.student_id = e.student_id
                GROUP BY s.student_id
            ) AS student_enrollments;
        `);
        console.table(q5.rows);

        // Test Query 6: Popular courses
        log.header('Query 6: Courses with Most Enrollments');
        const q6 = await client.query(`
            SELECT 
                c.course_code,
                d.department_name,
                COUNT(e.enrollment_id) AS enrollment_count,
                COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments
            FROM university.courses c
            LEFT JOIN university.enrollments e ON c.course_id = e.course_id
            LEFT JOIN university.departments d ON c.department_id = d.department_id
            GROUP BY c.course_id, c.course_code, d.department_name
            ORDER BY enrollment_count DESC
            LIMIT 5;
        `);
        console.table(q6.rows);

        // Create views
        log.header('Creating Database Views');
        const viewsPath = path.join(__dirname, '..', 'sql', 'views.sql');
        const viewsSQL = fs.readFileSync(viewsPath, 'utf8');
        await client.query(viewsSQL);
        log.success('Views created successfully');

        // Test a view
        log.header('Testing View: student_enrollment_summary');
        const viewTest = await client.query(`
            SELECT * FROM university.student_enrollment_summary
            ORDER BY total_enrollments DESC
            LIMIT 5;
        `);
        console.table(viewTest.rows);

        log.header('✅ All SQL Tests Completed Successfully');

    } catch (error) {
        log.error(`Error: ${error.message}`);
        console.error(error);
        throw error;
    } finally {
        await client.end();
    }
}

// Run tests
runSQLTests().catch(error => {
    console.error('\nFatal error:', error.message);
    process.exit(1);
});
