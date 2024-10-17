// seeds/masterQuestions.js
import MasterQuestion from '../models/MasterQuestion.js'; 
import QuestionDepartmentLink from '../models/QuestionDepartmentLink.js'; 
import MasterDepartment from '../models/MasterDepartment.js'; 
import xlsx from 'xlsx';

const seedMasterQuestions = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    for (const row of data) {
      const {
        SRNO,
        'SP 800-53 Control Number': sp80053ControlNumber,
        Question: questionText,
        'ISO 27001:2022 Control ID Number': iso27001ControlIdNumber,
        'NIST CSF Control ID': nistCsfControlId,
        'MITRE Defend Control ID': mitreDefendControlId,
        'NIST 800-82 Control ID': nist80082ControlId,
        'IEC 62443 Control ID': iec62443ControlId,
        PCIDSS: pcidss,
        'suggested evidence': suggestedEvidence,
        Department: department,
        'Control Family Full Form': controlFamilyFullForm,
      } = row;

      // Trim whitespace from both ends of each string
      const trimmedData = {
        srno: SRNO?.toString().trim(),
        sp80053ControlNumber: sp80053ControlNumber?.toString().trim(),
        questionText: questionText?.toString().trim(),
        iso27001ControlIdNumber: iso27001ControlIdNumber?.toString().trim(),
        nistCsfControlId: nistCsfControlId?.toString().trim(),
        mitreDefendControlId: mitreDefendControlId?.toString().trim(),
        nist80082ControlId: nist80082ControlId?.toString().trim(),
        iec62443ControlId: iec62443ControlId?.toString().trim(),
        pcidss: pcidss?.toString().trim(),
        suggestedEvidence: suggestedEvidence?.toString().trim(),
        department: department?.toString().trim(),
        controlFamilyFullForm: controlFamilyFullForm?.toString().trim(),
      };

      console.log(`Processing Question: ${trimmedData.questionText}, Department: ${trimmedData.department}`);

      // Insert question into MasterQuestion
      const question = await MasterQuestion.create(trimmedData);
      console.log(`Question inserted with ID: ${question.questionId}`);

      // Find the department by name and get its ID
      if (trimmedData.department) {
        const departmentRecord = await MasterDepartment.findOne({
          where: { departmentName: trimmedData.department } 
        });

        if (departmentRecord) {
          const questionDepartmentLink = {
            questionId: question.questionId, 
            masterDepartmentId: departmentRecord.departmentId, 
          };

          await QuestionDepartmentLink.create(questionDepartmentLink);
          console.log(`Link created for Question ID: ${question.questionId} and Department ID: ${departmentRecord.departmentId}`);
        } else {
          console.warn(`Department not found for Question ID: ${question.questionId}`);
        }
      } else {
        console.warn(`Department name is missing for Question ID: ${question.questionId}`);
      }
    }
  } catch (error) {
    console.error('Error seeding master questions:', error);
  }
};

export default seedMasterQuestions;
