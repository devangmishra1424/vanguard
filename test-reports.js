const fs = require('fs');
const path = require('path');

// Test by converting a simple text lab report to base64 image pattern
const testReports = [
  {
    name: 'Report 1 - Diabetes Focus',
    findings: `
      Patient: John Doe, Age: 45
      ══════════════════════════════════════════════════════
      Test Name                 Result    Unit      Ref Range    Status
      ══════════════════════════════════════════════════════
      Fasting Blood Glucose (FBG)  184     mg/dL     70-99        HIGH
      HbA1c                         8.6     %         <5.6         HIGH
      Total Cholesterol             224     mg/dL     <200         HIGH
      HDL Cholesterol              32      mg/dL     >40          LOW
      LDL Cholesterol              158     mg/dL     <100         HIGH
      Triglycerides                238     mg/dL     <150         HIGH
      ══════════════════════════════════════════════════════
    `
  },
  {
    name: 'Report 2 - Kidney Focus',
    findings: `
      Patient: Jane Smith, Age: 58
      ══════════════════════════════════════════════════════
      Test Name                     Result    Unit              Ref Range
      ══════════════════════════════════════════════════════
      Creatinine                    2.1       mg/dL             0.6-1.2      HIGH
      eGFR                          32        mL/min/1.73m²     >60          LOW
      BUN                           48        mg/dL             7-20         HIGH
      Potassium                     5.8       mmol/L            3.5-5.0      HIGH
      Sodium                        138       mmol/L            135-145      NORMAL
      Uric Acid                     9.5       mg/dL             2.4-7.0      HIGH
      ACR (Urine)                   156       mg/g              <30          HIGH
      ══════════════════════════════════════════════════════
    `
  },
  {
    name: 'Report 3 - Liver Focus',
    findings: `
      Patient: Robert Johnson, Age: 52
      ══════════════════════════════════════════════════════
      Test Name                 Result    Unit      Ref Range
      ══════════════════════════════════════════════════════
      SGPT (ALT)                  78       U/L       <45          HIGH
      SGOT (AST)                  82       U/L       <40          HIGH
      Bilirubin (Total)           1.8      mg/dL     <1.2         HIGH
      Bilirubin (Direct)          0.6      mg/dL     <0.4         HIGH
      Alkaline Phosphatase        156      U/L       44-147       HIGH
      GGT                         82       U/L       <36          HIGH
      Albumin                     3.2      g/dL      3.5-5.5      LOW
      ══════════════════════════════════════════════════════
    `
  },
  {
    name: 'Report 4 - Heart/Lipid Focus',
    findings: `
      Patient: Sarah Williams, Age: 48
      ══════════════════════════════════════════════════════
      Test Name                 Result    Unit      Ref Range
      ══════════════════════════════════════════════════════
      Total Cholesterol          268       mg/dL     <200         HIGH
      HDL Cholesterol            28        mg/dL     >40          LOW
      LDL Cholesterol            198       mg/dL     <100         HIGH
      Triglycerides              340       mg/dL     <150         HIGH
      VLDL Cholesterol           68        mg/dL     <40          HIGH
      Glucose (Fasting)          126       mg/dL     <100         HIGH
      ══════════════════════════════════════════════════════
    `
  },
  {
    name: 'Report 5 - Thyroid/Anemia Focus',
    findings: `
      Patient: Michael Brown, Age: 61
      ══════════════════════════════════════════════════════
      Test Name                 Result    Unit      Ref Range
      ══════════════════════════════════════════════════════
      TSH                        8.2       mIU/L     0.4-4.5      HIGH
      Free T4                    0.8       ng/dL     0.93-1.70    LOW
      Hemoglobin                 10.2      g/dL      12.0-17.5    LOW
      RBC Count                  3.8       M/μL      4.5-5.5      LOW
      Hematocrit (PCV)           32        %         40-50        LOW
      Serum Iron                 45        μg/dL     60-170       LOW
      Vitamin B12                180       pg/mL     211-911      LOW
      Folic Acid                 2.1       ng/mL     3.0-17.0     LOW
      ══════════════════════════════════════════════════════
    `
  }
];

// Simulate text→base64 for testing
function textToBase64Image(text) {
  // For testing, we'll just encode the text as base64
  return Buffer.from(text).toString('base64');
}

async function runTests() {
  console.log('🚀 Testing Report Analysis with RAG Mode\n');
  
  for (const report of testReports) {
    console.log(`\n📋 ${report.name}`);
    console.log('=' .repeat(60));
    
    const base64Image = textToBase64Image(report.findings);
    
    try {
      const response = await fetch('http://localhost:3000/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image,
          mimeType: 'text/plain',
          isPDF: false
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        continue;
      }
      
      console.log(`✅ Extracted ${result.labValues?.length || 0} findings:`);
      
      if (result.labValues && result.labValues.length > 0) {
        // Sort by status for clarity
        const abnormal = result.labValues.filter(f => f.status !== 'NORMAL');
        const normal = result.labValues.filter(f => f.status === 'NORMAL');
        
        if (abnormal.length > 0) {
          console.log('\n  🔴 ABNORMAL:');
          abnormal.forEach(f => {
            console.log(`    • ${f.name}: ${f.value} ${f.unit} [${f.status}]`);
          });
        }
        
        if (normal.length > 0) {
          console.log('\n  ✅ NORMAL:');
          normal.forEach(f => {
            console.log(`    • ${f.name}: ${f.value} ${f.unit}`);
          });
        }
      }
      
      if (result.affectedOrgans && result.affectedOrgans.length > 0) {
        console.log(`\n🏥 Affected Organs: ${result.affectedOrgans.join(', ')}`);
      }
      
      if (result.ragEnhancedContext) {
        console.log('\n🤖 RAG Context Available: Yes');
      }
      
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Report testing complete!');
}

// Run tests
runTests().catch(console.error);
