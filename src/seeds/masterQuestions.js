import { MasterQuestion, QuestionDepartmentLink, MasterDepartment } from '../models/index.js';
import { faker } from '@faker-js/faker';

const seedMasterQuestions = async () => {
  try {
    const departments = [
      'Network Security',
      'Application Security',
      'Compliance and Risk Management',
      'Incident Response Team',
      'Cybersecurity Training and Awareness',
      'Security Operations Center (SOC)',
      'Human Resources'
    ];

    for (let i = 0; i < 1000; i++) {
      const questionData = {
        srNo: faker.number.int({ min: 1, max: 1000 }),
        sp80053ControlNumber: `AC-${faker.number.int({ min: 1, max: 53 })}`,
        questionText: faker.lorem.sentence(),
        vulnerabilityDescription: faker.lorem.sentences(2),
        vulnerabilityRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        vulnerabilityValue: faker.number.int({ min: 1, max: 10 }),
        riskLikelihoodScore: faker.number.int({ min: 1, max: 10 }),
        riskLikelihoodValue: faker.number.int({ min: 1, max: 10 }),
        riskLikelihoodRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        ermLikelihoodRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        operationalImpactDescription: faker.lorem.sentences(2),
        businessImpactDescription: faker.lorem.sentences(2),
        healthSafetyRating: faker.number.int({ min: 1, max: 10 }),
        environmentImpactRating: faker.number.int({ min: 1, max: 10 }),
        financialImpactRating: faker.number.int({ min: 1, max: 10 }),
        reputationalImpactRating: faker.number.int({ min: 1, max: 10 }),
        legalImpactRating: faker.number.int({ min: 1, max: 10 }),
        complianceImpactRating: faker.number.int({ min: 1, max: 10 }),
        objectivesAndProductionOperationsImpactRating: faker.number.int({ min: 1, max: 10 }),
        riskImpactValue: faker.number.int({ min: 1, max: 10 }),
        riskImpactRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        inherentRisk: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        currentRiskValue: faker.number.int({ min: 1, max: 10 }),
        currentRiskRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        ermRiskRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        riskOwner: faker.person.fullName(), // Updated
        riskTreatmentPlan1: faker.lorem.sentences(2),
        riskTreatmentPlan2: faker.lorem.sentences(2),
        riskTreatmentPlan3: faker.lorem.sentences(2),
        riskTreatmentPlan4: faker.lorem.sentences(2),
        riskTreatmentPlan5: faker.lorem.sentences(2),
        revisedRiskLikelihoodRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        revisedRiskImpactRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        targetRiskRating: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
        department: faker.helpers.arrayElement(departments),
      };

      console.log(`Processing Question: "${questionData.questionText}"`);

      try {
        const question = await MasterQuestion.create(questionData);
        console.log(`Question inserted with ID: ${question.id}`);

        const departmentRecord = await MasterDepartment.findOne({
          where: { departmentName: questionData.department }
        });

        if (departmentRecord) {
          const questionDepartmentLink = {
            masterQuestionId: question.id,
            masterDepartmentId: departmentRecord.id,
          };

          await QuestionDepartmentLink.create(questionDepartmentLink);
          console.log(`Link created for Question ID: ${question.id} and Department ID: ${departmentRecord.id}`);
        } else {
          console.warn(`Department "${questionData.department}" not found for Question ID: ${question.id}`);
        }
      } catch (innerError) {
        console.error('Error inserting question or creating link:', innerError);
      }
    }
  } catch (error) {
    console.error('Error seeding master questions:', error);
  }
};

export default seedMasterQuestions;
