const express = require('express');
const { loadData } = require('../etl/load');
const fs = require('fs');
const path = require('path');

/**
 * API Server for Google App Script Integration
 * 
 * Provides webhook endpoint for auto-registration from Google Sheets
 */

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(express.json());

// Load student-only dataset config
const datasetConfigPath = path.join(__dirname, '..', 'config', 'student-api-config.json');
const datasetConfig = JSON.parse(fs.readFileSync(datasetConfigPath, 'utf8'));

/**
 * POST /api/register-student
 * 
 * Accepts student data and inserts into NeonDB
 * Called by Google App Script when new student is added
 */
app.post('/api/register-student', async (req, res) => {
    try {
        const studentData = req.body;

        // Basic validation
        if (!studentData.student_id || !studentData.email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: student_id and email are required'
            });
        }

        // Use generalized load module
        const result = await loadData([studentData], datasetConfig);

        if (result.inserted > 0) {
            res.json({
                success: true,
                message: 'Student registered successfully',
                student_id: studentData.student_id
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.errors[0]?.error || 'Failed to insert student',
                details: result.errors
            });
        }

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/health
 * 
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'NeonDB',
        etl_version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ API Server running on port ${PORT}`);
    console.log(`✓ Endpoint: POST http://localhost:${PORT}/api/register-student`);
    console.log(`✓ Health check: GET http://localhost:${PORT}/api/health`);
});

module.exports = app;
