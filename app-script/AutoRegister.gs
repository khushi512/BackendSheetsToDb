/**
 * Google App Script: Auto-Register Students
 * 
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Update API_ENDPOINT with your server URL
 * 5. Save and authorize
 * 
 * USAGE:
 * - Automatically runs when you edit the sheet
 * - Validates new student data
 * - Sends to API endpoint for database insertion
 * - Shows success/error message
 * 
 * Required OAuth Scopes (auto-granted on authorization):
 * - https://www.googleapis.com/auth/script.send_mail
 * - https://www.googleapis.com/auth/drive
 */

// Configuration
const API_ENDPOINT = 'https://metastatic-unquenchable-vanesa.ngrok-free.dev/api/register-student'; // Update this!
const DATA_START_ROW = 2; // Row where data starts (after header)

/**
 * Trigger: Runs when sheet is edited
 */
function handleEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  // Only process if edited in data range
  if (range.getRow() < DATA_START_ROW) {
    return; // Header row edited, ignore
  }
  
  // Get the edited row data
  const row = range.getRow();
  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Parse row into student object
  const student = parseStudentRow(rowData);
  
  // Validate
  const validation = validateStudent(student);
  if (!validation.valid) {
    showError(row, validation.errors.join(', '));
    return;
  }
  
  // Send to API
  registerStudent(student, row);
}

/**
 * Parse row data into student object
 * Only includes student fields - enrollment handled separately
 */
function parseStudentRow(rowData) {
  return {
    student_id: parseInt(rowData[0]),
    first_name: rowData[1]?.toString().trim(),
    last_name: rowData[2]?.toString().trim(),
    email: rowData[3]?.toString().trim().toLowerCase(),
    phone: rowData[4]?.toString().trim(),
    department: rowData[5]?.toString().trim()
    // Note: Enrollment fields (course, date, year, status) are in columns 6-9
    // but are NOT sent to the student registration API
  };
}

/**
 * Validate student data
 */
function validateStudent(student) {
  const errors = [];
  
  // Required fields
  if (!student.student_id || isNaN(student.student_id)) {
    errors.push('Invalid student ID');
  }
  
  if (!student.first_name || student.first_name.length === 0) {
    errors.push('First name is required');
  }
  
  if (!student.last_name || student.last_name.length === 0) {
    errors.push('Last name is required');
  }
  
  if (!student.email || !student.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!student.department) {
    errors.push('Department is required');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Send student data to API for registration
 */
function registerStudent(student, row) {
  try {
    const response = UrlFetchApp.fetch(API_ENDPOINT, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(student),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      showSuccess(row, 'Student registered successfully!');
    } else {
      showError(row, result.error || 'Registration failed');
    }
    
  } catch (error) {
    showError(row, 'API Error: ' + error.message);
  }
}

/**
 * Show success message in status column
 */
function showSuccess(row, message) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const STATUS_COL = 11; // Column K (after Department in column F + other cols)
  
  const cell = sheet.getRange(row, STATUS_COL);
  cell.setValue('✓ ' + message);
  cell.setBackground('#d4edda');
  cell.setFontColor('#155724');
  
  Logger.log('Success written to row ' + row + ', col ' + STATUS_COL);
}

/**
 * Show error message in status column AND send email notification
 */
function showError(row, message) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const STATUS_COL = 11; // Column K
  
  const cell = sheet.getRange(row, STATUS_COL);
  cell.setValue('✗ ' + message);
  cell.setBackground('#f8d7da');
  cell.setFontColor('#721c24');
  
  Logger.log('Error written to row ' + row + ', col ' + STATUS_COL);
  
  // Send email notification for invalid entry
  try {
    const user = Session.getActiveUser().getEmail();
    const studentData = sheet.getRange(row, 1, 1, 6).getValues()[0];
    
    MailApp.sendEmail({
      to: user,
      subject: '❌ Student Registration Failed - Row ' + row,
      body: `Invalid student data in row ${row}:\n\n` +
            `Student ID: ${studentData[0]}\n` +
            `Name: ${studentData[1]} ${studentData[2]}\n` +
            `Email: ${studentData[3]}\n\n` +
            `Errors:\n${message}\n\n` +
            `Please fix the data and try again.`
    });
    
    Logger.log('Error notification email sent to ' + user);
  } catch (e) {
    Logger.log('Failed to send email: ' + e.message);
  }
}

/**
 * Manual: Register all pending students
 * 
 * Run this function manually to process all rows
 */
function registerAllStudents() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  let processed = 0;
  let succeeded = 0;
  
  for (let row = DATA_START_ROW; row <= lastRow; row++) {
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Skip empty rows
    if (!rowData[0]) continue;
    
    const student = parseStudentRow(rowData);
    const validation = validateStudent(student);
    
    if (!validation.valid) {
      showError(row, validation.errors.join(', '));
      processed++;
      continue;
    }
    
    registerStudent(student, row);
    processed++;
    succeeded++;
    
    // Rate limiting
    Utilities.sleep(500);
  }
  
  SpreadsheetApp.getUi().alert(
    `Processed ${processed} students\n` +
    `Succeeded: ${succeeded}\n` +
    `Failed: ${processed - succeeded}`
  );
}

/**
 * Export sheet data as JSON for ETL ingestion
 */
function exportToJSON() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Convert to JSON array
  const students = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  }).filter(obj => {
    // Skip empty rows - check if first column has value
    const firstValue = obj[headers[0]];
    return firstValue !== null && firstValue !== undefined && firstValue !== '';
  });
  
  // Create JSON blob
  const json = JSON.stringify(students, null, 2);
  const blob = Utilities.newBlob(json, 'application/json', 'students_export_' + Date.now() + '.json');
  
  // Save to Google Drive
  const file = DriveApp.createFile(blob);
  
  SpreadsheetApp.getUi().alert(
    'Export Complete!\n\n' +
    'Records: ' + students.length + '\n' +
    'File: ' + file.getName() + '\n' +
    'URL: ' + file.getUrl() + '\n\n' +
    'JSON data saved to Google Drive'
  );
  
  Logger.log('Exported ' + students.length + ' records to ' + file.getName());
  return json;
}

/**
 * Scheduled registration for time-based triggers
 * Set up via: Triggers → Add Trigger → Time-driven
 */
function scheduledRegistration() {
  Logger.log('Scheduled registration started at ' + new Date());
  registerAllStudents();
  Logger.log('Scheduled registration completed');
}

/**
 * Add menu to Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Student Registration')
    .addItem('Register All Students', 'registerAllStudents')
    .addItem('Test API Connection', 'testConnection')
    .addSeparator()
    .addItem('Export to JSON', 'exportToJSON')
    .addToUi();
}

/**
 * Test API connection
 */
function testConnection() {
  try {
    const healthUrl = API_ENDPOINT.replace('/register-student', '/health');
    const response = UrlFetchApp.fetch(healthUrl, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    const responseText = response.getContentText();
    
    // Check if response is HTML (ngrok warning page)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      SpreadsheetApp.getUi().alert(
        'API Connection: ⚠️ ngrok Warning Page\n\n' +
        'The connection works, but ngrok is showing a warning page.\n\n' +
        'Solution:\n' +
        '1. Open this URL in your browser:\n' +
        healthUrl + '\n\n' +
        '2. Click "Visit Site"\n\n' +
        '3. Try testing again from the sheet'
      );
      return;
    }
    
    const result = JSON.parse(responseText);
    
    SpreadsheetApp.getUi().alert(
      'API Connection: ✓ Success\n' +
      'Status: ' + result.status + '\n' +
      'Database: ' + result.database
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'API Connection: ✗ Failed\n' +
      'Error: ' + error.message + '\n\n' +
      'Check API_ENDPOINT configuration:\n' +
      API_ENDPOINT
    );
  }
}

