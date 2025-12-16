# Messy Student Registration Sheet - Template & Guide

## 📋 Purpose

This template helps you create a realistic "messy" Google Sheet with data quality issues for your ETL pipeline testing. This simulates real-world data challenges you'll encounter in production.

---

## 🎯 Sheet Structure

### Column Headers
```
StudentID | FirstName | LastName | Email | Phone | Department | Year | EnrollmentDate | CourseCode | Status
```

---

## 📊 Sample Data with Intentional Issues

Copy this data into your Google Sheet:

| StudentID | FirstName | LastName | Email | Phone | Department | Year | EnrollmentDate | CourseCode | Status |
|-----------|-----------|----------|-------|-------|------------|------|----------------|------------|--------|
| 1001 | Alice | Smith | alice.smith@university.edu | 555-1234 | Computer Science | 2024 | 2024-01-15 | CS101 | Active |
| 1002 | Bob | Johnson | bob.j@university.edu | 555-2345 | Mathematics | 2023 | 2023-09-01 | MATH201 | Active |
| 1003 | Charlie | Brown |  | 555-3456 | Engineering | 2024 | 2024-01-20 | ENG101 | Active |
| 1004 | Diana | Prince | diana.prince@university.edu | 555-4567 | computer science | 2024 | 01/15/2024 | CS101 | active |
| 1001 | Alice | Smith | alice.smith@university.edu | 555-1234 | Computer Science | 2024 | 2024-01-15 | CS101 | Active |
| 1005 | Eve | Martinez | eve@uni.edu | (555) 567-8910 | Physics | 2023 |  | PHYS301 | Active |
| 1006 | Frank |  | frank.wright@university.edu | 555-6789 | Chemistry | 2022 | 2022-09-05 | CHEM202 | Graduated |
|  | Grace | Lee | grace.lee@university.edu | 555-7890 | Biology | 2024 | 2024-01-18 | BIO101 | Active |
| 1008 | Henry | Taylor | HENRY.TAYLOR@UNIVERSITY.EDU | 555-8901 | Mathematics | 2023 | 2023/09/01 | MATH201 | active |
| 1009 | Ivy | Chen | ivy.chen@university.edu | 5559012 | Computer Science | 2024 | 2024-01-15 | CS101 | Active |
| 1010 | Jack | Wilson | jack@university.edu | 555-0123 | Engineering | 2024 | 2024-01-20 | ENG101 | Inactive |
| 1002 | Bob | Johnson | bob.j@university.edu | 555-2345 | Math | 2023 | 2023-09-01 | MATH201 | Active |
| 1011 | Karen | Davis | karen.davis@yahoo.com | 555-1234 | Business | 2023 | 2023-09-10 | BUS101 | Active |
| 1012 | Leo | Anderson | leo.anderson@university.edu |  | Computer Science | 2024 | 2024-01-22 |  | Active |
| 1013 | Maria | Garcia | maria.garcia@university.edu | 555-3456 | CS | 2024 | 15-01-2024 | CS101 | Active |
| 1014 | Nathan | Brown | nathan.brown@university.edu | 555-4567 | Mathematics | twenty-twenty-three | 2023-09-01 | MATH201 | Active |
| 1015 | Olivia | Miller | olivia@university | 555-5678 | Engineering | 2024 | 2024-01-25 | ENG202 | Active |
| 1016 | Peter | Parker | peter.parker@university.edu | 555-6789 | Physics | 2023 | 2023-09-02 | PHYS201 | Active |
| 1017 |  | Quinn | sarah.quinn@university.edu | 555-7890 | Chemistry | 2024 | 2024-01-15 | CHEM101 | Active |
| 1018 | Ryan | Thomas | ryan.thomas@university.edu | 555-8901 | Biology | 2024 | 2024/01/30 | BIO201 | ACTIVE |
| 1019 | Sophia | White | sophia.white@university.edu | 555-9012 | computer SCIENCE | 2024 | 2024-01-15 | cs101 | Active |
| 1020 | Thomas | Harris | tom.harris@university.edu | 555.0123 | Mathematics | 2023 | 2023-09-01 | MATH301 | active |
| 1021 | Uma | Patel | uma.patel@university.edu | 555-1234 | Engineering | 2024 | 2024-01-28 | ENG101 | Active |
| 1022 | Victor | Lopez | victor@university.edu | 555-2345 | Physics | 2023 | Sept 1, 2023 | PHYS301 | Active |
| 1008 | Henry | Taylor | henry.taylor@university.edu | 555-8901 | Mathematics | 2023 | 2023-09-01 | MATH201 | Active |
| 1023 | Wendy | Clark | wendy.clark@university.edu | +1-555-3456 | Chemistry | 2024 | 2024-01-20 | CHEM202 | Active |
| 1024 | Xavier | Rodriguez | xavier.rodriguez@university.edu | 555-4567 | Computer Science | 2024 | 2024-01-15 | CS201 | Suspended |
| 1025 | Yara | Kim | yara.kim@university.edu | 555-5678 | Biology | 2023 | 2023-09-05 | BIO301 | Active |
| 1026 | Zoe | Johnson | zoe.johnson@university.edu | 555-6789 | Business | 2024 | 2024-01-10 | BUS201 | Active |
| 1027 | Adam | Brown | adam.brown@university.edu | 555-7890 | Engineering | 2024 |  | ENG301 | Active |
| 1028 | Betty | Davis | betty.davis@university.edu |  | Mathematics | 2023 | 2023-09-01 | MATH101 | Active |

---

## 🔍 Intentional Data Quality Issues

### 1. **Missing Values** ❌
- **Row 3**: Missing email (Charlie Brown)
- **Row 6**: Missing enrollment date (Eve Martinez)
- **Row 7**: Missing last name (Frank)
- **Row 8**: Missing StudentID (Grace Lee)
- **Row 13**: Missing phone (Leo Anderson)
- **Row 13**: Missing course code (Leo Anderson)
- **Row 17**: Missing first name (Sarah Quinn)
- **Row 27**: Missing enrollment date (Adam Brown)
- **Row 28**: Missing phone (Betty Davis)

### 2. **Duplicate Records** 🔄
- **Rows 1 & 5**: Complete duplicate (StudentID 1001, Alice Smith)
- **Rows 2 & 12**: Duplicate with slight variation (Bob Johnson, "Mathematics" vs "Math")
- **Rows 8 & 25**: Duplicate (StudentID 1008, Henry Taylor)

### 3. **Inconsistent Formatting** 📝

**Date Formats:**
- ISO format: `2024-01-15`
- US format: `01/15/2024`
- European format: `15-01-2024`
- Slash format: `2023/09/01`
- Text format: `Sept 1, 2023`
- Invalid text: `twenty-twenty-three`

**Phone Formats:**
- Standard: `555-1234`
- With parentheses: `(555) 567-8910`
- No separator: `5559012`
- Dots: `555.0123`
- International: `+1-555-3456`

**Email Issues:**
- Inconsistent domains: `@university.edu`, `@uni.edu`, `@yahoo.com`
- Missing domain: `olivia@university`
- ALL CAPS: `HENRY.TAYLOR@UNIVERSITY.EDU`

**Department Names:**
- Full: `Computer Science`
- Lowercase: `computer science`
- Mixed: `computer SCIENCE`
- Abbreviated: `CS`, `Math`

**Course Codes:**
- Mixed case: `CS101`, `cs101`

**Status:**
- Mixed case: `Active`, `active`, `ACTIVE`
- Various: `Inactive`, `Graduated`, `Suspended`

### 4. **Data Type Issues** ⚠️
- **Row 14**: Year as text (`twenty-twenty-three`)
- **Row 9**: Phone missing separator (`5559012`)

---

## 📝 How to Use This Template

### Option 1: Create in Google Sheets (Recommended)

1. **Create a new Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click **"Blank"** to create new sheet
   - Name it: `Messy Student Registration Data`

2. **Copy the Headers**
   - Copy the column headers row

3. **Copy the Sample Data**
   - Copy all the data rows from the table above
   - Paste into your sheet

4. **Get the Sheet ID**
   - Copy the ID from the URL
   - Add to your `.env` file

5. **Share with Service Account**
   - Share the sheet with your service account email (from credentials JSON)
   - Set permission to "Editor"

### Option 2: Import from CSV

I'll create a downloadable CSV file for you.

---

## 🎯 Expected ETL Challenges

Your ETL pipeline should handle:

1. **Deduplication**
   - Identify and remove/merge duplicate StudentIDs
   - Handle partial duplicates

2. **Date Normalization**
   - Convert all dates to ISO format (YYYY-MM-DD)
   - Handle invalid date formats

3. **Phone Standardization**
   - Normalize to single format (e.g., XXX-XXX-XXXX)
   - Handle missing values

4. **Email Validation**
   - Validate email format
   - Standardize domain
   - Flag invalid emails

5. **Department Standardization**
   - Convert to title case
   - Map abbreviations to full names

6. **Missing Value Handling**
   - Flag records with missing required fields
   - Decide on handling strategy (reject, default value, manual review)

7. **Case Normalization**
   - Standardize text case (Status, Department, etc.)

---

## 🗄️ Target Database Schema (Preview)

After cleaning, your data should fit this schema:

```sql
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id INTEGER REFERENCES departments(id),
    year INTEGER NOT NULL,
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    course_code VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL
);
```

---

## 📊 Data Quality Metrics to Track

Your ETL pipeline should log:

- Total records processed
- Valid records
- Duplicate records found
- Records with missing critical fields
- Records with invalid emails
- Records with invalid dates
- Records with missing phone numbers
- Department name variations found
- Successfully loaded records
- Failed/rejected records

---

## 🚀 Next Steps

1. ✅ Create the Google Sheet with this data
2. ✅ Add the Sheet ID to `.env`
3. ✅ Test connection with `node scripts/testSheetsConnection.js`
4. ✅ Design your cleaned database schema
5. ✅ Build ETL transformation logic
6. ✅ Load cleaned data into NeonDB

---

**Created**: December 16, 2025  
**Purpose**: ETL Pipeline Testing & Data Quality Assignment
