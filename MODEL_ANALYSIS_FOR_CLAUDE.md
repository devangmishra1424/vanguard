# Vanguard Medical AI Model - Code Analysis for Improvement

## Problem Statement
The model's accuracy is low, vague, and not precise enough to match the actual medical report findings. Need to identify and fix:
1. Prompt engineering issues  
2. Finding extraction accuracy
3. Condition-specific recommendations  
4. Layman explanation quality
5. Diet/exercise plan matching

---

## 1. MAIN ANALYSIS ROUTE: `/app/api/analyze-report/route.ts`

### Key Responsibilities:
- Extract lab findings from PDF/image reports
- Map findings to clinical knowledge base (CLINICAL_DB)
- Extract patient age
- Determine organ flags ('ANEMIA', 'LIVER', 'DIABETES', 'THYROID', 'HEART')
- Generate personalized action checklists
- Calculate confidence scores
- Match to diet and exercise plans

### Current Clinical Database (CLINICAL_DB)
Maps test names to:
- `aliases`: Multiple ways the test appears in reports
- `min/max`: Normal reference ranges  
- `invert`: If true, higher is better (e.g., HDL cholesterol)
- `explanation`: Layman explanation

**Example entries:**
- Hemoglobin: 12.0-17.5 g/dL (normal) → "Hemoglobin carries oxygen..."
- SGPT (ALT): max 45 U/L → "ALT is an enzyme mainly found in the liver..."
- TSH: 0.4-4.5 mIU/L → "TSH controls thyroid function..."

### Finding Extraction Process (3-step approach)

#### Step 1: Columnar Table Parsing (for PDFs)
- Groups text by y-coordinate (±4px tolerance = same row)
- Extracts numerical values from leftmost numeric cell
- Finds units in cells right of result
- Matches to CLINICAL_DB aliases

**Issue:** May miss findings if format varies from expected table layout

#### Step 2: Flat Text Fallback (for sparse extractions)
- Uses regex lookahead on raw text
- Grabs numbers after matched marker
- Falls back when columnar fails

**Issue:** Prone to picking reference ranges instead of actual values

#### Step 3: Mock Data Fallback
- If <3 findings extracted, uses `mockAnemia.labValues`

**Issue:** Uses hardcoded test data instead of real findings

### Status Detection Logic
```
if row contains 'HIGH' or 'ABNORMAL' → status = 'HIGH'
else if row contains 'LOW' → status = 'LOW'  
else if value < min → status = 'LOW'
else if value > max → status = 'HIGH'  
else → status = 'NORMAL'
```

**Issue:** Case-sensitive matching may miss "High", "low", "abnormal"

### Organ Mapping (ORGAN_MAP)
Connects test names to organs:
- `'hemoglobin', 'rbc count', 'wbc count'` → 'blood'
- `'sgpt (alt)', 'bilirubin'` → 'liver'  
- `'creatinine', 'urea'` → 'kidney'
- `'tsh', 't3', 't4'` → 'thyroid'
- `'total cholesterol', 'ldl cholesterol'` → 'heart'

**Issue:** Only top 1 organ is selected; multi-system issues ignored

### Confidence Score Calculation
```
< 5 markers: 20-50% confidence (low)
5-14 markers: 50-80% confidence (medium)  
15+ markers: 80-99% confidence (high)
```

**Issue:** Doesn't account for reliability of *which* markers found

---

## 2. ACTION PLAN DATABASE: `ACTION_PLAN_DB`

Maps `"test_name_status"` → array of 3 actionable recommendations

**Example:**
```
'hemoglobin_low': [
  { emoji: '🥦', task: 'Eat iron-rich foods daily: dark leafy greens (palak), beetroot, pomegranate, and dates.' },
  { emoji: '🍊', task: 'Take iron with Vitamin C to improve absorption. Avoid tea/coffee within 1 hour.' },
  { emoji: '💊', task: 'Ask your doctor about iron supplementation.' }
]
```

**Coverage:** ~25 different test_status combinations

**Issues:**
1. Hardcoded recommendations don't personalize for co-existing conditions
2. No cross-test logic (e.g., if BOTH hemoglobin AND B12 are low, should prioritize B12 workup first)
3. Generic actions not tailored to patient age, baseline, or severity

---

## 3. DIET PLAN ENGINE: `/lib/dietEngine.ts`

Maps `dietaryFlags` to pre-built diet plans:
- `ANEMIA_DIET`: "Iron & B12 Vitality Plan" 
- `LIVER_DETOX_DIET`: "Hepatic Recovery & Detox"
- `LOW_GLYCEMIC_DIET`: "Glucose Balance & Energy"
- `HEART_HEALTHY_DIET`: "Cardio-Vascular Care"

**Each plan contains:**
- `name` / `nameHi`: Plan title
- `description`: What it targets
- `consume[]`: Recommended foods with reasons
- `avoid[]`: Foods to avoid with risks  
- `chefTips[]`: Practical kitchen tips
- `schedule[]`: 5 time-based meals (8AM-8PM)

**Example Schedule Item:**
```
{
  time: '08:00 AM',
  activity: 'Iron Breakfast',
  foods: 'Poha with Sprouts & Lemon',
  tip: 'Pair with Lemon juice'
}
```

**Issue:** Hardcoded schedules don't account for patient lifestyle, work hours, or preferences

---

## 4. DIET INSIGHT API: `/app/api/diet-insight/route.ts`

**Input:**
- `labValues`: [{ name, value, unit, status }]
- `dietaryFlags`: string[]  
- `dietPlan`: DietPlan object
- `language`: 'EN' | 'HI'

**System Prompt:**
```
"You are Dr. Raahat's specialized Dietary AI Coach.
Your goal is to provide a BRIEF, compassionate, and personalized summary 
of the suggested diet plan based on the patient's lab results."
```

**Groq Model:** `llama-3.3-70b-versatile`  
**Temperature:** 0.5  
**Max tokens:** 300

**Expected Output Format:**
```
EN:
- Point 1
- Point 2
HI:
- बिंदु 1  
- बिंदु 2
```

**Issues:**
1. System prompt is vague about why each food helps *this patient*
2. Lab values and flagging are passed as JSON strings, not narrative context
3. Temperature=0.5 may be too low for personalization, causing generic outputs
4. 300 tokens is too short for detailed reasoning — results are truncated

---

## 5. EXERCISE INSIGHT API: `/app/api/exercise-insight/route.ts`

**Input:**
- `labValues`: [{ name, value, unit, status }]
- `exerciseFlags`: string[]
- `exercisePlan`: ExercisePlan  
- `age`: number
- `language`: 'EN' | 'HI'

**System Prompt:**
```
"You are Dr. Raahat's specialized MoveSmart Exercise Coach.
Your goal is to provide a BRIEF, professional, and age-aware summary..."
```

**Safety Guideline:**
```
"If the patient is Senior (60+) or has severe findings (like anemia/liver stress), 
emphasize Low-Impact movement."
```

**Groq Model:** `llama-3.3-70b-versatile`  
**Temperature:** 0.4 (lower than diet for safety)
**Max tokens:** 400

**Issues:**
1. Safety guidelines only check age>=60, not condition severity dynamically
2. Age is extracted but exerciseFlags might not reflect it (anemia flags ≠ age flags)
3. Temperature=0.4 too restrictive for varied exercise recommendations
4. Only 400 tokens for nuanced movement advice

---

## 6. EXERCISE PLAN ENGINE: `/lib/exerciseEngine.ts`

Maps `exerciseFlags` to condition-specific exercise plans:
- `ANEMIA_PLAN`: "Light Recovery" (Pranayama, slow walking, stretching)
- `NORMAL_PLAN`: "Active Longevity" (jogging, strength)
- `LIVER_PLAN`: "Metabolic Support" (yoga twists, slow swim)  
- `DIABETES_PLAN`: "Glucose Balance" (post-meal walks, resistance)
- `THYROID_PLAN`: "Metabolic Recovery" (power yoga, swimming)

**Each plan contains:**
- `tierLabel` / `tierColor`: Visual categorization
- `safetyWarning`: Condition-specific caution
- `bestTiming`: When to exercise  
- `dailyExercises[]`: Multi-session breakdown per day
- `healers[]`: Beneficial movements
- `avoid[]`: Risky activities

**Exercise Details:**
- `activity`: e.g., "Pranayama"
- `duration`: e.g., "15 min"
- `intensity`: 'Very Low' | 'Low' | 'Moderate' | 'High'
- `xp`: Points awarded
- `tip`: Scientific rationale  
- `suitability`: Why it's good for the condition
- `sessionType`: 'Morning' | 'Afternoon' | 'Evening' | 'Night'

**Issues:**
1. Plans hardcoded — co-existing conditions (e.g., anemia + diabetes) use only top organ
2. 6-day templates don't adapt to patient availability
3. Intensity levels hardcoded; no progressive loading based on condition stage
4. Tips are generic ("Zero-impact movement prevents inflammation")

---

## 7. LAYMAN EXPLANATION API: `/app/api/layman/route.ts`

**Responsibility:** Simplify clinical test results for patients

**Inputs:**
- `test`: Test name (e.g., "Hemoglobin")
- `value`: Numeric result
- `status`: 'NORMAL' | 'HIGH' | 'LOW'  
- `lang`: 'EN' | 'HI'

**Processing:**
1. **Dictionary Fallback** (High Confidence First)
   - Checks hardcoded CLINICAL_DICT for exact match
   - Returns pre-written explanation if found

2. **Xenova/flan-t5-small Model**
   - If not in dictionary, uses text2text-generation
   - Prompt: `"simplify medical finding: ${test} ${value} ${status}"`
   - Settings:
     - max_new_tokens: 60
     - temperature: 0.3  
     - repetition_penalty: 1.2

**Dictionary Coverage:** ~18 tests (Hemoglobin, Glucose, TSH, ALT, LDL, etc.)

**Issues:**
1. Dictionary explanations are generic ("Glucose is the main sugar found in your blood")
2. Don't mention what this patient's *specific value* means
3. flan-t5-small model is too small for medical nuance
4. Temperature=0.3 suppresses variability needed for detailed explanations
5. 60 tokens may truncate important patient-specific context

---

## 8. VITALITY & TREND CALCULATION: `/lib/vitalsEngine.ts`

**Key Functions:**
- `calculateVitalityScore()`: Converts lab statuses to 0-100 score
  - NORMAL finding = 100 pts
  - HIGH/LOW finding = 20 pts
  - Average across all findings

**Issues:**
1. Oversimplified: treats all abnormal findings equally (hemoglobin_low ≠ uric_acid_low in severity)
2. Doesn't weight findings by severity (5.0 Hb vs 7.0 Hb are both "LOW" but vastly different)
3. No consideration of trend (improving vs worsening over time)

---

## 9. SUMMARY OF KEY PROBLEMS

### Extraction Issues:
- [ ] Case-insensitive status matching (may miss "High", "low", but catches variations)
- [ ] Fallback to mock data when extraction fails
- [ ] Columnar parsing fails on non-standard report layouts
- [ ] Reference range confusion (picks reference min/max instead of result value)

### Mapping & Logic Issues:
- [ ] Multi-organ conditions map to only 1 organ (most affected)
- [ ] Patient age extracted but not fully leveraged for exercise/diet customization
- [ ] No cross-test combinatorial logic (e.g., B12 + Folate both low = specific intervention)
- [ ] Confidence scores don't distinguish *which* markers are critical

### AI/Prompt Issues:
- [ ] System prompts too generic; don't explain *why* recommendations fit *this patient*
- [ ] Temperatures may be too conservative (0.3-0.4) for personalization
- [ ] Token limits (300-400) force truncation of detailed explanations
- [ ] flan-t5-small model is undersized for medical domain
- [ ] No chain-of-thought prompting to show reasoning

### Domain Issues:
- [ ] Hardcoded action plans don't account for comorbidities
- [ ] Diet/exercise schedules don't adapt to patient lifestyle
- [ ] No severity-based prioritization (urgent vs manageable issues)
- [ ] Hindi translations may be literal, not culturally nuanced
- [ ] No follow-up testing priorities or timeline

---

## 10. FILES TO REVIEW & MODIFY

1. **app/api/analyze-report/route.ts** (647 lines)
   - Extract/match logic
   - Clinical database
   - Status detection
   - Action plan generation
   - Organ mapping

2. **app/api/layman/route.ts**
   - Dictionary explanations
   - flan-t5 prompting

3. **app/api/diet-insight/route.ts**
   - System prompt for Groq
   - Temperature & token settings
   - Input formatting

4. **app/api/exercise-insight/route.ts**
   - Safety guidelines
   - System prompt
   - Temperature & token settings

5. **lib/dietEngine.ts**
   - Diet plan content accuracy
   - Schedule flexibility

6. **lib/exerciseEngine.ts**
   - Exercise plan content
   - Safety warnings
   - Suitability text

7. **lib/vitalsEngine.ts**
   - Vitality score calculation
   - Severity weighting

---

## Questions for Claude:

1. **Extraction:** Should we use OCR confidence scores to fall back more gracefully?
2. **Prompting:** Should we pass structured JSON or narrative context to the LLMs?
3. **Personalization:** How to inject patient-specific context (age, gender, comorbidities, baseline) into generic prompts?
4. **Severity:** Should we implement a severity weighting for abnormal findings instead of treating all LOW/HIGH equally?
5. **Cross-test Logic:** How to detect and handle combinations (e.g., anemia + low B12 + low folate)?
6. **Confidence:** Should we expose confidence-aware responses (e.g., "low confidence, recommend review")?

---

## Code Snippets to Reference:

### Status Detection (Current):
```typescript
let status: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
const upperRow = rowStr.toUpperCase();
if (upperRow.includes('HIGH') || upperRow.includes('ABNORMAL') || upperRow.includes('H)')) status = 'HIGH';
else if (upperRow.includes('LOW') || upperRow.includes('L)')) status = 'LOW';
else {
  if (config.min !== undefined && value < config.min) status = config.invert ? 'NORMAL' : 'LOW';
  if (config.max !== undefined && value > config.max) status = config.invert ? 'LOW' : 'HIGH';
}
```

### Diet System Prompt (Current):
```typescript
const SYSTEM_PROMPT = `
You are Dr. Raahat's specialized Dietary AI Coach. 
Your goal is to provide a BRIEF, compassionate, and personalized summary of the suggested diet plan.

CONTEXT:
- Current Language Preference: ${language}
- Dietary Flags: ${JSON.stringify(dietaryFlags)}
- Lab Findings: ${JSON.stringify(labValues)}
- Pre-defined Diet Rules: ${JSON.stringify(dietPlan)}

GUIDELINES:
1. EXTREMELY IMPORTANT: Provide response in BOTH English and Hindi.
2. Format: EN: - Point 1 \n HI: - बिंदु 1
3. Use simple layman terms.
4. Keep short (max 2 points per language).
5. End with supportive closing.
`;
```

### Layman Model Prompt (Current):
```typescript
const generator = await getPipeline();
const prompt = `simplify medical finding: ${test} ${value} ${status}`;
const out = await generator(prompt, { 
  max_new_tokens: 60,
  temperature: 0.3,
  repetition_penalty: 1.2
});
```

---

## Expected Improvements:
1. More accurate extraction (reduce false negatives)
2. Severity-aware recommendations (prioritize critical findings)
3. Context-rich explanations (patient-specific not generic)
4. Better multi-condition handling (co-existing issues addressed)
5. Improved confidence communication (transparent about extraction quality)
6. Culturally nuanced Hindi content
7. Progressive, phase-based recommendations (urgent → follow-up → long-term)

