import {MasterQuestion,QuestionDepartmentLink,MasterDepartment} from '../models/index.js';

import { faker } from '@faker-js/faker';

const generateFakeData = (count) => {
  const departments = [
    'Network Security',
    'Application Security',
    'Compliance and Risk Management',
    'Incident Response Team',
    'Cybersecurity Training and Awareness',
    'Security Operations Center (SOC)',
    'Human Resources'
  ];

  return Array.from({ length: count }, (_, i) => ({
    SRNO: i + 1,
    'SP 800-53 Control Number': faker.string.alphanumeric(10),
    Question: faker.lorem.sentence(),
    'ISO 27001:2022 Control ID Number': faker.string.alphanumeric(10),
    'NIST CSF Control ID': faker.string.alphanumeric(10),
    'MITRE Defend Control ID': faker.string.alphanumeric(10),
    'NIST 800-82 Control ID': faker.string.alphanumeric(10),
    'IEC 62443 Control ID': faker.string.alphanumeric(10),
    PCIDSS: faker.string.alphanumeric(10),
    'suggested evidence': faker.lorem.sentence(),
    Department: faker.helpers.arrayElement(departments),
    'Control Family Full Form': faker.lorem.words(3),
  }));
};

// Seed MasterQuestions table with fake data
const seedMasterQuestions = async (count = 50) => {
  try {
    const data = generateFakeData(count);

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

      console.log(`Processing Question: "${trimmedData.questionText}", Department: "${trimmedData.department}"`);

      const question = await MasterQuestion.create(trimmedData);
      console.log(`Question inserted with ID: ${question.id}`);

      if (trimmedData.department) {
        const departmentRecord = await MasterDepartment.findOne({
          where: { departmentName: trimmedData.department }
        });

        if (departmentRecord) {
          const questionDepartmentLink = {
            masterQuestionId: question.id,
            masterDepartmentId: departmentRecord.id,
          };

          await QuestionDepartmentLink.create(questionDepartmentLink);
          console.log(`Link created for Question ID: ${question.id} and Department ID: ${departmentRecord.id}`);
        } else {
          console.warn(`Department "${trimmedData.department}" not found for Question ID: ${question.id}`);
        }
      } else {
        console.warn(`Department name is missing for Question ID: ${question.id}`);
      }
    }
  } catch (error) {
    console.error('Error seeding master questions:', error);
  }
};

export default seedMasterQuestions;
