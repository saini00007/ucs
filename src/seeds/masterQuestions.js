// seeds/masterQuestions.js
import Question from '../models/MasterQuestion.js'; // Import your Question model
import QuestionDepartmentLink from '../models/QuestionDepartmentLink.js'; // Import your junction model
import MasterDepartment from '../models/MasterDepartment.js'; // Import your Department model
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
        'SP 800-53 Control Number': sp_800_53_control_number,
        Question: question_text,
        'ISO 27001:2022 Control ID Number': iso_27001_2022_control_id_number,
        'NIST CSF Control ID': nist_csf_control_id,
        'MITRE Defend Control ID': mitre_defend_control_id,
        'NIST 800-82 Control ID': nist_800_82_control_id,
        'IEC 62443 Control ID': iec_62443_control_id,
        PCIDSS: pcidss,
        'suggested evidence': suggested_evidence,
        Department: department,
        'Control Family Full Form': control_family_full_form,
      } = row;

      // Trim whitespace from both ends of each string
      const trimmedData = {
        srno: SRNO?.toString().trim(),
        sp_800_53_control_number: sp_800_53_control_number?.toString().trim(),
        question_text: question_text?.toString().trim(),
        iso_27001_2022_control_id_number: iso_27001_2022_control_id_number?.toString().trim(),
        nist_csf_control_id: nist_csf_control_id?.toString().trim(),
        mitre_defend_control_id: mitre_defend_control_id?.toString().trim(),
        nist_800_82_control_id: nist_800_82_control_id?.toString().trim(),
        iec_62443_control_id: iec_62443_control_id?.toString().trim(),
        pcidss: pcidss?.toString().trim(),
        suggested_evidence: suggested_evidence?.toString().trim(),
        department: department?.toString().trim(),
        control_family_full_form: control_family_full_form?.toString().trim(),
      };

      console.log(`Processing Question: ${trimmedData.question_text}, Department: ${trimmedData.department}`);

      // Insert question into MasterQuestion
      const question = await Question.create(trimmedData);
      console.log(`Question inserted with ID: ${question.question_id}`);

      // Find the department by name and get its ID
      if (trimmedData.department) {
        const departmentRecord = await MasterDepartment.findOne({
          where: { department_name: trimmedData.department }
        });

        if (departmentRecord) {
          const questionDepartmentLink = {
            question_id: question.question_id,
            master_department_id: departmentRecord.department_id,
          };

          await QuestionDepartmentLink.create(questionDepartmentLink);
          console.log(`Link created for Question ID: ${question.question_id} and Department ID: ${departmentRecord.department_id}`);
        } else {
          console.warn(`Department not found for Question ID: ${question.question_id}`);
        }
      } else {
        console.warn(`Department name is missing for Question ID: ${question.question_id}`);
      }
    }
  } catch (error) {
    console.error('Error seeding master questions:', error);
  }
};

export default seedMasterQuestions;
