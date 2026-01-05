-- ========================================
-- SEED DATA: Student Enrollment System
-- ========================================
-- Purpose: Populate database with sample data for testing
-- Usage: Run after schema.sql
--   psql -h [host] -U [user] -d [database] -f sql/seed.sql

-- Set search path (if using schema)
SET search_path TO university;

-- ========================================
-- Clear existing data (for re-running)
-- ========================================
TRUNCATE TABLE enrollments, courses, students, departments RESTART IDENTITY CASCADE;

-- ========================================
-- 1. DEPARTMENTS
-- ========================================
INSERT INTO departments (department_name) VALUES
('Computer Science'),
('Mathematics'),
('Engineering'),
('Physics'),
('Chemistry'),
('Biology'),
('Business');

-- ========================================
-- 2. STUDENTS
-- ========================================
INSERT INTO students (student_id, first_name, last_name, email, phone, department_id) VALUES
-- Computer Science Students
(1001, 'Alice', 'Johnson', 'alice.johnson@university.edu', '555-0101', 1),
(1002, 'Bob', 'Smith', 'bob.smith@university.edu', '555-0102', 1),
(1003, 'Carol', 'Williams', 'carol.williams@university.edu', '555-0103', 1),
(1004, 'David', 'Brown', 'david.brown@university.edu', '555-0104', 1),

-- Mathematics Students
(1005, 'Emma', 'Davis', 'emma.davis@university.edu', '555-0105', 2),
(1006, 'Frank', 'Miller', 'frank.miller@university.edu', '555-0106', 2),
(1007, 'Grace', 'Wilson', 'grace.wilson@university.edu', '555-0107', 2),

-- Engineering Students
(1008, 'Henry', 'Moore', 'henry.moore@university.edu', '555-0108', 3),
(1009, 'Iris', 'Taylor', 'iris.taylor@university.edu', '555-0109', 3),
(1010, 'Jack', 'Anderson', 'jack.anderson@university.edu', '555-0110', 3),

-- Physics Students
(1011, 'Kate', 'Thomas', 'kate.thomas@university.edu', '555-0111', 4),
(1012, 'Liam', 'Jackson', 'liam.jackson@university.edu', '555-0112', 4),

-- Chemistry Students
(1013, 'Mia', 'White', 'mia.white@university.edu', '555-0113', 5),
(1014, 'Noah', 'Harris', 'noah.harris@university.edu', '555-0114', 5),

-- Biology Students
(1015, 'Olivia', 'Martin', 'olivia.martin@university.edu', '555-0115', 6),

-- Business Students
(1016, 'Peter', 'Garcia', 'peter.garcia@university.edu', '555-0116', 7),
(1017, 'Quinn', 'Martinez', 'quinn.martinez@university.edu', '555-0117', 7),
(1018, 'Rachel', 'Robinson', 'rachel.robinson@university.edu', '555-0118', 7);

-- ========================================
-- 3. COURSES
-- ========================================
INSERT INTO courses (course_code, department_id, credits) VALUES
-- Computer Science
('CS101', 1, 3),
('CS201', 1, 4),
('CS301', 1, 4),

-- Mathematics
('MATH101', 2, 3),
('MATH201', 2, 4),
('MATH301', 2, 3),

-- Engineering
('ENG101', 3, 4),
('ENG201', 3, 4),

-- Physics
('PHYS101', 4, 3),
('PHYS201', 4, 4),

-- Chemistry
('CHEM101', 5, 3),
('CHEM201', 5, 4),

-- Biology
('BIO101', 6, 3),
('BIO201', 6, 4),

-- Business
('BUS101', 7, 3),
('BUS201', 7, 3);

-- ========================================
-- 4. ENROLLMENTS
-- ========================================
INSERT INTO enrollments (student_id, course_id, enrollment_date, academic_year, status) VALUES
-- Alice's enrollments
(1001, 1, '2024-01-15', 2024, 'Active'),
(1001, 2, '2024-01-15', 2024, 'Active'),

-- Bob's enrollments
(1002, 1, '2024-01-16', 2024, 'Active'),
(1002, 3, '2024-01-16', 2024, 'Active'),

-- Carol's enrollments
(1003, 1, '2024-01-15', 2024, 'Active'),
(1003, 4, '2024-01-15', 2024, 'Active'),

-- David's enrollments
(1004, 2, '2024-01-17', 2024, 'Active'),
(1004, 3, '2024-01-17', 2024, 'Active'),

-- Emma's enrollments (Math student taking Math courses)
(1005, 4, '2024-01-15', 2024, 'Active'),
(1005, 5, '2024-01-15', 2024, 'Active'),

-- Frank's enrollments
(1006, 4, '2024-01-16', 2024, 'Active'),
(1006, 6, '2024-01-16', 2024, 'Active'),

-- Grace's enrollments
(1007, 5, '2024-01-15', 2024, 'Active'),

-- Henry's enrollments (Engineering)
(1008, 7, '2024-01-15', 2024, 'Active'),
(1008, 8, '2024-01-15', 2024, 'Active'),

-- Iris's enrollments
(1009, 7, '2024-01-16', 2024, 'Active'),

-- Jack's enrollments
(1010, 8, '2024-01-17', 2024, 'Active'),

-- Kate's enrollments (Physics)
(1011, 9, '2024-01-15', 2024, 'Active'),
(1011, 10, '2024-01-15', 2024, 'Active'),

-- Liam's enrollments
(1012, 9, '2024-01-16', 2024, 'Active'),

-- Mia's enrollments (Chemistry)
(1013, 11, '2024-01-15', 2024, 'Active'),
(1013, 12, '2024-01-15', 2024, 'Active'),

-- Noah's enrollments
(1014, 11, '2024-01-16', 2024, 'Active'),

-- Olivia's enrollments (Biology)
(1015, 13, '2024-01-15', 2024, 'Active'),
(1015, 14, '2024-01-15', 2024, 'Active'),

-- Peter's enrollments (Business)
(1016, 15, '2024-01-15', 2024, 'Active'),
(1016, 16, '2024-01-15', 2024, 'Active'),

-- Quinn's enrollments
(1017, 15, '2024-01-16', 2024, 'Active'),

-- Rachel's enrollments
(1018, 16, '2024-01-17', 2024, 'Active'),

-- Some graduated/inactive students for testing
(1003, 2, '2023-09-01', 2023, 'Graduated'),
(1007, 4, '2023-09-01', 2023, 'Inactive');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Uncomment to verify data insertion

-- SELECT 'Departments' AS table_name, COUNT(*) AS row_count FROM departments
-- UNION ALL
-- SELECT 'Students', COUNT(*) FROM students
-- UNION ALL
-- SELECT 'Courses', COUNT(*) FROM courses
-- UNION ALL
-- SELECT 'Enrollments', COUNT(*) FROM enrollments;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT 'Seed data inserted successfully!' AS message,
       (SELECT COUNT(*) FROM departments) AS departments,
       (SELECT COUNT(*) FROM students) AS students,
       (SELECT COUNT(*) FROM courses) AS courses,
       (SELECT COUNT(*) FROM enrollments) AS enrollments;
