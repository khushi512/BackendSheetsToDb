# Google Sheets to PostgreSQL/NeonDB Migration

> **Automated ETL pipeline for migrating Google Sheets workflows to PostgreSQL/NeonDB with real-time synchronization and interactive dashboards.**

## 📋 Overview

This project provides a complete solution for migrating data-driven workflows from Google Sheets to a robust PostgreSQL database hosted on NeonDB. It includes:

- ✅ Automated ETL (Extract, Transform, Load) pipeline
- ✅ Google Sheets API integration
- ✅ Real-time data synchronization via Google App Script
- ✅ Interactive data dashboards
- ✅ Comprehensive error handling and logging

## 🏗️ Architecture

```
Google Sheets → Google Sheets API → ETL Pipeline → PostgreSQL/NeonDB → Dashboard
                                         ↑
                                Google App Script
                                    (Triggers)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** knowledge
- **Google Cloud Platform** account
- **NeonDB** account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Backend(SheetsToDb)
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=your-neondb-host.neon.tech
   DB_PORT=5432
   DB_NAME=your-database-name
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_SSL=true

   # Google Sheets API
   GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json
   GOOGLE_SHEET_ID=your-sheet-id-here
   ```

4. **Test database connection**
   ```bash
   node scripts/testDbConnection.js
   ```

## 📁 Project Structure

```
Backend(SheetsToDb)/
├── config/              # Configuration files
├── etl/                 # ETL pipeline scripts
├── scripts/             # Utility scripts
├── sql/                 # SQL schemas and queries
├── services/            # Reusable services
├── google-app-script/   # Google App Script code
├── dashboard/           # Dashboard implementation
└── logs/                # Application logs
```

## 🔧 Configuration

### NeonDB Setup

1. Create a NeonDB account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy connection details to `.env`

### Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Sheets API
4. Create a service account
5. Download credentials as JSON
6. Save to `credentials/google-service-account.json`
7. Share your Google Sheet with the service account email

## 📊 Usage

### Running ETL Pipeline

```bash
# Run one-time ETL
node etl/pipeline.js

# Schedule automated runs (setup in code)
# See etl/pipeline.js for cron configuration
```

### Database Operations

```bash
# Test connection
node scripts/testDbConnection.js

# Run migrations
node scripts/migrate.js
```

## 🛠️ Technology Stack

- **Backend**: Node.js
- **Database**: PostgreSQL (NeonDB)
- **Database Client**: node-postgres (`pg`)
- **Environment**: dotenv
- **API**: Google Sheets API v4
- **Real-time Sync**: Google App Script

## 📝 Development Status

**Current Phase**: Environment Setup & Tools (Task 1)

- [x] Repository initialized
- [x] Basic project structure
- [x] Dependencies installed
- [x] NeonDB setup verified
- [x] Database connection tested
- [ ] Google Cloud Project setup
- [ ] Google Sheets API enabled

See [task.md](../brain/task.md) for detailed progress tracking.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[MIT License](LICENSE)

## 🔗 Resources

- [NeonDB Documentation](https://neon.tech/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [node-postgres](https://node-postgres.com/)
- [Google App Script](https://developers.google.com/apps-script)

---

**Last Updated**: December 16, 2025  
**Version**: 0.1.0 (Pre-release)
