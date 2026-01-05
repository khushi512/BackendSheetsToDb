-- ========================================
-- BUSINESS QUERIES: Student Enrollment System
-- ========================================
-- Purpose: Analytics and reporting queries for student enrollment data
-- Schema: university (departments, students, courses, enrollments)

SET search_path TO university;

-- ========================================
-- 1. STUDENTS PER DEPARTMENT
-- ========================================
-- Count of students by department (including departments with no students)

SELECT 
    d.department_name,
    COUNT(s.student_id) AS student_count
FROM departments d
LEFT JOIN students s ON d.department_id = s.department_id
GROUP BY d.department_id, d.department_name
ORDER BY student_count DESC, d.department_name;

-- Expected output: 7 departments with counts

-- ========================================
-- 2. LIST ALL ACTIVE ENROLLMENTS
-- ========================================
-- Show student names, course codes, and enrollment details for active students

SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    c.course_code,
    d.department_name,
    e.enrollment_date,
    e.academic_year,
    e.status
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN departments d ON s.department_id = d.department_id
WHERE e.status = 'Active'
ORDER BY s.last_name, s.first_name, c.course_code;

-- ========================================
-- 3. FIND STUDENTS WITHOUT ENROLLMENTS
-- ========================================
-- Identify students who haven't enrolled in any courses

SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.email,
    d.department_name
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN departments d ON s.department_id = d.department_id
WHERE e.enrollment_id IS NULL
ORDER BY s.last_name, s.first_name;

-- ========================================
-- 4. DETECT DUPLICATE EMAILS
-- ========================================
-- Data quality check: find any duplicate emails (should be 0 due to UNIQUE constraint)

SELECT 
    email,
    COUNT(*) AS occurrence_count,
    STRING_AGG(student_id::TEXT, ', ') AS student_ids
FROM students
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- Expected: No results (unique constraint enforced)

-- ========================================
-- 5. AVERAGE ENROLLMENTS PER STUDENT
-- ========================================
-- Calculate average number of courses per student

SELECT 
    AVG(enrollment_count) AS avg_enrollments_per_student,
    MIN(enrollment_count) AS min_enrollments,
    MAX(enrollment_count) AS max_enrollments
FROM (
    SELECT 
        s.student_id,
        COUNT(e.enrollment_id) AS enrollment_count
    FROM students s
    LEFT JOIN enrollments e ON s.student_id = e.student_id
    GROUP BY s.student_id
) AS student_enrollments;

-- ========================================
-- 6. COURSES WITH MOST ENROLLMENTS
-- ========================================
-- Rank courses by number of enrolled students

SELECT 
    c.course_code,
    d.department_name,
    c.credits,
    COUNT(e.enrollment_id) AS enrollment_count,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN departments d ON c.department_id = d.department_id
GROUP BY c.course_id, c.course_code, d.department_name, c.credits
ORDER BY enrollment_count DESC, c.course_code;

-- ========================================
-- 7. DEPARTMENT ENROLLMENT STATISTICS
-- ========================================
-- Comprehensive stats per department

SELECT 
    d.department_name,
    COUNT(DISTINCT s.student_id) AS student_count,
    COUNT(DISTINCT c.course_id) AS course_count,
    COUNT(e.enrollment_id) AS total_enrollments,
    ROUND(AVG(enrollment_counts.enrollments_per_student), 2) AS avg_enrollments_per_student
FROM departments d
LEFT JOIN students s ON d.department_id = s.department_id
LEFT JOIN courses c ON d.department_id = c.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN (
    SELECT s2.department_id, s2.student_id, COUNT(e2.enrollment_id) AS enrollments_per_student
    FROM students s2
    LEFT JOIN enrollments e2 ON s2.student_id = e2.student_id
    GROUP BY s2.department_id, s2.student_id
) enrollment_counts ON d.department_id = enrollment_counts.department_id
GROUP BY d.department_id, d.department_name
ORDER BY student_count DESC;

-- ========================================
-- 8. STUDENTS ENROLLED IN SPECIFIC COURSES
-- ========================================
-- Find students enrolled in Computer Science courses (CS101, CS201, etc.)

SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    e.status,
    e.academic_year
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE c.course_code LIKE 'CS%'
ORDER BY c.course_code, s.last_name;

-- ========================================
-- 9. RECENT ENROLLMENTS (LAST 30 DAYS)
-- ========================================
-- Track new enrollments in the last month

SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    e.enrollment_date,
    e.status,
    CURRENT_DATE - e.enrollment_date AS days_since_enrollment
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE e.enrollment_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY e.enrollment_date DESC;

-- Note: Will return 0 rows with seed data (all enrollments are from Jan 2024)

-- ========================================
-- 10. DATA QUALITY CHECK QUERIES
-- ========================================

-- Check 1: Students with missing/invalid data
SELECT 
    student_id,
    first_name,
    last_name,
    email,
    phone,
    department_id,
    CASE 
        WHEN email NOT LIKE '%@%' THEN 'Invalid email'
        WHEN department_id IS NULL THEN 'Missing department'
        WHEN first_name IS NULL OR last_name IS NULL THEN 'Missing name'
        ELSE 'Valid'
    END AS data_quality_issue
FROM students
WHERE email NOT LIKE '%@%' 
   OR department_id IS NULL 
   OR first_name IS NULL 
   OR last_name IS NULL;

-- Check 2: Orphaned enrollments (enrollments with invalid references)
SELECT 
    e.enrollment_id,
    e.student_id,
    e.course_id,
    CASE 
        WHEN s.student_id IS NULL THEN 'Student not found'
        WHEN c.course_id IS NULL THEN 'Course not found'
        ELSE 'Valid'
    END AS issue
FROM enrollments e
LEFT JOIN students s ON e.student_id = s.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
WHERE s.student_id IS NULL OR c.course_id IS NULL;

-- Check 3: Enrollment status distribution
SELECT 
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM enrollments
GROUP BY status
ORDER BY count DESC;

-- ========================================
-- 11. COMPLEX JOIN QUERY - Student Full Profile
-- ========================================
-- Complete student profile with all enrollments and department info

SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    d.department_name,
    COUNT(e.enrollment_id) AS total_enrollments,
    STRING_AGG(DISTINCT c.course_code, ', ' ORDER BY c.course_code) AS enrolled_courses,
    MAX(e.enrollment_date) AS latest_enrollment_date
FROM students s
LEFT JOIN departments d ON s.department_id = d.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
GROUP BY s.student_id, s.first_name, s.last_name, s.email, s.phone, d.department_name
ORDER BY s.last_name, s.first_name;

-- ========================================
-- 12. CROSS-DEPARTMENT ENROLLMENTS
-- ========================================
-- Find students enrolled in courses outside their department

SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    sd.department_name AS student_department,
    c.course_code,
    cd.department_name AS course_department
FROM students s
JOIN departments sd ON s.department_id = sd.department_id
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN departments cd ON c.department_id = cd.department_id
WHERE s.department_id != c.department_id
ORDER BY s.last_name, c.course_code;

-- ========================================
-- NOTES:
-- ========================================
-- All queries use the university schema
-- Queries are optimized using existing indexes on:
--   - students(email)
--   - students(department_id)
--   - courses(department_id)
--   - enrollments(student_id)
--   - enrollments(course_id)
--   - enrollments(status)
-- ========================================
