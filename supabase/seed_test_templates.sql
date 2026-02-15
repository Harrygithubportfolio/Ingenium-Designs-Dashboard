-- ============================================
-- TEST SEED DATA — Run AFTER migration_001
-- Run this in the Supabase SQL Editor (data project)
-- ============================================

-- ==================
-- 1. PUSH DAY (Hypertrophy)
-- ==================
WITH push AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Push Day', 'hypertrophy', 'Chest, shoulders, and triceps — hypertrophy focus')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM push), 'Flat Barbell Bench Press', 0, 4, 8, 80),
  ((SELECT id FROM push), 'Incline Dumbbell Press', 1, 3, 10, 30),
  ((SELECT id FROM push), 'Overhead Press', 2, 3, 10, 40),
  ((SELECT id FROM push), 'Lateral Raises', 3, 3, 15, 10),
  ((SELECT id FROM push), 'Tricep Rope Pushdown', 4, 3, 12, 25),
  ((SELECT id FROM push), 'Overhead Tricep Extension', 5, 3, 12, 20);

-- ==================
-- 2. PULL DAY (Hypertrophy)
-- ==================
WITH pull AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Pull Day', 'hypertrophy', 'Back and biceps — width and thickness')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM pull), 'Deadlift', 0, 4, 5, 120),
  ((SELECT id FROM pull), 'Weighted Pull-Ups', 1, 4, 8, 10),
  ((SELECT id FROM pull), 'Barbell Row', 2, 3, 10, 70),
  ((SELECT id FROM pull), 'Face Pulls', 3, 3, 15, 15),
  ((SELECT id FROM pull), 'Dumbbell Bicep Curls', 4, 3, 12, 14),
  ((SELECT id FROM pull), 'Hammer Curls', 5, 3, 12, 12);

-- ==================
-- 3. LEG DAY (Strength)
-- ==================
WITH legs AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Leg Day', 'strength', 'Heavy compounds for quad and posterior chain strength')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM legs), 'Back Squat', 0, 5, 5, 100),
  ((SELECT id FROM legs), 'Romanian Deadlift', 1, 4, 8, 80),
  ((SELECT id FROM legs), 'Leg Press', 2, 3, 10, 180),
  ((SELECT id FROM legs), 'Walking Lunges', 3, 3, 12, 20),
  ((SELECT id FROM legs), 'Leg Curl', 4, 3, 12, 40),
  ((SELECT id FROM legs), 'Calf Raises', 5, 4, 15, 60);

-- ==================
-- 4. UPPER BODY STRENGTH
-- ==================
WITH upper AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Upper Body Strength', 'strength', 'Heavy upper body compounds — low rep, high intensity')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM upper), 'Flat Barbell Bench Press', 0, 5, 3, 90),
  ((SELECT id FROM upper), 'Weighted Pull-Ups', 1, 5, 3, 20),
  ((SELECT id FROM upper), 'Overhead Press', 2, 4, 5, 50),
  ((SELECT id FROM upper), 'Barbell Row', 3, 4, 5, 80),
  ((SELECT id FROM upper), 'Weighted Dips', 4, 3, 6, 20);

-- ==================
-- 5. FULL BODY CONDITIONING
-- ==================
WITH conditioning AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Full Body Conditioning', 'conditioning', 'Circuit-style — keep rest times short, moderate weight')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM conditioning), 'Kettlebell Swings', 0, 4, 20, 24),
  ((SELECT id FROM conditioning), 'Thrusters', 1, 3, 12, 30),
  ((SELECT id FROM conditioning), 'Box Jumps', 2, 3, 15, NULL),
  ((SELECT id FROM conditioning), 'Battle Ropes', 3, 3, 30, NULL),
  ((SELECT id FROM conditioning), 'Burpees', 4, 3, 15, NULL),
  ((SELECT id FROM conditioning), 'Farmers Walk', 5, 3, 1, 32);

-- ==================
-- 6. ACTIVE RECOVERY
-- ==================
WITH recovery AS (
  INSERT INTO workout_templates (user_id, name, training_intent, description)
  VALUES ('harry', 'Active Recovery', 'recovery', 'Light movement and stretching — blood flow and mobility')
  RETURNING id
)
INSERT INTO template_exercises (template_id, exercise_name, sort_order, target_sets, target_reps, target_load_kg) VALUES
  ((SELECT id FROM recovery), 'Foam Rolling', 0, 1, 1, NULL),
  ((SELECT id FROM recovery), 'Band Pull-Aparts', 1, 3, 20, NULL),
  ((SELECT id FROM recovery), 'Goblet Squat (light)', 2, 2, 15, 12),
  ((SELECT id FROM recovery), 'Dead Hangs', 3, 3, 1, NULL),
  ((SELECT id FROM recovery), 'Hip 90/90 Stretch', 4, 2, 10, NULL);
