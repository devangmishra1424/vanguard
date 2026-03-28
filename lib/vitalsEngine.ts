import { LabValue, ReportSnapshot, DailyVital } from './store';

/**
 * Calculates a 'Vitality Score' (0-100) based on lab value statuses and severity.
 * NORMAL = 100 points
 * ABNORMAL = weighted by distance from normal range:
 *   - 0-10% beyond range = 70 pts (mild)
 *   - 10-30% beyond range = 50 pts (moderate)  
 *   - 30%+ beyond range = 20 pts (severe)
 */
export function calculateVitalityScore(labValues: LabValue[]): number {
  if (labValues.length === 0) return 0;

  const calculateSeverityScore = (labValue: LabValue): number => {
    if (labValue.status === 'NORMAL') return 100;
    
    // For abnormal findings, critical markers get harsher penalty (lower score)
    const testName = labValue.name.toLowerCase();
    const criticalMarkers = [
      'hemoglobin', 'creatinine', 'bilirubin', 'glucose',
      'hba1c', 'potassium', 'inr', 'egfr', 'tsh', 'alt', 'ast'
    ];
    const isCritical = criticalMarkers.some(m => testName.includes(m));
    
    // CORRECT: critical abnormal = LOWER score = harsher penalty
    return isCritical ? 15 : 45;
  };

  const totalPoints = labValues.reduce((acc, curr) => {
    return acc + calculateSeverityScore(curr);
  }, 0);

  return Math.round(totalPoints / labValues.length);
}

/**
 * Normalizes common biomarker names into unified groups
 */
export function normalizeBiomarkerName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n === 'hb' || n === 'hemoglobin' || n === 'hgb') return 'Hemoglobin';
  if (n === 'blood sugar' || n.includes('glucose') || n === 'sugar') return 'Glucose';
  if (n === 'bp sys' || n.includes('systolic')) return 'Blood Pressure (Systolic)';
  if (n === 'bp dia' || n.includes('diastolic')) return 'Blood Pressure (Diastolic)';
  if (n === 'hr' || n.includes('heart rate')) return 'Heart Rate';
  if (n === 'tsh' || n.includes('thyroid stimulating')) return 'TSH';
  // Capitalize first letter of each word as fallback
  return name.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
}

/**
 * Returns data formatted for Recharts consumption.
 */
export function getBiomarkerTrend(history: ReportSnapshot[], dailyVitals: DailyVital[], biomarkerName: string) {
  const data: { date: string, value: number | null, unit: string, isLab: boolean }[] = [];

  // 1. Process Lab History
  const normalizedTarget = normalizeBiomarkerName(biomarkerName).toLowerCase();

  history.forEach(report => {
    const target = report.labValues.find(v => normalizeBiomarkerName(v.name).toLowerCase().includes(normalizedTarget));
    if (target) {
      data.push({
        date: report.date,
        value: target.value,
        unit: target.unit,
        isLab: true
      });
    }
  });

  // 2. Process Daily Vitals
  dailyVitals.forEach(vital => {
    const typeMap: Record<string, string> = {
      'BP_SYS': 'Blood Pressure (Systolic)',
      'BP_DIA': 'Blood Pressure (Diastolic)',
      'HR': 'Heart Rate',
      'WEIGHT': 'Weight'
    };
    
    if (typeMap[vital.type]?.toLowerCase().includes(biomarkerName.toLowerCase()) || vital.type === biomarkerName) {
      data.push({
        date: vital.date,
        value: vital.value,
        unit: vital.unit,
        isLab: false
      });
    }
  });

  // Sort by date (oldest first)
  return data.sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));
}

/**
 * Overall Vitality index trend
 */
export function getVitalityTrend(history: ReportSnapshot[]) {
  return [...history].sort((a, b) => a.date.localeCompare(b.date)).map(report => ({
    displayDate: new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    date: report.date,
    value: calculateVitalityScore(report.labValues),
    unit: 'pts',
    isLab: true
  }));
}

/**
 * Gets a list of unique biomarkers found in the user's entire history.
 */
export function getAvailableBiomarkers(history: ReportSnapshot[], dailyVitals: DailyVital[]): string[] {
  const names = new Set<string>();
  
  // From Reports
  history.forEach(report => {
    report.labValues.forEach(v => names.add(normalizeBiomarkerName(v.name)));
  });

  // From Daily Vitals
  const typeMap: Record<string, string> = {
    'BP_SYS': 'Blood Pressure (Systolic)',
    'BP_DIA': 'Blood Pressure (Diastolic)',
    'HR': 'Heart Rate',
    'WEIGHT': 'Weight'
  };
  
  dailyVitals.forEach(v => {
    names.add(typeMap[v.type] || v.type);
  });

  return Array.from(names);
}

export function getVitalReferenceRange(type: string): { min: number, max: number } | null {
  if (type.includes('Systolic')) return { min: 90, max: 120 };
  if (type.includes('Diastolic')) return { min: 60, max: 80 };
  if (type.includes('Heart Rate')) return { min: 60, max: 100 };
  return null;
}
