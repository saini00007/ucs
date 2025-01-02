import MasterQuestion from '../models/MasterQuestion.js';
import MasterDepartment from '../models/MasterDepartment.js';
import QuestionDepartmentLink from '../models/QuestionDepartmentLink.js';
import * as xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_EXCEL_PATH = path.join(__dirname, 'masterQuestions.xlsx');

// Helper function to convert string to float
const parseFloatSafe = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const seedMasterQuestionsFromExcel = async (customFilePath = DEFAULT_EXCEL_PATH) => {
  try {
    const filePath = customFilePath || DEFAULT_EXCEL_PATH;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at path: ${filePath}`);
    }

    console.log(`Reading Excel file from: ${filePath}`);
    const workbook = xlsx.readFile(filePath);

    if (!workbook.SheetNames.length) {
      throw new Error('Excel file contains no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${rows.length} questions to process`);

    for (const [index, row] of rows.entries()) {
      try {
        const questionData = {
          srno: parseInt(row['SRNO']) || null,
          sp80053ControlNum: row['SP 800-53 Control Number'] || null,
          controlName: row['Control (or Control Enhancement) Name'] || null,
          iso270012022CIdNum: row['ISO 27001:2022 Control ID Number'] || null,
          nistCsfControlId: row['NIST CSF Control ID'] || null,
          mitreDefendControlId: row['MITRE Defend Control ID'] || null,
          nist80082ControlId: row['NIST 800-82 Control ID'] || null,
          iec62443ControlId: row['IEC 62443 Control ID'] || null,
          pcidss: row['PCIDSS'] || null,
          questionText: row['Question'] || null,
          vulnerabilityDesc: row['VULNERBILITY DESCRIPTION'] || null,
          vulnerabilityRating: row['Vulnerability Rating'] || null,
          vulnerabilityValue: parseFloatSafe(row['Vulnerability Value']),
          riskLikelihoodScore: parseFloatSafe(row['Risk Likelihood Score']),
          riskLikelihoodValue: parseFloatSafe(row['Risk Likelihood Value']),
          riskLikelihoodRating: row['Risk Likelihood Rating'] || null,
          ermLikelihoodRating: row['ERM Likelihood Rating'] || null,
          operationalImpactDesc: row['Operational Impact Description'] || null,
          businessImpactDesc: row['Business Impact Description'] || null,
          financialImpactRating: parseFloatSafe(row['Financial Impact Rating']),
          reputationalImpactRating: parseFloatSafe(row['Reputational Impact Rating']),
          legalImpactRating: parseFloatSafe(row['Legal Impact Rating']),
          complianceImpactRating: parseFloatSafe(row['Compliance Impact Rating']),
          objAndProdOperImpactRating: parseFloatSafe(row['Objectives & Production Operations Impact Rating']),
          riskImpactValue: parseFloatSafe(row['Risk Impact Value']),
          riskImpactRating: row['Risk Impact Rating'] || null,
          inherentRisk: row['Inherent Risk'] || null,
          currentRiskValue: parseFloatSafe(row['Current Risk Value']),
          currentRiskRating: row['Current Risk Rating'] || null,
          ermRiskRating: row['ERM Risk Rating'] || null,
          riskOwner: row['Risk Owner'] || null,
          riskTreatmentPlan1: row['Risk Treatment Plan (Recommendations)1'] || null,
          riskTreatmentPlan2: row['Risk Treatment Plan (Recommendations)2'] || null,
          riskTreatmentPlan3: row['Risk Treatment Plan (Recommendations)3'] || null,
          riskTreatmentPlan4: row['Risk Treatment Plan (Recommendations)4'] || null,
          riskTreatmentPlan5: row['Risk Treatment Plan (Recommendations)5'] || null,
          revRiskLikelihoodRating: parseFloatSafe(row['Revised Risk Likelihood Rating']),
          revRiskImpactRating: parseFloatSafe(row['Revised Risk Impact Rating']),
          targetRiskRating: row['Taget Risk Risk Rating'] || null,
          department: row['Department'] || null
        };

        console.log(`Processing Question ${index + 1}/${rows.length}: "${questionData.questionText?.substring(0, 50)}..."`);

        // Create the question first
        const question = await MasterQuestion.create(questionData);
        console.log(`Question inserted with ID: ${question.id}`);

        // If department is specified, create the link
        if (questionData.department) {
          const departmentName = questionData.department.trim();

          // Find the department
          const department = await MasterDepartment.findOne({
            where: { departmentName: departmentName }
          });

          if (department) {
            // Create the link
            await QuestionDepartmentLink.create({
              masterQuestionId: question.id,
              masterDepartmentId: department.id
            });
            console.log(`Created department link for question ${question.id} with department ${department.id} (${departmentName})`);
          } else {
            console.warn(`Department "${departmentName}" not found for question ${question.id}`);
          }
        }

      } catch (innerError) {
        console.error(`Error processing row ${index + 1}:`, innerError.message);
        console.error('Row data:', JSON.stringify(row, null, 2));
      }
    }

    console.log('Successfully completed processing all questions');
  } catch (error) {
    console.error('Error seeding master questions from Excel:', error.message);
    throw error;
  }
};

export default seedMasterQuestionsFromExcel;

// Only run directly if this is the main module
if (import.meta.url === fileURLToPath(import.meta.url)) {
  seedMasterQuestionsFromExcel()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}