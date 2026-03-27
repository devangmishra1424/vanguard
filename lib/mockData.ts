import { GUCState, LabValue, ChecklistItem } from './store';

export const mockAnemia: Partial<GUCState> = {
  reportText: "Patient presents with fatigue and paleness. Lab results: Hemoglobin 9.5 g/dL (Normal: 12-16), Ferritin 8 ng/mL (Normal: 15-150), MCV 75 fL (Normal: 80-100).",
  language: 'EN',
  summary: "You have Iron Deficiency Anemia. Your body doesn't have enough iron to make hemoglobin, which carries oxygen in your blood. This is why you feel tired.",
  hindiSummary: "आपको आयरन की कमी से होने वाला एनीमिया है। आपके शरीर में हीमोग्लोबिन बनाने के लिए पर्याप्त आयरन नहीं है, जो आपके रक्त में ऑक्सीजन ले जाता है। इसीलिए आप थका हुआ महसूस करते हैं।",
  labValues: [
    { name: 'Hemoglobin', value: 9.5, unit: 'g/dL', status: 'LOW', referenceRange: '12-16' },
    { name: 'Ferritin', value: 8, unit: 'ng/mL', status: 'LOW', referenceRange: '15-150' },
    { name: 'MCV', value: 75, unit: 'fL', status: 'LOW', referenceRange: '80-100' },
  ],
  organFlags: ['blood'],
  exerciseFlags: ['ANEMIA_LIGHT'],
  dietaryFlags: ['IRON_RICH', 'VITAMIN_C'],
  jargonMap: {
    'Ferritin': 'Iron stores in your body',
    'MCV': 'Average size of your red blood cells',
    'Hemoglobin': 'Protein in red blood cells that carries oxygen'
  },
  ai_confidence_score: 95,
  checklist: [
    { id: '1', task: 'Take prescribed iron supplements with orange juice (Vitamin C)', completed: false },
    { id: '2', task: 'Eat more green leafy vegetables like spinach', completed: false },
    { id: '3', task: 'Schedule a follow-up blood test in 4 weeks', completed: false },
  ],
  xp: 50,
  level: 1,
  avatarState: 'HAPPY',
};

export const mockLiver: Partial<GUCState> = {
  reportText: "Patient reports abdominal discomfort. Lab results: ALT 120 U/L (Normal: 7-55), AST 95 U/L (Normal: 8-48), Bilirubin Total 2.5 mg/dL (Normal: 0.1-1.2).",
  language: 'EN',
  summary: "Your liver enzyme levels are elevated, suggesting some inflammation or stress on your liver. Bilirubin levels are also higher than normal.",
  hindiSummary: "आपके लीवर एंजाइम का स्तर बढ़ा हुआ है, जो आपके लीवर में कुछ सूजन या तनाव का संकेत देता है। बिलीरुबिन का स्तर भी सामान्य से अधिक है।",
  labValues: [
    { name: 'ALT', value: 120, unit: 'U/L', status: 'HIGH', referenceRange: '7-55' },
    { name: 'AST', value: 95, unit: 'U/L', status: 'HIGH', referenceRange: '8-48' },
    { name: 'Bilirubin Total', value: 2.5, unit: 'mg/dL', status: 'HIGH', referenceRange: '0.1-1.2' },
  ],
  organFlags: ['liver'],
  exerciseFlags: ['LIVER_RESTRICTED'],
  dietaryFlags: ['LOW_FAT', 'NO_ALCOHOL'],
  jargonMap: {
    'ALT': 'Liver enzyme related to liver health',
    'AST': 'Another enzyme that may indicate liver damage',
    'Bilirubin': 'Yellow pigment formed in the liver'
  },
  ai_confidence_score: 92,
  checklist: [
    { id: '1', task: 'Avoid fried and fatty foods', completed: false },
    { id: '2', task: 'Complete abstinence from alcohol', completed: false },
    { id: '3', task: 'Ultra-sound of upper abdomen as suggested', completed: false },
  ],
  xp: 120,
  level: 2,
  avatarState: 'IDLE',
};

export const mockVitaminD: Partial<GUCState> = {
  reportText: "Patient reports fatigue and joint pain. Lab results: 25-OH Vitamin D 15 ng/mL (Normal: 30-100), Calcium 8.8 mg/dL (Normal: 8.5-10.2).",
  language: 'EN',
  summary: "You have a Vitamin D deficiency. This can cause bone pain and weakness. Your calcium levels are currently at the lower end of normal.",
  hindiSummary: "आपमें विटामिन डी की कमी है। इससे हड्डियों में दर्द और कमजोरी हो सकती है। आपका कैल्शियम स्तर वर्तमान में सामान्य के निचले स्तर पर है।",
  labValues: [
    { name: '25-OH Vitamin D', value: 15, unit: 'ng/mL', status: 'LOW', referenceRange: '30-100' },
    { name: 'Calcium', value: 8.8, unit: 'mg/dL', status: 'NORMAL', referenceRange: '8.5-10.2' },
  ],
  organFlags: ['bones'],
  exerciseFlags: ['NORMAL_ACTIVE'],
  dietaryFlags: ['VITAMIN_D_RICH', 'CALCIUM_RICH'],
  jargonMap: {
    '25-OH Vitamin D': 'The main form of Vitamin D in your blood',
    'Calcium': 'Mineral essential for bone health'
  },
  ai_confidence_score: 98,
  checklist: [
    { id: '1', task: 'Spend 15-20 minutes in early morning sunlight', completed: false },
    { id: '2', task: 'Start Vitamin D3 supplements as prescribed', completed: false },
    { id: '3', task: 'Include dairy products or fortified foods in diet', completed: false },
  ],
  xp: 80,
  level: 1,
  avatarState: 'HAPPY',
};

export const mockData = [mockAnemia, mockLiver, mockVitaminD];
