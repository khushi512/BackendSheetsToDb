-- =========================
-- SCHEMA: Student Enrollment System
-- =========================

-- Optional: keep everything organized
CREATE SCHEMA IF NOT EXISTS university;
SET search_path TO university;

-- =========================
-- TABLE: departments
-- =========================
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- TABLE: students
-- =========================
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON DELETE SET NULL
);

-- =========================
-- TABLE: courses
-- =========================
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    department_id INTEGER NOT NULL,
    credits INTEGER,

    CONSTRAINT fk_course_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON DELETE CASCADE
);

-- =========================
-- TABLE: enrollments
-- =========================
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date DATE,
    academic_year INTEGER,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_course
        UNIQUE (student_id, course_id),

    CONSTRAINT chk_enrollment_status
        CHECK (status IN ('Active', 'Inactive', 'Graduated', 'Suspended'))
);

-- =========================
-- INDEXES (Performance)
-- =========================
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_department ON students(department_id);

CREATE INDEX idx_courses_department ON courses(department_id);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
