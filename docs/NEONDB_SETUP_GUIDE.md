# NeonDB Setup Guide - Step by Step

This guide will walk you through creating a NeonDB account, setting up your first database, and obtaining all the credentials you need for your `.env` file.

## 📋 What You'll Get

By the end of this guide, you'll have:
- `DB_HOST` - Your NeonDB host URL
- `DB_NAME` - Your database name
- `DB_USER` - Your database username
- `DB_PASSWORD` - Your database password
- `DB_PORT` - Port number (always 5432 for PostgreSQL)

---

## 🚀 Step-by-Step Instructions

### Step 1: Create a NeonDB Account

1. **Visit NeonDB Website**
   - Go to [https://neon.tech](https://neon.tech)
   - Click on **"Sign Up"** or **"Get Started"** button

2. **Sign Up Options**
   - Sign up with **GitHub** (recommended - fastest)
   - Or sign up with **Google**
   - Or sign up with **Email**

3. **Complete Registration**
   - Follow the prompts to verify your email (if using email signup)
   - You'll be redirected to the NeonDB Console

---

### Step 2: Create Your First Project

1. **Create New Project**
   - After logging in, you'll see the NeonDB Console
   - Click **"Create a project"** or **"New Project"** button
   - If you already have a project, click **"+ New Project"** in the sidebar

2. **Configure Project Settings**
   
   **Project Name:**
   - Enter a descriptive name (e.g., "SheetsToDb" or "GoogleSheetsETL")
   
   **Database Name:**
   - Enter your database name (e.g., "sheets_data" or "main_db")
   - ⚠️ **Save this!** This is your `DB_NAME`
   
   **Region:**
   - Choose the region closest to you for better performance
   - Options: US East (Ohio), US West (Oregon), Europe (Frankfurt), Asia Pacific (Singapore)
   
   **Postgres Version:**
   - Select **15** or **16** (latest stable)

3. **Click "Create Project"**
   - Wait a few seconds for the project to be provisioned

---

### Step 3: Get Your Connection Details

Once your project is created, you'll be taken to the **Project Dashboard**.

#### Method 1: Quick Connection String (Easiest)

1. **Find Connection Details Section**
   - Look for **"Connection Details"** or **"Quick Start"** panel
   - You'll see a connection string that looks like:
   ```
   postgresql://[username]:[password]@[host]/[database]
   ```

2. **Example Connection String:**
   ```
   postgresql://khushboo_user:AbCd1234XyZ@ep-cool-sea-12345678.us-east-2.aws.neon.tech/sheets_data?sslmode=require
   ```

3. **Break Down the Connection String:**
   
   From this example:
   ```
   postgresql://khushboo_user:AbCd1234XyZ@ep-cool-sea-12345678.us-east-2.aws.neon.tech/sheets_data?sslmode=require
   ```
   
   Extract:
   - **DB_USER** = `khushboo_user` (before the colon)
   - **DB_PASSWORD** = `AbCd1234XyZ` (between colon and @)
   - **DB_HOST** = `ep-cool-sea-12345678.us-east-2.aws.neon.tech` (after @ and before /)
   - **DB_NAME** = `sheets_data` (after the /)
   - **DB_PORT** = `5432` (default PostgreSQL port)

#### Method 2: Individual Credentials (Alternative)

1. **Navigate to Project Dashboard**
   - Click on your project name in the sidebar

2. **Find "Connection Details" Tab**
   - Click on the **"Dashboard"** or **"Connection Details"** tab

3. **Select Connection Parameters**
   - Look for a dropdown that says **"Parameters"** or **"Connection parameters"**
   - Click to expand it

4. **Copy Individual Values:**
   
   You'll see fields like:
   ```
   Host:     ep-cool-sea-12345678.us-east-2.aws.neon.tech
   Database: sheets_data
   User:     khushboo_user
   Password: [Show Password button]
   Port:     5432
   ```

5. **Reveal Password**
   - Click **"Show Password"** or the eye icon
   - ⚠️ **Important:** Copy this immediately - passwords are only shown once!

---

### Step 4: Configure Your `.env` File

1. **Open Your `.env` File**
   - Location: `e:\Khushboo\Backend(SheetsToDb)\.env`

2. **Add the Following Configuration:**

   ```env
   # NeonDB Connection Details
   DB_HOST=ep-cool-sea-12345678.us-east-2.aws.neon.tech
   DB_PORT=5432
   DB_NAME=sheets_data
   DB_USER=khushboo_user
   DB_PASSWORD=AbCd1234XyZ
   DB_SSL=true
   ```

3. **Replace with YOUR Actual Values:**
   - `DB_HOST` → Your host from NeonDB
   - `DB_NAME` → Your database name
   - `DB_USER` → Your username
   - `DB_PASSWORD` → Your password
   - Keep `DB_PORT=5432` and `DB_SSL=true`

---

### Step 5: Test Your Connection

1. **Save Your `.env` File**

2. **Run the Connection Test Script:**
   ```bash
   node scripts/testDbConnection.js
   ```

3. **Expected Success Output:**
   ```
   ✓ Database connection successful
   ✓ Connected to: ep-cool-sea-12345678.us-east-2.aws.neon.tech
   ✓ Database: sheets_data
   ✓ PostgreSQL version: 15.x
   ✓ SSL enabled: true
   ```

4. **If You Get an Error:**
   - Double-check all credentials are correct
   - Ensure no extra spaces in `.env` values
   - Verify your NeonDB project is "Active" in the console
   - Check internet connection

---

## 🔑 Important Notes

### Security Best Practices

- ✅ **Never commit `.env` to Git** - It's already in `.gitignore`
- ✅ **Copy password immediately** - NeonDB may not show it again
- ✅ **Use different passwords** for development and production
- ✅ **Store credentials securely** - Use a password manager

### Free Tier Limits

NeonDB free tier includes:
- ✅ 3 projects
- ✅ 10 branches per project
- ✅ 3 GB storage per branch
- ✅ Unlimited compute hours (with autoscaling)

### Connection Pooling

For production applications, consider using NeonDB's built-in connection pooling:
- Add `-pooler` to your host:
  ```
  DB_HOST=ep-cool-sea-12345678-pooler.us-east-2.aws.neon.tech
  ```

---

## 📸 Visual Reference

### Where to Find Connection Details in NeonDB Console

```
┌─────────────────────────────────────────────────────┐
│ NeonDB Console                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Project: SheetsToDb                   [Settings]  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Connection Details                            │ │
│  ├───────────────────────────────────────────────┤ │
│  │                                               │ │
│  │ Connection string:                            │ │
│  │ postgresql://user:pass@host/db [Copy]        │ │
│  │                                               │ │
│  │ ▼ Parameters                                  │ │
│  │   Host:     ep-*****.neon.tech                │ │
│  │   Database: sheets_data                       │ │
│  │   User:     your_username                     │ │
│  │   Password: [Show] ●●●●●●●●                   │ │
│  │   Port:     5432                              │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
- **Solution:** Check if `DB_HOST` includes the full hostname
- **Solution:** Verify `DB_PORT` is 5432

### Issue: "Password authentication failed"
- **Solution:** Regenerate password in NeonDB console
- **Solution:** Ensure no extra quotes or spaces in `.env`

### Issue: "Database does not exist"
- **Solution:** Verify `DB_NAME` matches exactly (case-sensitive)
- **Solution:** Check the database was created in the NeonDB console

### Issue: "SSL connection required"
- **Solution:** Ensure `DB_SSL=true` in your `.env`
- **Solution:** NeonDB requires SSL for all connections

---

## 🎯 Next Steps

After successfully connecting:

1. ✅ Test connection with `node scripts/testDbConnection.js`
2. ✅ Create database schema in `sql/schema.sql`
3. ✅ Set up Google Sheets API credentials
4. ✅ Start building ETL pipeline

---

## 📞 Support

- **NeonDB Documentation:** [https://neon.tech/docs](https://neon.tech/docs)
- **NeonDB Discord:** [Join Community](https://discord.gg/neon)
- **Email Support:** support@neon.tech

---

**Last Updated:** December 16, 2025  
**Guide Version:** 1.0
