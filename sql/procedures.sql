-- ========================================
-- STORED PROCEDURES: Student Enrollment System
-- ========================================
-- Purpose: Reusable database procedures for common operations
-- Schema: university

SET search_path TO university;

-- ========================================
-- PROCEDURE 1: register_new_student
-- ========================================
-- Register a new student in the system

CREATE OR REPLACE FUNCTION register_new_student(
    p_student_id INTEGER,
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_email VARCHAR(255),
    p_phone VARCHAR(50) DEFAULT NULL,
    p_department_name VARCHAR(100)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_student_id INTEGER
) AS $$
DECLARE
    v_department_id INTEGER;
    v_exists BOOLEAN;
BEGIN
    -- Check if student already exists
    SELECT EXISTS(SELECT 1 FROM students WHERE student_id = p_student_id OR email = p_email)
    INTO v_exists;
    
    IF v_exists THEN
        RETURN QUERY SELECT FALSE, 'Student ID or email already exists', NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get department ID
    SELECT department_id INTO v_department_id
    FROM departments
    WHERE department_name = p_department_name;
    
    IF v_department_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Department not found: ' || p_department_name, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert new student
    INSERT INTO students (student_id, first_name, last_name, email, phone, department_id)
    VALUES (p_student_id, p_first_name, p_last_name, p_email, p_phone, v_department_id);
    
    RETURN QUERY SELECT TRUE, 'Student registered successfully', p_student_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_new_student IS
'Registers a new student with validation checks for duplicates and valid department';

-- Usage example:
-- SELECT * FROM register_new_student(2001, 'John', 'Doe', 'john.doe@university.edu', '555-1234', 'Computer Science');

-- ========================================
-- PROCEDURE 2: enroll_student_in_course
-- ========================================
-- Enroll a student in a course

CREATE OR REPLACE FUNCTION enroll_student_in_course(
    p_student_id INTEGER,
    p_course_code VARCHAR(50),
    p_enrollment_date DATE DEFAULT CURRENT_DATE,
    p_academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_status VARCHAR(20) DEFAULT 'Active'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_enrollment_id INTEGER
) AS $$
DECLARE
    v_course_id INTEGER;
    v_student_exists BOOLEAN;
    v_already_enrolled BOOLEAN;
    v_enrollment_id INTEGER;
BEGIN
    -- Check if student exists
    SELECT EXISTS(SELECT 1 FROM students WHERE student_id = p_student_id)
    INTO v_student_exists;
    
    IF NOT v_student_exists THEN
        RETURN QUERY SELECT FALSE, 'Student not found', NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get course ID
    SELECT course_id INTO v_course_id
    FROM courses
    WHERE course_code = p_course_code;
    
    IF v_course_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Course not found: ' || p_course_code, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Check if already enrolled
    SELECT EXISTS(
        SELECT 1 FROM enrollments 
        WHERE student_id = p_student_id AND course_id = v_course_id
    ) INTO v_already_enrolled;
    
    IF v_already_enrolled THEN
        RETURN QUERY SELECT FALSE, 'Student already enrolled in this course', NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert enrollment
    INSERT INTO enrollments (student_id, course_id, enrollment_date, academic_year, status)
    VALUES (p_student_id, v_course_id, p_enrollment_date, p_academic_year, p_status)
    RETURNING enrollment_id INTO v_enrollment_id;
    
    RETURN QUERY SELECT TRUE, 'Enrollment successful', v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enroll_student_in_course IS
'Enrolls a student in a course with validation checks for existence and duplicate enrollment';

-- Usage example:
-- SELECT * FROM enroll_student_in_course(1001, 'CS101', CURRENT_DATE, 2024, 'Active');

-- ========================================
-- PROCEDURE 3: update_enrollment_status
-- ========================================
-- Update the status of an enrollment

CREATE OR REPLACE FUNCTION update_enrollment_status(
    p_student_id INTEGER,
    p_course_code VARCHAR(50),
    p_new_status VARCHAR(20)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    rows_updated INTEGER
) AS $$
DECLARE
    v_course_id INTEGER;
    v_rows_updated INTEGER;
    v_valid_statuses TEXT[] := ARRAY['Active', 'Inactive', 'Graduated', 'Suspended'];
BEGIN
    -- Validate status
    IF p_new_status != ALL(v_valid_statuses) THEN
        RETURN QUERY SELECT FALSE, 
            'Invalid status. Must be one of: Active, Inactive, Graduated, Suspended', 
            0;
        RETURN;
    END IF;
    
    -- Get course ID
    SELECT course_id INTO v_course_id
    FROM courses
    WHERE course_code = p_course_code;
    
    IF v_course_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Course not found: ' || p_course_code, 0;
        RETURN;
    END IF;
    
    -- Update enrollment
    UPDATE enrollments
    SET status = p_new_status
    WHERE student_id = p_student_id AND course_id = v_course_id;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
        RETURN QUERY SELECT FALSE, 'Enrollment not found', 0;
    ELSE
        RETURN QUERY SELECT TRUE, 'Status updated successfully', v_rows_updated;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_enrollment_status IS
'Updates the status of a student enrollment with validation';

-- Usage example:
-- SELECT * FROM update_enrollment_status(1001, 'CS101', 'Graduated');

-- ========================================
-- PROCEDURE 4: get_student_transcript
-- ========================================
-- Get complete transcript for a student

CREATE OR REPLACE FUNCTION get_student_transcript(p_student_id INTEGER)
RETURNS TABLE(
    student_name TEXT,
    student_email VARCHAR(255),
    department TEXT,
    course_code VARCHAR(50),
    course_department TEXT,
    credits INTEGER,
    enrollment_date DATE,
    status VARCHAR(20),
    academic_year INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.first_name || ' ' || s.last_name AS student_name,
        s.email AS student_email,
        sd.department_name AS department,
        c.course_code,
        cd.department_name AS course_department,
        c.credits,
        e.enrollment_date,
        e.status,
        e.academic_year
    FROM students s
    JOIN departments sd ON s.department_id = sd.department_id
    LEFT JOIN enrollments e ON s.student_id = e.student_id
    LEFT JOIN courses c ON e.course_id = c.course_id
    LEFT JOIN departments cd ON c.department_id = cd.department_id
    WHERE s.student_id = p_student_id
    ORDER BY e.academic_year DESC, e.enrollment_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_transcript IS
'Retrieves complete academic transcript for a student including all enrollments';

-- Usage example:
-- SELECT * FROM get_student_transcript(1001);

-- ========================================
-- PROCEDURE 5: get_enrollment_statistics
-- ========================================
-- Get enrollment statistics for a date range

CREATE OR REPLACE FUNCTION get_enrollment_statistics(
    p_start_date DATE DEFAULT '2024-01-01',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_enrollments BIGINT,
    active_enrollments BIGINT,
    unique_students BIGINT,
    unique_courses BIGINT,
    most_popular_course VARCHAR(50),
    most_popular_department TEXT
) AS $$
DECLARE
    v_most_popular_course VARCHAR(50);
    v_most_popular_dept TEXT;
BEGIN
    -- Get most popular course
    SELECT c.course_code INTO v_most_popular_course
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.enrollment_date BETWEEN p_start_date AND p_end_date
    GROUP BY c.course_code
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Get most popular department
    SELECT d.department_name INTO v_most_popular_dept
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    JOIN departments d ON c.department_id = d.department_id
    WHERE e.enrollment_date BETWEEN p_start_date AND p_end_date
    GROUP BY d.department_name
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Return statistics
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_enrollments,
        COUNT(CASE WHEN e.status = 'Active' THEN 1 END)::BIGINT AS active_enrollments,
        COUNT(DISTINCT e.student_id)::BIGINT AS unique_students,
        COUNT(DISTINCT e.course_id)::BIGINT AS unique_courses,
        v_most_popular_course,
        v_most_popular_dept
    FROM enrollments e
    WHERE e.enrollment_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_enrollment_statistics IS
'Generates enrollment statistics for a given date range';

-- Usage example:
-- SELECT * FROM get_enrollment_statistics('2024-01-01', CURRENT_DATE);

-- ========================================
-- VERIFICATION
-- ========================================
-- List all stored procedures/functions
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'university'
  AND routine_type IN ('FUNCTION', 'PROCEDURE')
ORDER BY routine_name;

-- ========================================
-- NOTES:
-- ========================================
-- All procedures use the university schema
-- Procedures include error handling and validation
-- Return types use TABLE for multiple rows or specific types for single values
-- To drop a procedure: DROP FUNCTION IF EXISTS function_name;
-- ========================================
