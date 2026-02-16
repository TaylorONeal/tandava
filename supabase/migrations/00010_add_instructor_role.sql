-- Migration: Add instructor_role to schedule_rules and class_occurrences
-- Allows studio owners to designate an instructor's role when creating a class
-- or assigning a substitute (e.g., staff_instructor, teacher_in_training).

-- Create the enum type
CREATE TYPE instructor_role AS ENUM ('lead', 'assistant', 'staff_instructor', 'teacher_in_training');

-- Add instructor_role to schedule_rules (recurring class templates)
ALTER TABLE schedule_rules
  ADD COLUMN instructor_role instructor_role NOT NULL DEFAULT 'lead';

-- Add instructor_role to class_occurrences (individual class instances)
ALTER TABLE class_occurrences
  ADD COLUMN instructor_role instructor_role NOT NULL DEFAULT 'lead';

-- Comment on columns for documentation
COMMENT ON COLUMN schedule_rules.instructor_role IS 'Role of the assigned instructor: lead, assistant, staff_instructor, or teacher_in_training';
COMMENT ON COLUMN class_occurrences.instructor_role IS 'Role of the instructor for this occurrence; may differ from schedule_rule when a sub is assigned';
