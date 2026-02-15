📘 AI HANDOVER FILE
Fitness & Nutrition System – Multi-Platform Life Dashboard
1. PROJECT CONTEXT

This project is a personal life-operating dashboard that runs across multiple platforms (desktop, tablet, mobile, Raspberry Pi touchscreen, etc.).

Core UI Constraint:

The interface must dynamically fit the device viewport

NO SCROLLING anywhere

Responsive layout required

Touch-friendly where applicable

High clarity, state-based UI

The system is built around:

Design → Execute → Observe → Reflect → Adjust

This document defines the Fitness (Workout) and Nutrition systems only.

2. FITNESS SYSTEM

The fitness system is state-driven and separates:

Planning

Scheduling

Execution

Reflection

These must be distinct but linked entities.

2.1 Workout Templates (Planning Layer)

Templates define training identity.

Each template contains:

Workout name

Training intent (strength / hypertrophy / recovery / conditioning)

Exercises list

Target sets

Target reps

Optional target load or RPE

Optional notes

Templates are:

Reusable

Timeless

Not date-bound

2.2 Scheduled Workouts (Commitment Layer)

A scheduled workout is:

A template assigned to a specific date

Linked to Calendar

Appears in Dashboard as “Today’s Session”

Scheduled workouts can be:

Completed

Missed

Rescheduled

Missed workouts are not deleted — they are recorded as missed.

2.3 Gym Mode (Execution Layer)

Gym Mode is manually activated by the user when at the gym.

When Gym Mode is active:

UI Behaviour:

Single-task focus

Large touch targets

No unrelated tabs visible

No historical charts

High contrast, minimal distractions

Logging Rules:

One exercise displayed at a time

One set at a time

User logs:

Actual weight

Actual reps

Optional notes

Each set is timestamped

User can:

Modify weight mid-session

Add/remove sets

Skip exercises

Add exercises not in template

Critical Principle:

Gym Mode logs factual execution only.

No interpretation occurs during Gym Mode.

2.4 Post-Workout Reflection (Analysis Layer)

Triggered when Gym Mode ends.

System automatically:

Compares planned vs executed

Calculates total volume

Detects PRs

Detects volume increase/decrease

Flags missed targets

Optional user inputs:

Session rating (e.g., Strong / Normal / Off)

Short reflection note

Outputs feed into:

Progress tracking

AI insights

Future training adjustments

2.5 Data Model Separation (Critical Requirement)

Planned workouts and executed workouts must be separate but linked records.

Example:

Template

Scheduled instance

Execution record

Execution never overwrites planning data.

3. NUTRITION SYSTEM

Nutrition is event-based and supports dual input methods.

3.1 Intake Events (Reality Layer)

Each meal is an intake event.

Input methods:

📸 Photo-based logging (primary)

✍️ Manual logging (secondary)

Each intake event contains:

Timestamp

Food items detected or entered

Estimated calories

Estimated protein / carbs / fats

Portion size estimation

Confidence score

Editable flag

Edits do not delete original estimation metadata.

3.2 Photo-Based Logging Flow

User:

Uploads food image

System:

Identifies food items

Estimates portion sizes

Calculates macro breakdown

Assigns confidence score

Logs event

User may:

Confirm

Edit items

Adjust portions

Photo-based logging is probabilistic and not expected to be perfectly accurate.

3.3 Manual Logging Flow

User:

Selects or types food

Enters portion size

Saves entry

Manual entries are treated equally to photo entries once logged.

3.4 Daily Targets (Intent Layer)

Daily macro and calorie targets are defined by:

User goals

Training load (training day vs rest day)

Sleep quality

AI recommendations

Targets are dynamic and context-aware.

3.5 Real-Time Feedback

Dashboard displays:

Macro pie chart (consumed)

Calorie progress ring

Remaining macro distribution (via flip interaction)

When flipped:

Shows remaining macros needed

Suggests incremental adjustments

Avoids absolute prescriptions

No shaming or red-alert systems.

3.6 End-of-Day Reflection

System generates:

Adherence score

Largest deviation (e.g., protein low)

Macro distribution trend

AI-generated summary

Optional:

Short reflection note

Hunger level

Social eating flag

These feed into:

Future targets

Insights

Focus suggestions

4. AI ROLE (Fitness & Nutrition Only)

AI is not primarily a chatbot.

AI responsibilities:

Detect patterns

Summarise trends

Suggest incremental adjustments

Correlate:

Sleep vs performance

Calories vs training intensity

Protein vs recovery

AI should:

Provide explanations

Remain neutral

Avoid moralising

Avoid rigid prescriptions

5. MULTI-PLATFORM RESPONSIVE REQUIREMENTS

The UI must:

Dynamically adapt to viewport size

Maintain zero-scroll layout

Reflow into grids depending on device

Maintain clear state indication

Use large touch targets on touch devices

Reduce density appropriately on small screens

Gym Mode should:

Take full screen regardless of device

Hide non-essential navigation

Maintain extreme clarity

6. NON-NEGOTIABLE DESIGN PRINCIPLES

Execution > Planning

Reality over perfection

No scrolling

Clear system states

Planning and execution stored separately

Nutrition confidence acknowledged

Reflection without judgement

System respects user autonomy

7. CURRENT STATUS

Concept complete

System logic defined

No implementation yet

Ready for:

Data modelling

State machine design

API design

Next.js architecture planning

End of Fitness & Nutrition Handover.