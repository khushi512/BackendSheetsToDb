# Quick Start: Google Sheets API Setup

## ✅ Before Running the Test:

### 1. Make sure your `.env` file has:
```env
GOOGLE_CREDENTIALS_PATH=./credentials/google-sheets-credentials.json
GOOGLE_SHEET_ID=your-actual-sheet-id
```

### 2. Get your Sheet ID:
Open your Google Sheet and copy the ID from the URL:
```
https://docs.google.com/spreadsheets/d/1AbC-xYz123_DeFg456HiJk/edit
                                          ^^^^^^^^^^^^^^^^^^^^
                                          This is your Sheet ID
```

### 3. Share your Google Sheet:
1. Open `credentials/google-sheets-credentials.json`
2. Find `"client_email"` (looks like: `xyz@...iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click **Share** button
5. Paste the service account email
6. Set permission to **"Viewer"** (or "Editor" for write access)
7. **Uncheck** "Notify people"
8. Click **Share**

## 🧪 Run the Test:

```bash
node scripts/testSheetsConnection.js
```

## ✅ Expected Success Output:

```
🔍 Testing Google Sheets API Connection...

ℹ Step 1: Checking environment variables...
✓ Environment variables present
  Credentials Path: ./credentials/google-sheets-credentials.json
  Sheet ID: 1AbC-xYz123_DeFg456HiJk

ℹ Step 2: Checking credentials file...
✓ Credentials file found: google-sheets-credentials.json

ℹ Step 3: Loading credentials...
✓ Credentials loaded successfully
  Service Account: xyz@...iam.gserviceaccount.com
  Project ID: your-project-123456

ℹ Step 4: Initializing Google Sheets API...
✓ Google Sheets API initialized

ℹ Step 5: Connecting to Google Sheet...
✓ Successfully connected to Google Sheet!
  Sheet Title: Student Registration
  Number of Sheets: 1

ℹ Available sheets:
  1. Sheet1 (100 rows × 10 columns)

ℹ Step 6: Reading sample data...
✓ Retrieved 50 rows from sheet

  Preview of data:
    Row 1: StudentID, Name, Email, Department, Year
    Row 2: 1, Alice Smith, alice@test.com, CS, 2024
    ...

✅ Google Sheets API Test Successful!
```

## ❌ Common Errors:

### "Sheet not found"
- Double-check the Sheet ID in `.env`
- Make sure the sheet exists

### "Permission denied"
- Share the sheet with the service account email
- Check the email in the JSON credentials file

### "API not enabled"
- Enable Google Sheets API in Google Cloud Console
- Go to APIs & Services → Library → Search "Google Sheets API" → Enable

## 📝 Next Steps After Success:

1. ✅ Design database schema
2. ✅ Build ETL pipeline
3. ✅ Create auto-registration workflow
