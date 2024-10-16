import User from './User.js';
import Company from './Company.js';
import Department from './Department.js';
import Role from './Role.js';
import Assessment from './Assessment.js';
import AssessmentQuestion from './AssessmentQuestion.js';
import Answer from './Answer.js';
import Comment from './Comment.js';
import EvidenceFile from './EvidenceFile.js';
import MasterDepartment from './MasterDepartment.js';
import MasterQuestion from './MasterQuestion.js';
import Otp from './Otp.js';
import AnswerEvidenceFile from './AnswerEvidenceFile.js';
import QuestionDepartmentLink from './QuestionDepartmentLink.js';

// 1. User and Company
User.belongsTo(Company, { foreignKey: 'company_id', targetKey: 'company_id' });
Company.hasMany(User, { foreignKey: 'company_id' });

// 2. User and Department
User.belongsTo(Department, { foreignKey: 'department_id', targetKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

// 3. User and Role
User.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// 4. Department and Company
Department.belongsTo(Company, { foreignKey: 'company_id', targetKey: 'company_id' });
Company.hasMany(Department, { foreignKey: 'company_id' });

// 5. Assessment and Company
Assessment.belongsTo(Company, { foreignKey: 'company_id', targetKey: 'company_id' });
Company.hasMany(Assessment, { foreignKey: 'company_id' });

// 6. Assessment and Department
Assessment.belongsTo(Department, { foreignKey: 'department_id', targetKey: 'department_id' });
Department.hasMany(Assessment, { foreignKey: 'department_id' });

// 7. AssessmentQuestion and Assessment
AssessmentQuestion.belongsTo(Assessment, { foreignKey: 'assessment_id', targetKey: 'assessment_id' });
Assessment.hasMany(AssessmentQuestion, { foreignKey: 'assessment_id' });

// 8. AssessmentQuestion and MasterQuestion
AssessmentQuestion.belongsTo(MasterQuestion, { foreignKey: 'question_id', targetKey: 'question_id' });
MasterQuestion.hasMany(AssessmentQuestion, { foreignKey: 'question_id' });

// 9. Answer and AssessmentQuestion
Answer.belongsTo(AssessmentQuestion, { foreignKey: 'assessment_question_id', targetKey: 'assessment_question_id' });
AssessmentQuestion.hasMany(Answer, { foreignKey: 'assessment_question_id' });

// 10. Answer and User
Answer.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });
User.hasMany(Answer, { foreignKey: 'user_id' });

// 11. Comment and AssessmentQuestion
Comment.belongsTo(AssessmentQuestion, { foreignKey: 'assessment_question_id', targetKey: 'assessment_question_id' });
AssessmentQuestion.hasMany(Comment, { foreignKey: 'assessment_question_id' });

// 12. Comment and User
Comment.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });
User.hasMany(Comment, { foreignKey: 'user_id' });

// 13. EvidenceFile and User
EvidenceFile.belongsTo(User, { foreignKey: 'uploaded_by_user_id', targetKey: 'user_id' });
User.hasMany(EvidenceFile, { foreignKey: 'uploaded_by_user_id' });

// 14. EvidenceFile and Assessment
EvidenceFile.belongsTo(Assessment, { foreignKey: 'assessment_id', targetKey: 'assessment_id' });
Assessment.hasMany(EvidenceFile, { foreignKey: 'assessment_id' });

// 15. AnswerEvidenceFile and Answer
AnswerEvidenceFile.belongsTo(Answer, { foreignKey: 'answerId', targetKey: 'answer_id' });
Answer.hasMany(AnswerEvidenceFile, { foreignKey: 'answerId' });

// 16. AnswerEvidenceFile and EvidenceFile
AnswerEvidenceFile.belongsTo(EvidenceFile, { foreignKey: 'evidenceFileId', targetKey: 'evidence_file_id' });
EvidenceFile.hasMany(AnswerEvidenceFile, { foreignKey: 'evidenceFileId' });

// 17. Answer and EvidenceFile (many-to-many relationship)
Answer.belongsToMany(EvidenceFile, {
  through: AnswerEvidenceFile,
  as: 'EvidenceFiles', // This alias should match the alias used in the query
  foreignKey: 'answerId',
  otherKey: 'evidenceFileId'
});

// 18. QuestionDepartmentLink and MasterQuestion
QuestionDepartmentLink.belongsTo(MasterQuestion, { foreignKey: 'question_id', targetKey: 'question_id' });
MasterQuestion.hasMany(QuestionDepartmentLink, { foreignKey: 'question_id' });

// 19. QuestionDepartmentLink and MasterDepartment
QuestionDepartmentLink.belongsTo(MasterDepartment, { foreignKey: 'master_department_id', targetKey: 'department_id' });
MasterDepartment.hasMany(QuestionDepartmentLink, { foreignKey: 'master_department_id' });

// 20. Department and MasterDepartment
Department.belongsTo(MasterDepartment, { foreignKey: 'master_department_id', targetKey: 'department_id' });
MasterDepartment.hasMany(Department, { foreignKey: 'master_department_id' });

// 21. Otp and User
Otp.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });
User.hasMany(Otp, { foreignKey: 'user_id' });

export {
  User,
  Company,
  Department,
  Role,
  Assessment,
  AssessmentQuestion,
  Answer,
  Comment,
  EvidenceFile,
  MasterDepartment,
  MasterQuestion,
  Otp,
  AnswerEvidenceFile,
  QuestionDepartmentLink,
};
