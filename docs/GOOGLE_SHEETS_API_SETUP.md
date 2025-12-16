# Google Sheets API Setup Guide

This guide will walk you through setting up Google Sheets API access for your ETL pipeline. You'll create a Google Cloud Project, enable the Sheets API, and create service account credentials.

## 📋 What You'll Get

By the end of this guide, you'll have:
- ✅ Google Cloud Project created
- ✅ Google Sheets API enabled
- ✅ Service Account credentials (JSON file)
- ✅ Proper permissions configured
- ✅ Integration with your Node.js application

---

## 🚀 Step-by-Step Instructions

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top of the page
   - Click **"New Project"** button
   
3. **Configure Project**
   - **Project Name**: Enter a descriptive name (e.g., "SheetsToDBProject" or "ETL Pipeline")
   - **Organization**: Leave as "No organization" (unless you have a Google Workspace)
   - **Location**: Leave as default
   - Click **"Create"**

4. **Wait for Project Creation**
   - This takes a few seconds
   - You'll see a notification when it's ready
   - Click on the notification to open the project

---

### Step 2: Enable Google Sheets API

1. **Navigate to APIs & Services**
   - In the left sidebar, click **"APIs & Services"**
   - Click **"Library"**

2. **Search for Google Sheets API**
   - In the search bar, type: `Google Sheets API`
   - Click on **"Google Sheets API"** from the results

3. **Enable the API**
   - Click the blue **"Enable"** button
   - Wait a few seconds for activation
   - You'll be redirected to the API dashboard

---

### Step 3: Create Service Account

Service accounts allow your application to access Google Sheets without user interaction.

1. **Go to Credentials**
   - Click **"APIs & Services"** → **"Credentials"** in left sidebar

2. **Create Credentials**
   - Click **"+ Create Credentials"** at the top
   - Select **"Service account"**

3. **Service Account Details**
   - **Service account name**: `sheets-etl-service`
   - **Service account ID**: Auto-generated (e.g., `sheets-etl-service@your-project.iam.gserviceaccount.com`)
   - **Description**: `Service account for Google Sheets ETL pipeline`
   - Click **"Create and Continue"**

4. **Grant Access (Optional)**
   - **Role**: Skip this for now (click "Continue")
   - This step is optional for our use case

5. **Grant Users Access (Optional)**
   - Skip this step (click "Done")

---

### Step 4: Create & Download Credentials

1. **Find Your Service Account**
   - You'll see your service account listed under "Service Accounts"
   - Click on the service account email

2. **Create a Key**
   - Go to the **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**

3. **Download JSON Key**
   - Select **"JSON"** as the key type
   - Click **"Create"**
   - A JSON file will automatically download to your computer
   - ⚠️ **Important**: Keep this file secure! It provides full access to your service account

4. **Save the Credentials File**
   - Rename the downloaded file to something memorable (e.g., `google-sheets-credentials.json`)
   - Move it to your project directory

---

### Step 5: Set Up Credentials in Your Project

1. **Create Credentials Directory**
   
   In your project root, create a `credentials` folder:
   ```bash
   mkdir credentials
   ```

2. **Move Credentials File**
   
   Move the downloaded JSON file to the credentials folder:
   ```bash
   # Example - adjust the source path to your Downloads folder
   move "C:\Users\YourName\Downloads\your-project-*.json" "e:\Khushboo\Backend(SheetsToDb)\credentials\google-service-account.json"
   ```

3. **Update .gitignore**
   
   Ensure credentials are NOT committed to Git. Add to `.gitignore`:
   ```
   credentials/
   google-service-account.json
   *.json
   ```

4. **Update .env**
   
   Add to your `.env` file:
   ```env
   GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json
   GOOGLE_SHEET_ID=your-sheet-id-here
   ```

---

### Step 6: Share Your Google Sheet with Service Account

This is a **critical step** that many people miss!

1. **Get Service Account Email**
   
   Open your JSON credentials file and find the `client_email` field:
   ```json
   {
     "client_email": "sheets-etl-service@your-project.iam.gserviceaccount.com"
   }
   ```

2. **Open Your Google Sheet**
   - Go to your target Google Sheet
   - Click the **"Share"** button (top right)

3. **Share with Service Account**
   - Paste the service account email
   - Set permission to **"Editor"** (or "Viewer" if read-only)
   - **Uncheck** "Notify people" (service accounts don't receive emails)
   - Click **"Share"** or **"Send"**

---

### Step 7: Get Your Google Sheet ID

Every Google Sheet has a unique ID in its URL.

1. **Find the Sheet ID**
   
   From your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/1abc-xyz123-defg456/edit#gid=0
                                          ^^^^^^^^^^^^^^^^^^^
                                          This is your Sheet ID
   ```

2. **Copy the ID**
   
   The Sheet ID is the long string between `/d/` and `/edit`

3. **Add to .env**
   
   Update your `.env` file:
   ```env
   GOOGLE_SHEET_ID=1abc-xyz123-defg456
   ```

---

### Step 8: Install Google Sheets API Client

1. **Install the Package**
   
   ```bash
   npm install googleapis
   ```

2. **Verify Installation**
   
   Check your `package.json`:
   ```json
   {
     "dependencies": {
       "dotenv": "^17.2.3",
       "googleapis": "^latest",
       "pg": "^8.16.3"
     }
   }
   ```

---

### Step 9: Test Google Sheets Connection

I'll create a test script for you to verify the connection works.

Run:
```bash
node scripts/testSheetsConnection.js
```

Expected output:
```
✓ Credentials loaded successfully
✓ Google Sheets API initialized
✓ Connected to sheet: "Your Sheet Name"
✓ Retrieved data: 10 rows
```

---

## 🔑 Important Security Notes

### Protect Your Credentials

- ✅ **Never commit credentials to Git**
- ✅ **Store credentials outside web root in production**
- ✅ **Use environment variables for sensitive data**
- ✅ **Rotate credentials periodically**
- ✅ **Limit service account permissions**

### Git Security

Your `.gitignore` should include:
```
node_modules/
.env
credentials/
*.json
!package.json
!package-lock.json
```

---

## 📊 Understanding Service Account Permissions

### What Can Service Accounts Do?

Service accounts can only access:
- ✅ Sheets explicitly shared with them
- ✅ Public sheets (read-only)
- ❌ Your personal Google Drive (unless shared)

### Permission Levels

- **Viewer**: Read-only access
- **Editor**: Read and write access (recommended for ETL)
- **Owner**: Full control (not available for service accounts)

---

## 🆘 Troubleshooting

### Issue: "The caller does not have permission"

**Solution:**
- Verify you shared the sheet with the service account email
- Check the permission level is "Editor"
- Wait a few minutes for permissions to propagate

### Issue: "Unable to parse JSON credentials"

**Solution:**
- Verify the JSON file is valid
- Check the file path in `.env` is correct
- Ensure no extra quotes in `GOOGLE_CREDENTIALS_PATH`

### Issue: "Invalid sheet ID"

**Solution:**
- Double-check the Sheet ID from the URL
- Remove any extra characters or slashes
- Ensure the sheet exists and you have access

### Issue: "API has not been enabled"

**Solution:**
- Go to Google Cloud Console
- Navigate to "APIs & Services" → "Library"
- Search for and enable "Google Sheets API"

---

## 📁 Final File Structure

After completing this guide, your project should look like:

```
Backend(SheetsToDb)/
├── .env                                      # Contains GOOGLE_SHEET_ID
├── .gitignore                                # Ignores credentials/
├── credentials/
│   └── google-service-account.json          # ⚠️ Keep secure!
├── scripts/
│   ├── testDbConnection.js
│   └── testSheetsConnection.js              # New test script
└── ...
```

---

## 🎯 Next Steps

After completing this setup:

1. ✅ Run `node scripts/testSheetsConnection.js` to verify
2. ✅ Design your database schema based on sheet structure
3. ✅ Start building the ETL extract module
4. ✅ Implement data transformation logic

---

## 📚 Additional Resources

- **Google Sheets API Documentation**: [https://developers.google.com/sheets/api](https://developers.google.com/sheets/api)
- **Service Account Guide**: [https://cloud.google.com/iam/docs/service-accounts](https://cloud.google.com/iam/docs/service-accounts)
- **googleapis Node.js Client**: [https://github.com/googleapis/google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client)
- **API Quotas & Limits**: [https://developers.google.com/sheets/api/limits](https://developers.google.com/sheets/api/limits)

---

## 📝 Checklist

Use this checklist to track your progress:

- [ ] Created Google Cloud Project
- [ ] Enabled Google Sheets API
- [ ] Created Service Account
- [ ] Downloaded JSON credentials
- [ ] Moved credentials to `credentials/` folder
- [ ] Updated `.gitignore` to exclude credentials
- [ ] Updated `.env` with `GOOGLE_CREDENTIALS_PATH` and `GOOGLE_SHEET_ID`
- [ ] Shared Google Sheet with service account email
- [ ] Installed `googleapis` package
- [ ] Tested connection with test script

---

**Last Updated**: December 16, 2025  
**Guide Version**: 1.0
