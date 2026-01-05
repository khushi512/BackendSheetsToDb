-- ========================================
-- DATABASE VIEWS: Student Enrollment System
-- ========================================
-- Purpose: Create reusable views for common queries
-- Schema: university

SET search_path TO university;

-- ========================================
-- VIEW 1: student_enrollment_summary
-- ========================================
-- Comprehensive student summary with enrollment counts and department

CREATE OR REPLACE VIEW student_enrollment_summary AS
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    d.department_name,
    COUNT(e.enrollment_id) AS total_enrollments,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments,
    COUNT(CASE WHEN e.status = 'Graduated' THEN 1 END) AS graduated_enrollments,
    COUNT(CASE WHEN e.status = 'Inactive' THEN 1 END) AS inactive_enrollments,
    MAX(e.enrollment_date) AS latest_enrollment_date,
    s.created_at AS student_since
FROM students s
LEFT JOIN departments d ON s.department_id = d.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
GROUP BY s.student_id, s.first_name, s.last_name, s.email, s.phone, d.department_name, s.created_at;

COMMENT ON VIEW student_enrollment_summary IS 
'Provides a complete summary of each student including enrollment counts by status and department information';

-- Usage example:
-- SELECT * FROM student_enrollment_summary WHERE total_enrollments > 2;

-- ========================================
-- VIEW 2: department_statistics
-- ========================================
-- Aggregate statistics per department

CREATE OR REPLACE VIEW department_statistics AS
SELECT 
    d.department_id,
    d.department_name,
    COUNT(DISTINCT s.student_id) AS total_students,
    COUNT(DISTINCT c.course_id) AS total_courses,
    COUNT(e.enrollment_id) AS total_enrollments,
    ROUND(AVG(
        CASE 
            WHEN s.student_id IS NOT NULL 
            THEN (SELECT COUNT(*) FROM enrollments WHERE student_id = s.student_id)
            ELSE 0 
        END
    ), 2) AS avg_enrollments_per_student,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments
FROM departments d
LEFT JOIN students s ON d.department_id = s.department_id
LEFT JOIN courses c ON d.department_id = c.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
GROUP BY d.department_id, d.department_name;

COMMENT ON VIEW department_statistics IS
'Department-level statistics including student counts, course counts, and enrollment metrics';

-- Usage example:
-- SELECT * FROM department_statistics ORDER BY total_students DESC;

-- ========================================
-- VIEW 3: active_student_courses
-- ========================================
-- Students with their actively enrolled courses

CREATE OR REPLACE VIEW active_student_courses AS
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    sd.department_name AS student_department,
    c.course_code,
    c.credits,
    cd.department_name AS course_department,
    e.enrollment_date,
    e.academic_year,
    CASE 
        WHEN s.department_id = c.department_id THEN 'In-Department'
        ELSE 'Cross-Department'
    END AS enrollment_type
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN departments sd ON s.department_id = sd.department_id
JOIN departments cd ON c.department_id = cd.department_id
WHERE e.status = 'Active';

COMMENT ON VIEW active_student_courses IS
'Lists all active enrollments with student and course details, including cross-department enrollment indicator';

-- Usage example:
-- SELECT * FROM active_student_courses WHERE enrollment_type = 'Cross-Department';

-- ========================================
-- VIEW 4: course_enrollment_summary
-- ========================================
-- Course-centric view showing enrollment statistics per course

CREATE OR REPLACE VIEW course_enrollment_summary AS
SELECT 
    c.course_id,
    c.course_code,
    d.department_name,
    c.credits,
    COUNT(e.enrollment_id) AS total_enrollments,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_students,
    COUNT(CASE WHEN e.status = 'Graduated' THEN 1 END) AS graduated_students,
    COUNT(DISTINCT e.student_id) AS unique_students,
    MIN(e.enrollment_date) AS first_enrollment_date,
    MAX(e.enrollment_date) AS latest_enrollment_date
FROM courses c
LEFT JOIN departments d ON c.department_id = d.department_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_code, d.department_name, c.credits;

COMMENT ON VIEW course_enrollment_summary IS
'Provides enrollment statistics for each course including active/graduated counts and date ranges';

-- Usage example:
-- SELECT * FROM course_enrollment_summary ORDER BY active_students DESC;

-- ========================================
-- VIEW 5: enrollment_timeline
-- ========================================
-- Chronological view of all enrollments

CREATE OR REPLACE VIEW enrollment_timeline AS
SELECT 
    e.enrollment_id,
    e.enrollment_date,
    e.academic_year,
    s.first_name || ' ' || s.last_name AS student_name,
    s.student_id,
    c.course_code,
    d.department_name,
    e.status,
    EXTRACT(YEAR FROM e.enrollment_date) AS enrollment_year,
    EXTRACT(MONTH FROM e.enrollment_date) AS enrollment_month
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN departments d ON c.department_id = d.department_id;

COMMENT ON VIEW enrollment_timeline IS
'Chronological view of all enrollments with extracted year/month for time-based analysis';

-- Usage example:
-- SELECT enrollment_year, enrollment_month, COUNT(*) 
-- FROM enrollment_timeline 
-- GROUP BY enrollment_year, enrollment_month 
-- ORDER BY enrollment_year, enrollment_month;

-- ========================================
-- NOTES:
-- ========================================
-- All views use the university schema
-- Views can be queried like regular tables
-- Views provide performance benefits through query optimization
-- To drop a view: DROP VIEW IF EXISTS view_name;
-- To refresh a view: Views are automatically updated when base tables change
-- ========================================

-- ========================================
-- VIEW VERIFICATION
-- ========================================
-- List all created views
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'university'
ORDER BY table_name;
