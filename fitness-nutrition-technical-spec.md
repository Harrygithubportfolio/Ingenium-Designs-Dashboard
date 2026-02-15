# FITNESS & NUTRITION SYSTEM — COMPLETE TECHNICAL SPECIFICATION

> Generated from `fitness&nutrition-handover.md`
> For: Ingenium Designs Dashboard (Life OS)
> Stack: Next.js 16 / React 19 / Supabase / Zustand / Tailwind 4

---

## TABLE OF CONTENTS

- [A. DATA MODELS](#a-data-models)
- [B. STATE MACHINES](#b-state-machines)
- [C. API DESIGN](#c-api-design)
- [D. NEXT.JS ARCHITECTURE](#d-nextjs-architecture)
- [E. UI WIREFRAMES](#e-ui-wireframes-text-based)
- [F. IMPLEMENTATION NOTES](#f-implementation-notes)
- [G. IMPLEMENTATION ROADMAP](#g-implementation-roadmap)

---

# A. DATA MODELS

All schemas target Postgres via Supabase. UUIDs used for all primary keys. All tables include RLS policies scoped to `auth.uid()`.

## Enums

```sql
-- Fitness Enums
CREATE TYPE training_intent AS ENUM (
  'strength',
  'hypertrophy',
  'recovery',
  'conditioning'
);

CREATE TYPE scheduled_workout_status AS ENUM (
  'scheduled',
  'completed',
  'missed',
  'rescheduled'
);

CREATE TYPE gym_mode_status AS ENUM (
  'active',
  'paused',
  'completed',
  'abandoned'
);

CREATE TYPE session_rating AS ENUM (
  'strong',
  'normal',
  'off'
);

-- Nutrition Enums
CREATE TYPE intake_method AS ENUM (
  'photo',
  'manual'
);

CREATE TYPE meal_type AS ENUM (
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'evening_snack',
  'other'
);

CREATE TYPE hunger_level AS ENUM (
  'not_hungry',
  'slightly_hungry',
  'hungry',
  'very_hungry',
  'starving'
);

-- Shared Enums
CREATE TYPE day_type AS ENUM (
  'training',
  'rest',
  'active_recovery'
);
```

## 1. Workout Templates (Planning Layer)

```sql
CREATE TABLE workout_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  training_intent training_intent NOT NULL,
  description     TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT workout_templates_name_user_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_workout_templates_user ON workout_templates(user_id);
```

## 2. Template Exercises (Planning Layer)

```sql
CREATE TABLE template_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_name   TEXT NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  target_sets     SMALLINT NOT NULL,
  target_reps     SMALLINT NOT NULL,
  target_load_kg  NUMERIC(6,2),           -- optional
  target_rpe      NUMERIC(3,1),           -- optional, 1.0-10.0
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT template_exercises_rpe_range CHECK (target_rpe IS NULL OR (target_rpe >= 1.0 AND target_rpe <= 10.0))
);

CREATE INDEX idx_template_exercises_template ON template_exercises(template_id, sort_order);
```

## 3. Scheduled Workouts (Commitment Layer)

```sql
CREATE TABLE scheduled_workouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id         UUID NOT NULL REFERENCES workout_templates(id) ON DELETE RESTRICT,
  scheduled_date      DATE NOT NULL,
  status              scheduled_workout_status NOT NULL DEFAULT 'scheduled',
  rescheduled_to      DATE,                   -- populated when status = 'rescheduled'
  rescheduled_from_id UUID REFERENCES scheduled_workouts(id), -- links rescheduled chain
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT scheduled_workouts_reschedule_check
    CHECK (
      (status = 'rescheduled' AND rescheduled_to IS NOT NULL)
      OR (status != 'rescheduled')
    )
);

CREATE INDEX idx_scheduled_workouts_user_date ON scheduled_workouts(user_id, scheduled_date);
CREATE INDEX idx_scheduled_workouts_status ON scheduled_workouts(status);
```

## 4. Gym Sessions (Execution Layer — Session Container)

```sql
CREATE TABLE gym_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_workout_id  UUID REFERENCES scheduled_workouts(id) ON DELETE SET NULL,
  template_id           UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  status                gym_mode_status NOT NULL DEFAULT 'active',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ,
  total_duration_sec    INTEGER,            -- computed on end
  total_volume_kg       NUMERIC(10,2),      -- computed on end
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT gym_sessions_end_check
    CHECK (
      (status IN ('completed', 'abandoned') AND ended_at IS NOT NULL)
      OR (status IN ('active', 'paused'))
    )
);

CREATE INDEX idx_gym_sessions_user ON gym_sessions(user_id, started_at DESC);
CREATE INDEX idx_gym_sessions_scheduled ON gym_sessions(scheduled_workout_id);
```

## 5. Execution Exercises (Execution Layer — Per-Exercise)

```sql
CREATE TABLE execution_exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_session_id        UUID NOT NULL REFERENCES gym_sessions(id) ON DELETE CASCADE,
  template_exercise_id  UUID REFERENCES template_exercises(id) ON DELETE SET NULL, -- null if ad-hoc
  exercise_name         TEXT NOT NULL,
  sort_order            SMALLINT NOT NULL DEFAULT 0,
  was_skipped           BOOLEAN NOT NULL DEFAULT false,
  is_additional         BOOLEAN NOT NULL DEFAULT false,  -- true if not in original template
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_exercises_session ON execution_exercises(gym_session_id, sort_order);
```

## 6. Execution Sets (Execution Layer — Per-Set)

```sql
CREATE TABLE execution_sets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_exercise_id   UUID NOT NULL REFERENCES execution_exercises(id) ON DELETE CASCADE,
  set_number              SMALLINT NOT NULL,
  actual_weight_kg        NUMERIC(6,2) NOT NULL,
  actual_reps             SMALLINT NOT NULL,
  notes                   TEXT,
  logged_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT execution_sets_positive CHECK (actual_weight_kg >= 0 AND actual_reps > 0)
);

CREATE INDEX idx_execution_sets_exercise ON execution_sets(execution_exercise_id, set_number);
```

## 7. Workout Reflections (Reflection Layer)

```sql
CREATE TABLE workout_reflections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_session_id    UUID NOT NULL UNIQUE REFERENCES gym_sessions(id) ON DELETE CASCADE,
  session_rating    session_rating,
  reflection_note   TEXT,

  -- System-computed fields (populated automatically)
  planned_volume_kg NUMERIC(10,2),
  executed_volume_kg NUMERIC(10,2),
  volume_delta_pct  NUMERIC(5,2),         -- percentage change
  personal_records  JSONB DEFAULT '[]',   -- [{exercise, metric, value, previous_value}]
  missed_targets    JSONB DEFAULT '[]',   -- [{exercise, target_sets, actual_sets, ...}]

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_reflections_user ON workout_reflections(user_id, created_at DESC);
```

## 8. Intake Events (Nutrition — Reality Layer)

```sql
CREATE TABLE intake_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intake_method     intake_method NOT NULL,
  meal_type         meal_type NOT NULL DEFAULT 'other',
  event_timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url         TEXT,                              -- S3/Supabase storage URL
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intake_events_user_date ON intake_events(user_id, event_timestamp DESC);
```

## 9. Intake Items (Nutrition — Per-Food-Item)

```sql
CREATE TABLE intake_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_event_id       UUID NOT NULL REFERENCES intake_events(id) ON DELETE CASCADE,
  food_name             TEXT NOT NULL,
  portion_description   TEXT,                -- "1 cup", "200g", "1 medium"
  portion_grams         NUMERIC(7,2),

  -- Original AI/system estimates (NEVER modified)
  estimated_calories    NUMERIC(7,2),
  estimated_protein_g   NUMERIC(6,2),
  estimated_carbs_g     NUMERIC(6,2),
  estimated_fat_g       NUMERIC(6,2),
  confidence_score      NUMERIC(3,2),        -- 0.00 to 1.00

  -- User-edited values (null if unedited)
  edited_calories       NUMERIC(7,2),
  edited_protein_g      NUMERIC(6,2),
  edited_carbs_g        NUMERIC(6,2),
  edited_fat_g          NUMERIC(6,2),
  edited_portion_grams  NUMERIC(7,2),
  was_edited            BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT intake_items_confidence_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

CREATE INDEX idx_intake_items_event ON intake_items(intake_event_id);
```

### Computed Macro Access (View)

```sql
CREATE VIEW intake_items_effective AS
SELECT
  id,
  intake_event_id,
  food_name,
  COALESCE(edited_calories,    estimated_calories)    AS calories,
  COALESCE(edited_protein_g,   estimated_protein_g)   AS protein_g,
  COALESCE(edited_carbs_g,     estimated_carbs_g)     AS carbs_g,
  COALESCE(edited_fat_g,       estimated_fat_g)       AS fat_g,
  COALESCE(edited_portion_grams, portion_grams)       AS portion_grams,
  was_edited,
  confidence_score,
  estimated_calories    AS original_calories,
  estimated_protein_g   AS original_protein_g,
  estimated_carbs_g     AS original_carbs_g,
  estimated_fat_g       AS original_fat_g
FROM intake_items;
```

## 10. Daily Nutrition Targets (Intent Layer)

```sql
CREATE TABLE daily_nutrition_targets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date       DATE NOT NULL,
  day_type          day_type NOT NULL DEFAULT 'rest',

  target_calories   NUMERIC(7,2) NOT NULL,
  target_protein_g  NUMERIC(6,2) NOT NULL,
  target_carbs_g    NUMERIC(6,2) NOT NULL,
  target_fat_g      NUMERIC(6,2) NOT NULL,

  source            TEXT NOT NULL DEFAULT 'manual',    -- 'manual', 'ai_suggested', 'rule_based'
  ai_reasoning      TEXT,                              -- why AI suggested these targets
  is_accepted       BOOLEAN NOT NULL DEFAULT true,     -- user can reject AI suggestion

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT daily_nutrition_targets_unique UNIQUE (user_id, target_date)
);

CREATE INDEX idx_daily_nutrition_targets_user_date ON daily_nutrition_targets(user_id, target_date);
```

## 11. Nutrition Reflections (End-of-Day)

```sql
CREATE TABLE nutrition_reflections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_date     DATE NOT NULL,

  -- System-computed
  total_calories      NUMERIC(7,2),
  total_protein_g     NUMERIC(6,2),
  total_carbs_g       NUMERIC(6,2),
  total_fat_g         NUMERIC(6,2),
  adherence_score     NUMERIC(5,2),          -- percentage 0-100
  largest_deviation   TEXT,                   -- e.g., "protein low by 30g"
  macro_distribution  JSONB,                 -- {protein_pct, carbs_pct, fat_pct}
  ai_summary          TEXT,                  -- AI-generated summary

  -- User inputs
  reflection_note     TEXT,
  hunger_level        hunger_level,
  social_eating_flag  BOOLEAN DEFAULT false,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT nutrition_reflections_unique UNIQUE (user_id, reflection_date)
);

CREATE INDEX idx_nutrition_reflections_user ON nutrition_reflections(user_id, reflection_date DESC);
```

## 12. AI Insights (Shared — Fitness & Nutrition)

```sql
CREATE TYPE insight_domain AS ENUM ('fitness', 'nutrition', 'cross_domain');
CREATE TYPE insight_type AS ENUM (
  'trend',
  'pattern',
  'suggestion',
  'correlation',
  'alert'
);

CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain          insight_domain NOT NULL,
  insight_type    insight_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data_references JSONB,                    -- links to source data points
  is_dismissed    BOOLEAN NOT NULL DEFAULT false,
  is_actioned     BOOLEAN NOT NULL DEFAULT false,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_insights_body_not_empty CHECK (length(body) > 0)
);

CREATE INDEX idx_ai_insights_user ON ai_insights(user_id, generated_at DESC);
CREATE INDEX idx_ai_insights_domain ON ai_insights(domain);
```

## Entity Relationship Diagram (Text)

```
workout_templates ──1:N──> template_exercises
       │
       │ (referenced by)
       ▼
scheduled_workouts ──1:1──> gym_sessions
                                  │
                                  ├──1:N──> execution_exercises ──1:N──> execution_sets
                                  │
                                  └──1:1──> workout_reflections

intake_events ──1:N──> intake_items
                          │
                          └──(view)──> intake_items_effective

daily_nutrition_targets (per user per day)
nutrition_reflections   (per user per day)

ai_insights (cross-cutting, references multiple domains)
```

## Row-Level Security Policies

```sql
-- Apply to ALL tables above (example for workout_templates, repeat pattern for each)
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON workout_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON workout_templates FOR DELETE
  USING (auth.uid() = user_id);
```

---

# B. STATE MACHINES

## 1. Fitness Workflow State Machine

```
                    ┌─────────────────────────────────────────┐
                    │           TEMPLATE MANAGEMENT            │
                    │                                         │
                    │  [idle] ──create──> [editing]           │
                    │    ▲                    │                │
                    │    └───save/cancel──────┘                │
                    │         │                                │
                    │      [saved] ◄── archived/unarchived     │
                    └─────────┬───────────────────────────────┘
                              │
                              │ schedule(template, date)
                              ▼
                    ┌─────────────────────────────────────────┐
                    │          SCHEDULING LAYER                │
                    │                                         │
                    │  [scheduled]                             │
                    │      │         │          │              │
                    │   start     reschedule   day_passes      │
                    │      │         │          │              │
                    │      ▼         ▼          ▼              │
                    │  [executing] [rescheduled] [missed]      │
                    │                   │                      │
                    │                   └──> new [scheduled]   │
                    └─────────┬───────────────────────────────┘
                              │
                              │ activate gym mode
                              ▼
                    ┌─────────────────────────────────────────┐
                    │           GYM MODE (EXECUTION)           │
                    │                                         │
                    │  [active]                                │
                    │      │        │                          │
                    │   pause    complete                      │
                    │      │        │                          │
                    │      ▼        │                          │
                    │  [paused]     │                          │
                    │      │        │                          │
                    │   resume      │                          │
                    │      │        │                          │
                    │      └──>─────┤                          │
                    │               │        abandon           │
                    │               ▼           │              │
                    │         [completed]  [abandoned]          │
                    └─────────┬─────────────┬─────────────────┘
                              │             │
                              │ auto-trigger │ (optional)
                              ▼             ▼
                    ┌─────────────────────────────────────────┐
                    │         POST-WORKOUT REFLECTION           │
                    │                                         │
                    │  [auto_generated]                        │
                    │      │                                   │
                    │   user_input (rating + note)             │
                    │      │                                   │
                    │      ▼                                   │
                    │  [finalized]                              │
                    └─────────────────────────────────────────┘
```

### State Transition Table — Scheduled Workouts

| Current State   | Event              | Next State    | Side Effects                          |
|-----------------|--------------------|---------------|---------------------------------------|
| `scheduled`     | `start_workout`    | `completed`*  | Create gym_session, mark executing    |
| `scheduled`     | `reschedule(date)` | `rescheduled` | Create new scheduled_workout at date  |
| `scheduled`     | `day_passes`       | `missed`      | Cron/trigger: mark missed if not done |
| `rescheduled`   | —                  | terminal      | Immutable once rescheduled            |
| `missed`        | —                  | terminal      | Immutable, recorded for analytics     |
| `completed`     | —                  | terminal      | Immutable, linked to gym_session      |

*Status set to `completed` once linked gym_session finishes.

### State Transition Table — Gym Session

| Current State | Event     | Next State  | Side Effects                                  |
|---------------|-----------|-------------|-----------------------------------------------|
| `active`      | `pause`   | `paused`    | Pause timer                                   |
| `active`      | `complete`| `completed` | Set ended_at, compute totals, trigger reflect |
| `active`      | `abandon` | `abandoned` | Set ended_at, preserve partial data           |
| `paused`      | `resume`  | `active`    | Resume timer                                  |
| `paused`      | `complete`| `completed` | Set ended_at, compute totals, trigger reflect |
| `paused`      | `abandon` | `abandoned` | Set ended_at, preserve partial data           |
| `completed`   | —         | terminal    | Immutable                                     |
| `abandoned`   | —         | terminal    | Immutable                                     |

## 2. Nutrition Workflow State Machine

```
                    ┌─────────────────────────────────────────┐
                    │         INTAKE EVENT CREATION             │
                    │                                         │
                    │  [selecting_method]                      │
                    │      │              │                    │
                    │   photo          manual                  │
                    │      │              │                    │
                    │      ▼              ▼                    │
                    │  [capturing]   [manual_entry]            │
                    │      │              │                    │
                    │   analyze        validate                │
                    │      │              │                    │
                    │      ▼              │                    │
                    │  [reviewing_ai]     │                    │
                    │      │              │                    │
                    │   confirm/edit      │                    │
                    │      │              │                    │
                    │      └──────┬───────┘                    │
                    │             ▼                            │
                    │         [logged]                          │
                    │             │                            │
                    │          edit                             │
                    │             │                            │
                    │             ▼                            │
                    │         [edited] (was_edited = true)      │
                    └─────────────┬───────────────────────────┘
                                  │
                                  │ feeds into (real-time)
                                  ▼
                    ┌─────────────────────────────────────────┐
                    │          DAILY SUMMARY (LIVE)             │
                    │                                         │
                    │  Macro pie chart updates in real-time    │
                    │  Calorie progress ring updates           │
                    │  Remaining distribution recalculates     │
                    └─────────────┬───────────────────────────┘
                                  │
                                  │ end-of-day trigger
                                  ▼
                    ┌─────────────────────────────────────────┐
                    │        NUTRITION REFLECTION               │
                    │                                         │
                    │  [auto_generated]                        │
                    │      │                                   │
                    │   user_input (note, hunger, social)      │
                    │      │                                   │
                    │      ▼                                   │
                    │  [finalized]                              │
                    └─────────────────────────────────────────┘
```

## 3. UI State Machines

### Dashboard UI States

```
[loading] ──data_ready──> [dashboard_idle]
                              │
              ┌───────────────┼──────────────────┐
              │               │                  │
         click_fitness   click_nutrition    click_calendar
              │               │                  │
              ▼               ▼                  ▼
        [fitness_view]  [nutrition_view]   [calendar_view]
              │
         start_gym_mode
              │
              ▼
        [gym_mode_fullscreen]  ◄── This replaces ENTIRE UI
              │
         complete/abandon
              │
              ▼
        [reflection_overlay]
              │
         submit/dismiss
              │
              ▼
        [dashboard_idle]
```

### Gym Mode UI States (Internal)

```
[entering]
    │
    ▼
[exercise_display]
    │
    ├── log_set ──> [set_logging] ──save──> [exercise_display]
    │
    ├── next_exercise ──> [exercise_display] (next)
    │
    ├── prev_exercise ──> [exercise_display] (prev)
    │
    ├── skip_exercise ──> [exercise_display] (next, mark skipped)
    │
    ├── add_exercise ──> [add_exercise_form] ──save──> [exercise_display]
    │
    ├── pause ──> [paused_overlay]
    │                 │
    │              resume ──> [exercise_display]
    │
    ├── complete ──> [session_summary] ──confirm──> [reflection_prompt]
    │
    └── abandon ──> [abandon_confirm] ──yes──> [reflection_prompt]
                                       ──no──> [exercise_display]
```

### Nutrition Logging UI States

```
[method_select]
    │                │
    photo           manual
    │                │
    ▼                ▼
[camera/upload]  [food_search]
    │                │
    ▼                ▼
[ai_analysis]    [portion_input]
    │                │
    ▼                │
[review_items]       │
    │                │
    └──────┬─────────┘
           ▼
    [confirm_save]
           │
           ▼
    [saved_feedback] ──auto──> [method_select]
```

---

# C. API DESIGN

All endpoints are under `/api/fitness/` and `/api/nutrition/`. Authentication via Supabase JWT in headers. All responses follow:

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string } }
```

## Fitness Endpoints

### Templates

#### `GET /api/fitness/templates`
List all workout templates for the authenticated user.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?archived=true/false` (default: false)            |
| **Output**  | `Template[]` with nested `exercises[]`                    |
| **Validation** | Auth required                                          |

```typescript
// Response
type TemplateListResponse = {
  data: {
    id: string;
    name: string;
    training_intent: TrainingIntent;
    description: string | null;
    is_archived: boolean;
    exercises: {
      id: string;
      exercise_name: string;
      sort_order: number;
      target_sets: number;
      target_reps: number;
      target_load_kg: number | null;
      target_rpe: number | null;
      notes: string | null;
    }[];
    created_at: string;
    updated_at: string;
  }[];
};
```

#### `POST /api/fitness/templates`
Create a new workout template with exercises.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `CreateTemplateInput`                               |
| **Output**  | Created `Template` with exercises                         |
| **Validation** | `name` required (max 100 chars), `training_intent` must be valid enum, `exercises` array min 1 |

```typescript
type CreateTemplateInput = {
  name: string;
  training_intent: TrainingIntent;
  description?: string;
  exercises: {
    exercise_name: string;
    sort_order: number;
    target_sets: number;        // min: 1
    target_reps: number;        // min: 1
    target_load_kg?: number;    // min: 0
    target_rpe?: number;        // 1.0-10.0
    notes?: string;
  }[];
};
```

#### `PUT /api/fitness/templates/:id`
Update a template and its exercises (full replace on exercises array).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: Same as `CreateTemplateInput`                       |
| **Output**  | Updated `Template` with exercises                         |
| **Validation** | Template must belong to user, cannot edit if active gym session uses it |

#### `DELETE /api/fitness/templates/:id`
Soft-delete (archive) a template.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Path: `id`                                                |
| **Output**  | `{ archived: true }`                                      |
| **Validation** | Cannot delete if scheduled workouts reference it (set `is_archived` instead) |

### Scheduling

#### `GET /api/fitness/schedule`
Get scheduled workouts for a date range.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?from=YYYY-MM-DD&to=YYYY-MM-DD`                  |
| **Output**  | `ScheduledWorkout[]` with template name                   |
| **Validation** | `from` required, `to` defaults to `from + 7 days`     |

```typescript
type ScheduledWorkoutResponse = {
  id: string;
  template_id: string;
  template_name: string;
  training_intent: TrainingIntent;
  scheduled_date: string;
  status: ScheduledWorkoutStatus;
  rescheduled_to: string | null;
};
```

#### `POST /api/fitness/schedule`
Schedule a workout from a template.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ template_id: string, scheduled_date: string }`   |
| **Output**  | Created `ScheduledWorkout`                                |
| **Validation** | `template_id` must exist, `scheduled_date` must be today or future, no duplicate template on same date |

#### `PATCH /api/fitness/schedule/:id/reschedule`
Reschedule a workout to a new date.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ new_date: string }`                              |
| **Output**  | Updated original + new `ScheduledWorkout`                 |
| **Validation** | Status must be `scheduled`, `new_date` must be today or future |

### Gym Sessions (Execution)

#### `POST /api/fitness/gym-sessions`
Start a new gym session (activate Gym Mode).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ scheduled_workout_id?: string }`                 |
| **Output**  | Created `GymSession` with pre-loaded exercises from template |
| **Validation** | Only one active session per user at a time, scheduled workout must be status `scheduled` |

```typescript
type GymSessionResponse = {
  id: string;
  status: GymModeStatus;
  started_at: string;
  template_name: string | null;
  exercises: {
    id: string;
    exercise_name: string;
    sort_order: number;
    template_exercise_id: string | null;
    target_sets: number;
    target_reps: number;
    target_load_kg: number | null;
    sets: ExecutionSet[];
    was_skipped: boolean;
    is_additional: boolean;
  }[];
};
```

#### `GET /api/fitness/gym-sessions/active`
Get the currently active gym session (if any).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Output**  | `GymSession | null`                                       |

#### `POST /api/fitness/gym-sessions/:id/sets`
Log a set during an active session.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ execution_exercise_id: string, actual_weight_kg: number, actual_reps: number, notes?: string }` |
| **Output**  | Created `ExecutionSet`                                    |
| **Validation** | Session must be `active`, weight >= 0, reps >= 1       |

#### `POST /api/fitness/gym-sessions/:id/exercises`
Add an ad-hoc exercise to the session.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ exercise_name: string }`                         |
| **Output**  | Created `ExecutionExercise` with `is_additional: true`    |
| **Validation** | Session must be `active`                               |

#### `PATCH /api/fitness/gym-sessions/:id/skip-exercise`
Skip an exercise.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ execution_exercise_id: string }`                 |
| **Output**  | Updated `ExecutionExercise` with `was_skipped: true`      |
| **Validation** | Session must be `active`                               |

#### `PATCH /api/fitness/gym-sessions/:id/status`
Change session status (pause / resume / complete / abandon).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ status: 'paused' | 'active' | 'completed' | 'abandoned' }` |
| **Output**  | Updated `GymSession`                                      |
| **Validation** | Valid transition only (see state machine), on `completed`: compute totals + trigger reflection |

### Reflections (Workout)

#### `GET /api/fitness/reflections/:gym_session_id`
Get the auto-generated reflection for a session.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Output**  | `WorkoutReflection` with computed metrics                 |

#### `PATCH /api/fitness/reflections/:gym_session_id`
Add user input to a reflection.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ session_rating?: SessionRating, reflection_note?: string }` |
| **Output**  | Updated `WorkoutReflection`                               |

### History & Progress

#### `GET /api/fitness/history`
Get workout history with filters.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?from=YYYY-MM-DD&to=YYYY-MM-DD&exercise=string`  |
| **Output**  | `GymSession[]` with exercises, sets, and reflections      |

#### `GET /api/fitness/progress/:exercise_name`
Get progress data for a specific exercise.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Output**  | `{ dates: string[], max_weight: number[], total_volume: number[], estimated_1rm: number[] }` |

---

## Nutrition Endpoints

### Intake Events

#### `GET /api/nutrition/intake`
Get intake events for a date.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?date=YYYY-MM-DD` (defaults to today)            |
| **Output**  | `IntakeEvent[]` with nested `items[]` (using effective values) |

```typescript
type IntakeEventResponse = {
  id: string;
  intake_method: IntakeMethod;
  meal_type: MealType;
  event_timestamp: string;
  photo_url: string | null;
  items: {
    id: string;
    food_name: string;
    portion_description: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    confidence_score: number | null;
    was_edited: boolean;
    // Originals included when was_edited = true
    original_calories?: number;
    original_protein_g?: number;
    original_carbs_g?: number;
    original_fat_g?: number;
  }[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
};
```

#### `POST /api/nutrition/intake/photo`
Create an intake event via photo analysis.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | FormData: `photo` (image file), `meal_type` (string)      |
| **Output**  | Created `IntakeEvent` with AI-estimated items             |
| **Flow**    | Upload image → Supabase Storage → AI analysis → Create event + items |
| **Validation** | Image required, max 10MB, formats: jpg/png/webp/heic   |

#### `POST /api/nutrition/intake/manual`
Create an intake event via manual entry.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `ManualIntakeInput`                                 |
| **Output**  | Created `IntakeEvent` with items                          |

```typescript
type ManualIntakeInput = {
  meal_type: MealType;
  items: {
    food_name: string;
    portion_description?: string;
    portion_grams?: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
  notes?: string;
};
```

#### `PATCH /api/nutrition/intake/:event_id/items/:item_id`
Edit a specific food item (preserves original estimates).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ calories?: number, protein_g?: number, carbs_g?: number, fat_g?: number, portion_grams?: number }` |
| **Output**  | Updated `IntakeItem` (sets `was_edited: true`, populates `edited_*` fields) |
| **Validation** | Original `estimated_*` fields are NEVER modified       |

#### `DELETE /api/nutrition/intake/:event_id`
Delete an intake event and all its items.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Validation** | Event must belong to user                              |

### Daily Targets

#### `GET /api/nutrition/targets`
Get daily targets for a date.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?date=YYYY-MM-DD` (defaults to today)            |
| **Output**  | `DailyNutritionTarget`                                    |

#### `PUT /api/nutrition/targets`
Set or update daily targets.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ target_date: string, day_type: DayType, target_calories: number, target_protein_g: number, target_carbs_g: number, target_fat_g: number }` |
| **Output**  | Upserted `DailyNutritionTarget`                           |
| **Validation** | All macro targets must be >= 0                         |

### Daily Summary (Live)

#### `GET /api/nutrition/summary`
Get real-time daily nutrition summary.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?date=YYYY-MM-DD`                                |
| **Output**  | `DailySummary`                                            |

```typescript
type DailySummary = {
  date: string;
  targets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  consumed: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  remaining: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  meal_count: number;
  macro_distribution: {
    protein_pct: number;
    carbs_pct: number;
    fat_pct: number;
  };
};
```

### Reflections (Nutrition)

#### `GET /api/nutrition/reflections/:date`
Get nutrition reflection for a date.

#### `POST /api/nutrition/reflections`
Generate and save end-of-day reflection.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ date: string, reflection_note?: string, hunger_level?: HungerLevel, social_eating_flag?: boolean }` |
| **Output**  | Created/updated `NutritionReflection` with computed fields |
| **Flow**    | Aggregate day's intake → compute adherence → generate AI summary → save |

---

## AI Insights Endpoints

#### `GET /api/insights`
Get AI insights for the user.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Query: `?domain=fitness|nutrition|cross_domain&limit=10`  |
| **Output**  | `AiInsight[]`                                             |

#### `POST /api/insights/generate`
Trigger insight generation (manual or scheduled).

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ domain: InsightDomain, date_range?: { from: string, to: string } }` |
| **Output**  | Generated `AiInsight[]`                                   |

#### `PATCH /api/insights/:id`
Dismiss or mark insight as actioned.

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| **Input**   | Body: `{ is_dismissed?: boolean, is_actioned?: boolean }`  |

---

# D. NEXT.JS ARCHITECTURE

## Folder Structure

```
src/
├── app/
│   ├── (dashboard)/                          # Existing route group
│   │   ├── layout.tsx                        # DashboardLayout (existing)
│   │   ├── page.tsx                          # Home dashboard (existing)
│   │   │
│   │   ├── fitness/                          # FITNESS SECTION
│   │   │   ├── page.tsx                      # Fitness hub — today's session + quick actions
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx                  # Template list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx              # Template detail/edit
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx                  # Weekly/monthly schedule view
│   │   │   ├── history/
│   │   │   │   ├── page.tsx                  # Workout history list
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx              # Session detail + reflection
│   │   │   └── progress/
│   │   │       └── page.tsx                  # Exercise progress charts
│   │   │
│   │   ├── nutrition/                        # NUTRITION SECTION
│   │   │   ├── page.tsx                      # Nutrition hub — daily summary + log button
│   │   │   ├── log/
│   │   │   │   └── page.tsx                  # Intake logging (photo + manual)
│   │   │   ├── targets/
│   │   │   │   └── page.tsx                  # Daily target configuration
│   │   │   └── history/
│   │   │       └── page.tsx                  # Nutrition history browser
│   │   │
│   │   └── insights/                         # AI INSIGHTS (cross-domain)
│   │       └── page.tsx                      # Insights feed
│   │
│   ├── gym-mode/                             # FULL-SCREEN GYM MODE (outside dashboard group!)
│   │   ├── layout.tsx                        # Bare layout — NO sidebar, NO topbar, NO nav
│   │   ├── page.tsx                          # Gym mode entry + session screen
│   │   └── components/
│   │       ├── GymModeShell.tsx              # Full-screen container + dark theme
│   │       ├── ExerciseDisplay.tsx           # Single exercise view with large targets
│   │       ├── SetLogger.tsx                 # Weight + reps input (large touch targets)
│   │       ├── ExerciseNavigator.tsx         # Prev/next/skip controls
│   │       ├── AddExerciseForm.tsx           # Ad-hoc exercise addition
│   │       ├── SessionTimer.tsx              # Running timer display
│   │       ├── SessionSummary.tsx            # End-of-session comparison
│   │       ├── ReflectionPrompt.tsx          # Post-workout rating + note
│   │       └── PauseOverlay.tsx              # Pause state overlay
│   │
│   ├── api/
│   │   ├── fitness/
│   │   │   ├── templates/
│   │   │   │   └── route.ts                  # GET (list), POST (create)
│   │   │   ├── templates/[id]/
│   │   │   │   └── route.ts                  # PUT (update), DELETE (archive)
│   │   │   ├── schedule/
│   │   │   │   └── route.ts                  # GET (list), POST (create)
│   │   │   ├── schedule/[id]/reschedule/
│   │   │   │   └── route.ts                  # PATCH
│   │   │   ├── gym-sessions/
│   │   │   │   └── route.ts                  # POST (start)
│   │   │   ├── gym-sessions/active/
│   │   │   │   └── route.ts                  # GET
│   │   │   ├── gym-sessions/[id]/sets/
│   │   │   │   └── route.ts                  # POST
│   │   │   ├── gym-sessions/[id]/exercises/
│   │   │   │   └── route.ts                  # POST
│   │   │   ├── gym-sessions/[id]/skip-exercise/
│   │   │   │   └── route.ts                  # PATCH
│   │   │   ├── gym-sessions/[id]/status/
│   │   │   │   └── route.ts                  # PATCH
│   │   │   ├── reflections/[sessionId]/
│   │   │   │   └── route.ts                  # GET, PATCH
│   │   │   ├── history/
│   │   │   │   └── route.ts                  # GET
│   │   │   └── progress/[exercise]/
│   │   │       └── route.ts                  # GET
│   │   │
│   │   ├── nutrition/
│   │   │   ├── intake/
│   │   │   │   └── route.ts                  # GET (list by date)
│   │   │   ├── intake/photo/
│   │   │   │   └── route.ts                  # POST (photo upload + analysis)
│   │   │   ├── intake/manual/
│   │   │   │   └── route.ts                  # POST (manual entry)
│   │   │   ├── intake/[eventId]/items/[itemId]/
│   │   │   │   └── route.ts                  # PATCH (edit item)
│   │   │   ├── intake/[eventId]/
│   │   │   │   └── route.ts                  # DELETE
│   │   │   ├── targets/
│   │   │   │   └── route.ts                  # GET, PUT
│   │   │   ├── summary/
│   │   │   │   └── route.ts                  # GET
│   │   │   └── reflections/
│   │   │       └── route.ts                  # GET, POST
│   │   │
│   │   └── insights/
│   │       ├── route.ts                      # GET (list), POST (generate)
│   │       └── [id]/
│   │           └── route.ts                  # PATCH (dismiss/action)
│   │
│   └── ... (existing: login, auth, etc.)
│
├── components/
│   ├── ... (existing)
│   │
│   ├── fitness/                              # SHARED FITNESS COMPONENTS
│   │   ├── TemplateCard.tsx                  # Template preview card
│   │   ├── ExerciseList.tsx                  # Exercise list display
│   │   ├── ScheduleCard.tsx                  # Scheduled workout card
│   │   ├── VolumeChart.tsx                   # Volume comparison chart
│   │   ├── PRBadge.tsx                       # Personal record indicator
│   │   └── WorkoutStatusBadge.tsx            # Status badge (scheduled/completed/missed)
│   │
│   ├── nutrition/                            # SHARED NUTRITION COMPONENTS
│   │   ├── MacroPieChart.tsx                 # Macro distribution pie chart
│   │   ├── CalorieRing.tsx                   # Calorie progress ring
│   │   ├── FlippableCard.tsx                 # Consumed ↔ Remaining flip card
│   │   ├── IntakeEventCard.tsx               # Single intake event display
│   │   ├── FoodItemRow.tsx                   # Food item with edit capability
│   │   ├── ConfidenceBadge.tsx               # Confidence score indicator
│   │   └── PhotoCapture.tsx                  # Camera/upload component
│   │
│   └── shared/                               # CROSS-CUTTING COMPONENTS
│       ├── InsightCard.tsx                    # AI insight display card
│       ├── ReflectionForm.tsx                # Shared reflection input form
│       └── EmptyState.tsx                    # Empty state placeholder
│
├── lib/
│   ├── ... (existing)
│   │
│   ├── fitness/
│   │   ├── queries.ts                        # Supabase query helpers for fitness
│   │   ├── mutations.ts                      # Supabase mutation helpers for fitness
│   │   ├── computations.ts                   # Volume calc, PR detection, delta computation
│   │   └── types.ts                          # Fitness TypeScript types + enums
│   │
│   ├── nutrition/
│   │   ├── queries.ts                        # Supabase query helpers for nutrition
│   │   ├── mutations.ts                      # Supabase mutation helpers for nutrition
│   │   ├── computations.ts                   # Macro aggregation, adherence scoring
│   │   ├── ai-analysis.ts                    # Photo analysis AI integration
│   │   └── types.ts                          # Nutrition TypeScript types + enums
│   │
│   └── insights/
│       ├── generator.ts                      # AI insight generation logic
│       ├── correlations.ts                   # Cross-domain correlation detection
│       └── types.ts                          # Insight TypeScript types
│
├── store/
│   ├── useGoals.ts                           # Existing
│   ├── useGymSession.ts                      # Gym Mode state (active session, current exercise, timer)
│   ├── useNutritionDay.ts                    # Daily nutrition state (intake events, summary, targets)
│   └── useFitnessSchedule.ts                 # Scheduled workouts state
│
└── hooks/
    ├── useViewport.ts                        # Device detection + viewport dimensions
    ├── useNoScroll.ts                        # Enforce no-scroll constraint
    ├── useGymModeGuard.ts                    # Prevent navigation out of gym mode
    ├── useRealtimeIntake.ts                  # Supabase realtime for nutrition updates
    └── useTimer.ts                           # Session timer with pause/resume
```

## Key Architecture Decisions

### Gym Mode as Separate Route Group

Gym Mode lives at `/gym-mode` **outside** the `(dashboard)` route group. This is critical:

```
app/
├── (dashboard)/    ← Has sidebar + topbar via layout.tsx
│   └── fitness/    ← Normal fitness pages use dashboard layout
│
├── gym-mode/       ← NO dashboard layout, bare full-screen
│   └── layout.tsx  ← Minimal: just viewport lock + dark background
```

The `gym-mode/layout.tsx` is intentionally minimal:

```typescript
// gym-mode/layout.tsx
export default function GymModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {children}
    </div>
  );
}
```

### State Machine Integration Strategy

Use Zustand stores that encode valid state transitions:

```typescript
// store/useGymSession.ts
type GymSessionState = {
  status: 'idle' | 'active' | 'paused' | 'completed' | 'abandoned';
  session: GymSession | null;
  currentExerciseIndex: number;
  timer: { elapsed: number; isRunning: boolean };

  // Actions enforce valid transitions only
  startSession: (scheduledWorkoutId?: string) => Promise<void>;
  pause: () => void;        // only from 'active'
  resume: () => void;       // only from 'paused'
  complete: () => Promise<void>;  // from 'active' | 'paused'
  abandon: () => Promise<void>;   // from 'active' | 'paused'
  logSet: (data: SetInput) => Promise<void>;  // only when 'active'
};
```

### Server Actions vs API Routes

- **API Routes** for: anything called from Zustand stores or that needs streaming (photo analysis)
- **Server Actions** for: simple form submissions (template create/edit, reflection submit, target update)

---

# E. UI WIREFRAMES (TEXT-BASED)

## 1. Dashboard — Fitness & Nutrition Widgets

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR: Life OS Dashboard                              [User] [⚙]  │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│  NAV   │  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│        │  │  TODAY'S SESSION         │  │  NUTRITION TODAY         │  │
│  ■ Home│  │                         │  │                         │  │
│  □ Cal │  │  Push Day (Strength)    │  │  ┌─────┐  1,842 kcal   │  │
│  □ Wthr│  │  ───────────────────    │  │  │     │  ──────────   │  │
│  ───── │  │  Bench Press  4×8       │  │  │ PIE │  / 2,400 goal │  │
│  □ Fit │  │  OHP          3×10      │  │  │     │               │  │
│  □ Nutr│  │  Incline DB   3×12      │  │  └─────┘  P: 142g      │  │
│  □ Focs│  │  Cable Flies  3×15      │  │           C: 198g      │  │
│  □ Goal│  │                         │  │           F: 62g       │  │
│  ───── │  │  ┌───────────────────┐  │  │                         │  │
│  □ AI  │  │  │  ▶ START GYM MODE │  │  │  ┌──────────────────┐  │  │
│  □ Sett│  │  └───────────────────┘  │  │  │  + LOG MEAL       │  │  │
│        │  │                         │  │  └──────────────────┘  │  │
│        │  └─────────────────────────┘  └─────────────────────────┘  │
│        │                                                             │
│        │  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│        │  │  WEEK OVERVIEW          │  │  AI INSIGHTS             │  │
│        │  │                         │  │                         │  │
│        │  │  Mon ■ Tue □ Wed ■      │  │  ▸ Volume up 12% this   │  │
│        │  │  Thu □ Fri ■ Sat □      │  │    week on upper body   │  │
│        │  │  Sun □                   │  │                         │  │
│        │  │                         │  │  ▸ Protein trending 15g  │  │
│        │  │  ■ = completed           │  │    below target         │  │
│        │  │  □ = scheduled / rest    │  │                         │  │
│        │  └─────────────────────────┘  └─────────────────────────┘  │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

## 2. Gym Mode (Full Screen — Dark)

### Exercise View

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                    ⏱ 24:31  ⏸ ✕    │
│                                                                      │
│                        BENCH PRESS                                   │
│                     Exercise 2 of 6                                  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   │   TARGET: 4 sets × 8 reps @ 80kg                            │   │
│   │                                                              │   │
│   │   ─────────────────────────────────────────────              │   │
│   │                                                              │   │
│   │   SET 1    80kg × 8  ✓                                      │   │
│   │   SET 2    80kg × 7  ✓                                      │   │
│   │   SET 3    ← CURRENT                                        │   │
│   │   SET 4    —                                                 │   │
│   │                                                              │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐     │
│   │                                                            │     │
│   │   WEIGHT (kg)         REPS                                 │     │
│   │   ┌──────────┐        ┌──────────┐                         │     │
│   │   │          │        │          │                         │     │
│   │   │    80    │        │    8     │                         │     │
│   │   │          │        │          │                         │     │
│   │   └──────────┘        └──────────┘                         │     │
│   │         [-] [+]              [-] [+]                       │     │
│   │                                                            │     │
│   │   ┌──────────────────────────────────────────────────┐     │     │
│   │   │                LOG SET                           │     │     │
│   │   └──────────────────────────────────────────────────┘     │     │
│   │                                                            │     │
│   └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│   ┌─────────┐          ┌──────────┐          ┌──────────┐           │
│   │  ◀ PREV │          │   SKIP   │          │  NEXT ▶  │           │
│   └─────────┘          └──────────┘          └──────────┘           │
│                                                                      │
│                    ┌────────────────────┐                            │
│                    │  FINISH WORKOUT    │                            │
│                    └────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Pause Overlay

```
┌──────────────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░        PAUSED        ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░       ⏱ 24:31        ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░                      ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   ┌──────────────┐   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   │    RESUME    │   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   └──────────────┘   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░                      ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   ┌──────────────┐   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   │  END SESSION │   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░   └──────────────┘   ░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────────────────────────────────┘
```

### Post-Workout Reflection

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                       SESSION COMPLETE                               │
│                       Push Day — 47:22                               │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  PLANNED          EXECUTED         DELTA                     │   │
│   │  ────────         ────────         ─────                     │   │
│   │  Volume: 8,640kg  Volume: 8,120kg  ▼ -6.0%                  │   │
│   │  Sets:   16       Sets:   15       ▼ -1                     │   │
│   │  Exercises: 4     Exercises: 4     ─ same                   │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  🏆 PERSONAL RECORD                                         │   │
│   │  Bench Press — 82.5kg × 8 (prev: 80kg × 8)                 │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  MISSED TARGETS                                              │   │
│   │  OHP — Set 4: 7 reps (target: 10)                           │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   How did this session feel?                                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│   │  STRONG  │  │  NORMAL  │  │   OFF    │                         │
│   └──────────┘  └──────────┘  └──────────┘                         │
│                                                                      │
│   Notes (optional):                                                 │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                    SAVE & EXIT                               │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Nutrition Logging — Method Selection

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR: Log Meal                                       [← Back]    │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│  NAV   │              HOW DO YOU WANT TO LOG?                       │
│        │                                                             │
│        │   ┌─────────────────────────────────────────────────────┐   │
│        │   │                                                     │   │
│        │   │              📷  TAKE A PHOTO                       │   │
│        │   │                                                     │   │
│        │   │    Snap your meal and let AI estimate the macros    │   │
│        │   │                                                     │   │
│        │   └─────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │   ┌─────────────────────────────────────────────────────┐   │
│        │   │                                                     │   │
│        │   │              ✏️  ENTER MANUALLY                     │   │
│        │   │                                                     │   │
│        │   │    Search foods and enter portions yourself         │   │
│        │   │                                                     │   │
│        │   └─────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │   Meal type: [Breakfast ▼]                                 │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

## 4. Nutrition Logging — Photo Review

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR: Review Meal                                    [← Back]    │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│  NAV   │   ┌───────────────────────┐  ┌───────────────────────────┐ │
│        │   │                       │  │  DETECTED ITEMS            │ │
│        │   │                       │  │                           │ │
│        │   │    [Photo Preview]    │  │  Grilled Chicken Breast   │ │
│        │   │                       │  │  ~200g  │ 330cal │ ★★★★  │ │
│        │   │                       │  │  P:62g C:0g F:7g         │ │
│        │   │                       │  │  [Edit]                   │ │
│        │   │                       │  │  ────────────────────     │ │
│        │   └───────────────────────┘  │  Brown Rice               │ │
│        │                              │  ~150g  │ 170cal │ ★★★   │ │
│        │                              │  P:4g  C:36g F:1g        │ │
│        │                              │  [Edit]                   │ │
│        │                              │  ────────────────────     │ │
│        │                              │  Mixed Vegetables         │ │
│        │                              │  ~100g  │ 45cal  │ ★★★★  │ │
│        │                              │  P:2g  C:8g  F:0g        │ │
│        │                              │  [Edit]                   │ │
│        │                              └───────────────────────────┘ │
│        │                                                             │
│        │   TOTAL: 545 cal  │  P: 68g  │  C: 44g  │  F: 8g         │
│        │   Avg Confidence: 85%                                      │
│        │                                                             │
│        │   ┌──────────────────────────────────────────────────────┐  │
│        │   │                 CONFIRM & LOG                        │  │
│        │   └──────────────────────────────────────────────────────┘  │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

## 5. Daily Nutrition Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR: Nutrition                                      [+ Log]     │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│  NAV   │  ┌───────────────────────────┐  ┌────────────────────────┐ │
│        │  │                           │  │  REMAINING             │ │
│        │  │     CALORIE PROGRESS      │  │  (flip for consumed)   │ │
│        │  │                           │  │                        │ │
│        │  │    ┌──────────────┐       │  │  Protein:  +38g       │ │
│        │  │    │              │       │  │  Carbs:    +52g       │ │
│        │  │    │   1,842      │       │  │  Fat:      +18g       │ │
│        │  │    │   / 2,400    │       │  │                        │ │
│        │  │    │   kcal       │       │  │  Suggestion:           │ │
│        │  │    │              │       │  │  "A protein-rich snack │ │
│        │  │    └──────────────┘       │  │   would help close    │ │
│        │  │    ████████████░░░░ 77%   │  │   the gap."           │ │
│        │  │                           │  │                        │ │
│        │  └───────────────────────────┘  └────────────────────────┘ │
│        │                                                             │
│        │  ┌──────────────────────────────────────────────────────┐   │
│        │  │  TODAY'S MEALS                                       │   │
│        │  │                                                      │   │
│        │  │  ☀ Breakfast  8:15am    │  Oatmeal + Banana  │ 380cal│   │
│        │  │  🌤 Lunch     12:30pm   │  Chicken + Rice    │ 545cal│   │
│        │  │  🌤 Snack     3:00pm    │  Protein Bar       │ 210cal│   │
│        │  │  🌙 Dinner    7:00pm    │  Salmon + Veggies  │ 707cal│   │
│        │  │                                                      │   │
│        │  └──────────────────────────────────────────────────────┘   │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

## 6. Nutrition End-of-Day Reflection

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR: Daily Reflection                               [← Back]   │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│  NAV   │  ┌──────────────────────────────────────────────────────┐   │
│        │  │  ADHERENCE SCORE                                     │   │
│        │  │                                                      │   │
│        │  │          ████████████████░░░  87%                    │   │
│        │  │                                                      │   │
│        │  │  Calories: 2,120 / 2,400  (88%)                     │   │
│        │  │  Protein:  165g / 180g    (92%)                     │   │
│        │  │  Carbs:    248g / 300g    (83%)                     │   │
│        │  │  Fat:      72g / 80g      (90%)                     │   │
│        │  │                                                      │   │
│        │  │  Largest deviation: Carbs (52g below target)         │   │
│        │  └──────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │  ┌──────────────────────────────────────────────────────┐   │
│        │  │  AI SUMMARY                                          │   │
│        │  │  "Solid day overall. Protein intake was strong.      │   │
│        │  │   Carb shortfall may be linked to skipping the       │   │
│        │  │   afternoon snack. Consider a fruit or grain-based   │   │
│        │  │   snack to bridge the gap on training days."         │   │
│        │  └──────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │  Hunger level today:                                       │
│        │  [Not hungry] [Slightly] [Hungry] [Very hungry] [Starving]│
│        │                                                             │
│        │  Social eating today?  [Yes] [No]                          │
│        │                                                             │
│        │  Notes:                                                    │
│        │  ┌──────────────────────────────────────────────────────┐   │
│        │  │                                                      │   │
│        │  └──────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │  ┌──────────────────────────────────────────────────────┐   │
│        │  │                 SAVE REFLECTION                      │   │
│        │  └──────────────────────────────────────────────────────┘   │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

---

# F. IMPLEMENTATION NOTES

## 1. Key Architectural Decisions

### Dual Supabase Projects
The existing setup uses two Supabase projects (one for auth, one for data). All fitness/nutrition tables go into the **data project** (`ftorqizpzrjhwarjuqst`). Auth checks reference the **dashboard project** (`tvbemlwkphnvmsromqha`). Ensure `user_id` foreign keys reference the correct auth schema.

### State Management Strategy
```
Zustand Stores (client-side real-time state)
├── useGymSession     — Active gym session state, timer, current exercise
├── useNutritionDay   — Today's intake, running totals, targets
└── useFitnessSchedule — This week's schedule, today's workout

Supabase Realtime (server-pushed updates)
├── intake_events     — New meals logged on other devices sync here
└── gym_sessions      — Session status changes sync across devices

Server Components (initial data loading)
├── Template lists, history views, progress charts
└── Pre-rendered where possible, hydrated with stores
```

### Server Actions vs API Routes Decision Matrix
| Use Case | Approach | Reason |
|----------|----------|--------|
| Template CRUD | Server Actions | Form-based, simple request/response |
| Schedule CRUD | Server Actions | Form-based, simple mutations |
| Start Gym Session | API Route | Complex initialization, returns large payload |
| Log Set | API Route | Called rapidly during workout, needs speed |
| Photo Analysis | API Route | Streaming response, file upload |
| Daily Summary | API Route | Called frequently, needs caching |
| Reflections | Server Actions | Form-based, submitted once |

## 2. Enforcing No-Scroll

### Global Strategy
```css
/* globals.css — already partially enforced in existing project */
html, body {
  overflow: hidden;
  height: 100dvh;        /* dynamic viewport height — handles mobile toolbar */
  width: 100dvw;
}

#__next {
  height: 100dvh;
  overflow: hidden;
}
```

### Per-Layout Strategy
Every layout uses a flex/grid container that fills exactly `100dvh`:

```typescript
// (dashboard)/layout.tsx pattern
<div className="h-dvh flex overflow-hidden">
  <Sidebar />
  <main className="flex-1 flex flex-col overflow-hidden">
    <Topbar />
    <div className="flex-1 overflow-hidden p-4">
      {children}  {/* Page content must fit within this box */}
    </div>
  </main>
</div>
```

### Content Overflow Handling
When content might overflow (e.g., exercise lists, meal lists), use:
1. **Virtualized lists** — render only visible items
2. **Pagination** — show 4-6 items per page with prev/next
3. **Summarization** — collapse items, expand on tap
4. **Grid reflow** — adapt grid columns to viewport

**Never** add `overflow-y: auto/scroll` to any container.

### useNoScroll Hook
```typescript
// hooks/useNoScroll.ts
export function useNoScroll() {
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Prevent touch scroll on mobile
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = origOverflow;
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);
}
```

## 3. Multi-Platform Responsive Strategy

### Breakpoint System
```
Raspberry Pi:    1280 × 720   (pi)
Mobile:          < 640px       (sm)
Tablet:          640-1024px    (md)
Desktop:         1024-1440px   (lg)
Large Desktop:   > 1440px      (xl)
```

### Layout Reflow Rules

| Viewport | Dashboard Grid | Gym Mode | Nutrition Summary |
|----------|---------------|----------|-------------------|
| Pi       | 2×2 cards     | Full screen, XL touch | 2 column |
| Mobile   | 1 column stack | Full screen, XL touch | 1 column |
| Tablet   | 2×2 grid      | Full screen, large touch | 2 column |
| Desktop  | 2×2 or 3-col  | Full screen, standard | 3 column |
| XL       | 3×2 grid      | Full screen, standard | 3 column |

### Touch Target Sizing
```css
/* Minimum touch target sizes */
.touch-target {
  min-height: 44px;      /* Apple HIG minimum */
  min-width: 44px;
}

.touch-target-gym {
  min-height: 64px;      /* Gym Mode — larger for gloved/sweaty hands */
  min-width: 64px;
  font-size: 1.5rem;
}
```

### Device Detection Hook
```typescript
// hooks/useViewport.ts
type DeviceClass = 'pi' | 'mobile' | 'tablet' | 'desktop' | 'xl';

export function useViewport() {
  const [device, setDevice] = useState<DeviceClass>('desktop');
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ w, h });

      if (w === 1280 && h === 720) setDevice('pi');
      else if (w < 640) setDevice('mobile');
      else if (w < 1024) setDevice('tablet');
      else if (w < 1440) setDevice('desktop');
      else setDevice('xl');
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { device, ...dimensions };
}
```

## 4. Confidence Scores & Preserving Original Estimates

### Dual-Column Pattern
Every AI-estimated field has a paired `edited_*` column:

```
estimated_calories  →  edited_calories   (null if unedited)
estimated_protein_g →  edited_protein_g  (null if unedited)
...
```

### Access Pattern
Always read through the `intake_items_effective` view, which uses `COALESCE(edited, estimated)`. This ensures:
- App code always gets the "current best" value
- Original estimates are never lost
- `was_edited` flag tracks provenance

### Confidence Display
```
★★★★★  90-100%  — High confidence
★★★★   70-89%   — Good confidence
★★★    50-69%   — Moderate — suggest review
★★     30-49%   — Low — recommend editing
★      0-29%    — Very low — manual entry recommended
```

## 5. Execution Never Overwrites Planning

### Strict Separation
```
workout_templates       ← PLANNING (immutable during execution)
  └── template_exercises

scheduled_workouts      ← COMMITMENT (status changes only)

gym_sessions            ← EXECUTION (new records only)
  ├── execution_exercises   ← Copies exercise names FROM template, but is a separate record
  └── execution_sets        ← Brand new data, no template equivalent
```

### Key Rules
1. **Template exercises are copied** into `execution_exercises` at session start — not referenced
2. `execution_exercises.exercise_name` is a **snapshot** of the template value at execution time
3. If the user modifies a template later, past execution records remain unchanged
4. `execution_exercises.template_exercise_id` is a **reference link** for comparison, not a dependency
5. Deleting a template does NOT cascade to execution records (ON DELETE SET NULL)

### Comparison Logic
When generating reflections, the system:
1. Loads the original `template_exercises` via `scheduled_workout → template`
2. Loads the `execution_exercises` via `gym_session`
3. Compares them side-by-side (planned vs actual)
4. Neither record modifies the other

---

# G. IMPLEMENTATION ROADMAP

## Phase 1: Database Foundation (Week 1)

### Step 1.1: Schema Migration
- [ ] Create all enums in Supabase SQL editor
- [ ] Create all tables (in dependency order)
- [ ] Create the `intake_items_effective` view
- [ ] Apply RLS policies to all tables
- [ ] Test with sample data

### Step 1.2: TypeScript Types
- [ ] Create `src/lib/fitness/types.ts` with all fitness types and enums
- [ ] Create `src/lib/nutrition/types.ts` with all nutrition types and enums
- [ ] Create `src/lib/insights/types.ts` with insight types

### Step 1.3: Query & Mutation Helpers
- [ ] Create `src/lib/fitness/queries.ts` — template list, schedule fetch, session fetch, history
- [ ] Create `src/lib/fitness/mutations.ts` — template CRUD, schedule, session ops, set logging
- [ ] Create `src/lib/nutrition/queries.ts` — intake list, summary, targets, reflections
- [ ] Create `src/lib/nutrition/mutations.ts` — intake create, item edit, target set, reflection save

## Phase 2: Fitness Templates & Scheduling (Week 2)

### Step 2.1: Template Management UI
- [ ] Create `/fitness` hub page with "Today's Session" card
- [ ] Create `/fitness/templates` — list templates with archive toggle
- [ ] Create `/fitness/templates/[id]` — template detail with exercise editor
- [ ] Create Zustand store skeleton for fitness schedule
- [ ] Build shared components: `TemplateCard`, `ExerciseList`, `WorkoutStatusBadge`

### Step 2.2: Workout Scheduling
- [ ] Create `/fitness/schedule` — weekly view with calendar integration
- [ ] Implement schedule-from-template flow
- [ ] Implement reschedule flow
- [ ] Add "Today's Session" widget to dashboard home page
- [ ] Implement missed workout detection (check daily or on page load)

## Phase 3: Gym Mode (Week 3-4)

### Step 3.1: Gym Mode Shell
- [ ] Create `/gym-mode` route outside `(dashboard)` group
- [ ] Build `GymModeLayout` — full-screen, no navigation, dark theme
- [ ] Build `GymModeShell` — main container with timer
- [ ] Implement `useGymSession` Zustand store with full state machine
- [ ] Implement `useTimer` hook with pause/resume
- [ ] Implement `useGymModeGuard` — prevent accidental navigation

### Step 3.2: Exercise Flow
- [ ] Build `ExerciseDisplay` — single exercise with target info
- [ ] Build `SetLogger` — weight/reps input with large touch targets
- [ ] Build `ExerciseNavigator` — prev/next/skip controls
- [ ] Build `AddExerciseForm` — ad-hoc exercise addition
- [ ] Build `PauseOverlay` — pause state with resume/end options

### Step 3.3: Session Completion
- [ ] Build `SessionSummary` — planned vs executed comparison
- [ ] Implement `src/lib/fitness/computations.ts` — volume calc, PR detection, delta
- [ ] Build `ReflectionPrompt` — rating + note input
- [ ] Wire session completion → reflection generation → save flow
- [ ] Update scheduled workout status on session complete

### Step 3.4: API Routes
- [ ] Create all gym session API routes (start, log set, add exercise, skip, status change)
- [ ] Create reflection API routes (get, patch)
- [ ] Test full flow end-to-end

## Phase 4: Nutrition System (Week 5-6)

### Step 4.1: Manual Logging
- [ ] Create `/nutrition` hub page with daily summary
- [ ] Create `/nutrition/log` — method selection screen
- [ ] Build manual logging flow — food search, portion input, save
- [ ] Build shared components: `IntakeEventCard`, `FoodItemRow`, `ConfidenceBadge`
- [ ] Create `useNutritionDay` Zustand store

### Step 4.2: Photo Logging
- [ ] Build `PhotoCapture` component — camera + file upload
- [ ] Create `src/lib/nutrition/ai-analysis.ts` — integration with vision AI
- [ ] Create `/api/nutrition/intake/photo` route — upload + analyze + save
- [ ] Build AI review screen — detected items with confidence, edit capability
- [ ] Implement dual-column edit pattern (preserve original estimates)

### Step 4.3: Daily Summary & Targets
- [ ] Create `/nutrition/targets` — daily target configuration
- [ ] Build `MacroPieChart` component
- [ ] Build `CalorieRing` component
- [ ] Build `FlippableCard` — consumed ↔ remaining with suggestions
- [ ] Create `/api/nutrition/summary` route
- [ ] Wire Supabase realtime to update summary on new intake

### Step 4.4: Nutrition Reflection
- [ ] Build end-of-day reflection flow
- [ ] Implement adherence score computation
- [ ] Implement AI summary generation
- [ ] Create reflection API routes
- [ ] Add nutrition widgets to dashboard home

## Phase 5: AI Insights (Week 7)

### Step 5.1: Insight Generation
- [ ] Create `src/lib/insights/generator.ts` — pattern detection, trend analysis
- [ ] Create `src/lib/insights/correlations.ts` — cross-domain correlations
- [ ] Create `/api/insights` routes
- [ ] Build `InsightCard` component

### Step 5.2: Dashboard Integration
- [ ] Add insights feed to dashboard home
- [ ] Create `/insights` page for full insight history
- [ ] Implement dismiss/action functionality

## Phase 6: Multi-Platform Polish (Week 8)

### Step 6.1: Responsive Refinement
- [ ] Implement `useViewport` hook
- [ ] Test and adjust all layouts for Pi (1280×720)
- [ ] Test and adjust all layouts for mobile
- [ ] Test and adjust all layouts for tablet
- [ ] Ensure all touch targets meet minimum sizes

### Step 6.2: Gym Mode Polish
- [ ] Test Gym Mode on mobile (simulated gym conditions)
- [ ] Test Gym Mode on tablet
- [ ] Optimize touch targets for sweaty/gloved hands
- [ ] Test pause/resume/abandon flows under real conditions

### Step 6.3: No-Scroll Audit
- [ ] Audit every page for scroll violation
- [ ] Implement virtualization where needed
- [ ] Test all views at minimum supported viewport
- [ ] Fix any overflow issues

## Phase 7: Integration & Testing (Week 9)

### Step 7.1: End-to-End Flows
- [ ] Test complete fitness flow: create template → schedule → gym mode → reflection
- [ ] Test complete nutrition flow: photo log → review → daily summary → reflection
- [ ] Test cross-domain: training day targets adjust, sleep correlation
- [ ] Test multi-device: start on desktop, continue on mobile

### Step 7.2: Data Integrity
- [ ] Verify execution never overwrites planning (modify template, check old sessions)
- [ ] Verify original estimates preserved after edits
- [ ] Verify missed workouts are recorded, not deleted
- [ ] Verify RLS policies enforce user isolation

### Step 7.3: Performance
- [ ] Lighthouse audit on all pages
- [ ] Optimize Supabase queries (add missing indexes if needed)
- [ ] Test realtime subscription performance under load
- [ ] Bundle size analysis

---

*End of Technical Specification*
