import MasterQuestion from '../models/MasterQuestion.js';
import MasterDepartment from '../models/MasterDepartment.js';
import MasterSubDepartment from '../models/MasterSubDepartment.js';
import QuestionDepartmentLink from '../models/QuestionDepartmentLink.js';
import ISO27001Control from '../models/ISO27001Control.js';
import NISTCSFControl from '../models/NISTCSFControl.js';
import MITREControl from '../models/MITREControl.js';
import NIST80082Control from '../models/NIST80082Control.js';
import IEC62443Control from '../models/IEC62443Control.js';
import PCIDSSControl from '../models/PCIDSSControl.js';
import RiskVulnerabilityAssessment from '../models/RiskVulnerabilityAssessment.js';
import * as xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_EXCEL_PATH = path.join(__dirname, 'masterQuestions.xlsx');

const parseFloatSafe = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const trimValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value.trim();
  return value;
};

const seedMasterQuestions = async (customFilePath = DEFAULT_EXCEL_PATH) => {
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
        // Create base question data
        const questionData = {
          srno: parseInt(row['SRNO']) || null,
          sp80053ControlNum: trimValue(row['SP 800-53 Control Number']),
          controlName: trimValue(row['Control (or Control Enhancement) Name']),
          questionText: trimValue(row['Question']),
          department: trimValue(row['Department']),
          subDepartment: trimValue(row['Sub-Department'])
        };

        console.log(`Processing Question ${index + 1}/${rows.length}: "${questionData.questionText?.substring(0, 50)}..."`);

        if (!questionData.department) {
          console.warn(`No department specified for question ${index + 1}`);
          continue;
        }

        // Find the department
        const department = await MasterDepartment.findOne({
          where: { departmentName: questionData.department }
        });

        if (!department) {
          console.warn(`Department "${questionData.department}" not found for question ${index + 1}`);
          continue;
        }

        // Find or create the subdepartment
        const [subDepartment] = await MasterSubDepartment.findOrCreate({
          where: { subDepartmentName: questionData.subDepartment }
        });

        // Create the master question
        const question = await MasterQuestion.create({
          ...questionData,
          masterDepartmentId: department.id,
          masterSubDepartmentId: subDepartment.id
        });

        console.log(`Question inserted with ID: ${question.id}`);

        // Create department link
        await QuestionDepartmentLink.create({
          masterQuestionId: question.id,
          masterDepartmentId: department.id
        });

        // Create RiskVulnerabilityAssessment
        await RiskVulnerabilityAssessment.create({
          masterQuestionId: question.id,
          vulnerabilityDesc: trimValue(row['VULNERBILITY DESCRIPTION']),
          vulnerabilityRating: trimValue(row['Vulnerability Rating']),
          vulnerabilityValue: parseFloatSafe(trimValue(row['Vulnerability Value'])),
          riskLikelihoodScore: parseFloatSafe(trimValue(row['Risk Likelihood Score'])),
          riskLikelihoodValue: parseFloatSafe(trimValue(row['Risk Likelihood Value'])),
          riskLikelihoodRating: trimValue(row['Risk Likelihood Rating']),
          ermLikelihoodRating: trimValue(row['ERM Likelihood Rating']),
          operationalImpactDesc: trimValue(row['Operational Impact Description']),
          businessImpactDesc: trimValue(row['Business Impact Description']),
          financialImpactRating: parseFloatSafe(trimValue(row['Financial Impact Rating'])),
          reputationalImpactRating: parseFloatSafe(trimValue(row['Reputational Impact Rating'])),
          legalImpactRating: parseFloatSafe(trimValue(row['Legal Impact Rating'])),
          complianceImpactRating: parseFloatSafe(trimValue(row['Compliance Impact Rating'])),
          objAndProdOperImpactRating: parseFloatSafe(trimValue(row['Objectives & Production Operations Impact Rating'])),
          riskImpactValue: parseFloatSafe(trimValue(row['Risk Impact Value'])),
          riskImpactRating: trimValue(row['Risk Impact Rating']),
          inherentRisk: trimValue(row['Inherent Risk']),
          currentRiskValue: parseFloatSafe(trimValue(row['Current Risk Value'])),
          currentRiskRating: trimValue(row['Current Risk Rating']),
          ermRiskRating: trimValue(row['ERM Risk Rating']),
          riskOwner: trimValue(row['Risk Owner']),
          riskTreatmentPlan1: trimValue(row['Risk Treatment Plan (Recommendations)1']),
          riskTreatmentPlan2: trimValue(row['Risk Treatment Plan (Recommendations)2']),
          riskTreatmentPlan3: trimValue(row['Risk Treatment Plan (Recommendations)3']),
          riskTreatmentPlan4: trimValue(row['Risk Treatment Plan (Recommendations)4']),
          riskTreatmentPlan5: trimValue(row['Risk Treatment Plan (Recommendations)5']),
          revRiskLikelihoodRating: parseFloatSafe(trimValue(row['Revised Risk Likelihood Rating'])),
          revRiskImpactRating: parseFloatSafe(trimValue(row['Revised Risk Impact Rating'])),
          targetRiskRating: trimValue(row['Taget Risk Risk Rating'])
        });

        // Create associated controls if data exists
        if (row['ISO 27001:2022 Control ID Number']) {
          await ISO27001Control.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['ISO 27001:2022 Control ID Number']),
            controlDetails: JSON.stringify({
              controlNumber: trimValue(row['ISO 27001:2022 Control ID Number'])
            })
          });
        }

        if (row['NIST CSF Control ID']) {
          await NISTCSFControl.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['NIST CSF Control ID']),
            frameworkDetails: JSON.stringify({
              controlNumber: trimValue(row['NIST CSF Control ID'])
            })
          });
        }

        if (row['MITRE Defend Control ID']) {
          await MITREControl.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['MITRE Defend Control ID']),
            mitreDetails: JSON.stringify({
              controlNumber: trimValue(row['MITRE Defend Control ID'])
            })
          });
        }

        if (row['NIST 800-82 Control ID']) {
          await NIST80082Control.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['NIST 800-82 Control ID']),
            controlDetails: JSON.stringify({
              controlNumber: trimValue(row['NIST 800-82 Control ID'])
            })
          });
        }

        if (row['IEC 62443 Control ID']) {
          await IEC62443Control.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['IEC 62443 Control ID']),
            controlDetails: JSON.stringify({
              controlNumber: trimValue(row['IEC 62443 Control ID'])
            })
          });
        }

        if (row['PCIDSS']) {
          await PCIDSSControl.create({
            masterQuestionId: question.id,
            controlId: trimValue(row['PCIDSS']),
            pciDetails: JSON.stringify({
              controlNumber: trimValue(row['PCIDSS'])
            })
          });
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

export default seedMasterQuestions;