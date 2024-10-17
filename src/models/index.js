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
User.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'companyId' });
Company.hasMany(User, { foreignKey: 'companyId' });

// 2. User and Department
User.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'departmentId' });
Department.hasMany(User, { foreignKey: 'departmentId' });

// 3. User and Role
User.belongsTo(Role, { foreignKey: 'roleId', targetKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// 4. Department and Company
Department.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'companyId' });
Company.hasMany(Department, { foreignKey: 'companyId' });

// 5. Assessment and Company
Assessment.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'companyId' });
Company.hasMany(Assessment, { foreignKey: 'companyId' });

// 6. Assessment and Department
Assessment.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'departmentId' });
Department.hasMany(Assessment, { foreignKey: 'departmentId' });

// 7. AssessmentQuestion and Assessment
AssessmentQuestion.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'assessmentId' });
Assessment.hasMany(AssessmentQuestion, { foreignKey: 'assessmentId' });

// 8. AssessmentQuestion and MasterQuestion
AssessmentQuestion.belongsTo(MasterQuestion, { foreignKey: 'questionId', targetKey: 'questionId' });
MasterQuestion.hasMany(AssessmentQuestion, { foreignKey: 'questionId' });

// 9. Answer and AssessmentQuestion
Answer.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'assessmentQuestionId' });
AssessmentQuestion.hasMany(Answer, { foreignKey: 'assessmentQuestionId' });

// 10. Answer and User
Answer.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(Answer, { foreignKey: 'userId' });

// 11. Comment and AssessmentQuestion
Comment.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'assessmentQuestionId' });
AssessmentQuestion.hasMany(Comment, { foreignKey: 'assessmentQuestionId' });

// 12. Comment and User
Comment.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(Comment, { foreignKey: 'userId' });

// 13. EvidenceFile and User
EvidenceFile.belongsTo(User, { foreignKey: 'uploadedByUserId', targetKey: 'userId' });
User.hasMany(EvidenceFile, { foreignKey: 'uploadedByUserId' });

// 14. EvidenceFile and Assessment
EvidenceFile.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'assessmentId' });
Assessment.hasMany(EvidenceFile, { foreignKey: 'assessmentId' });

// 15. AnswerEvidenceFile and Answer
AnswerEvidenceFile.belongsTo(Answer, { foreignKey: 'answerId', targetKey: 'answerId' });
Answer.hasMany(AnswerEvidenceFile, { foreignKey: 'answerId' });

// 16. AnswerEvidenceFile and EvidenceFile
AnswerEvidenceFile.belongsTo(EvidenceFile, { foreignKey: 'evidenceFileId', targetKey: 'evidenceFileId' });
EvidenceFile.hasMany(AnswerEvidenceFile, { foreignKey: 'evidenceFileId' });

// 17. Answer and EvidenceFile (many-to-many relationship)
Answer.belongsToMany(EvidenceFile, {
  through: AnswerEvidenceFile,
  as: 'EvidenceFiles',
  foreignKey: 'answerId',
  otherKey: 'evidenceFileId'
});

// 18. QuestionDepartmentLink and MasterQuestion
QuestionDepartmentLink.belongsTo(MasterQuestion, { foreignKey: 'questionId', targetKey: 'questionId' });
MasterQuestion.hasMany(QuestionDepartmentLink, { foreignKey: 'questionId' });

// 19. QuestionDepartmentLink and MasterDepartment
QuestionDepartmentLink.belongsTo(MasterDepartment, { foreignKey: 'departmentId', targetKey: 'departmentId' });
MasterDepartment.hasMany(QuestionDepartmentLink, { foreignKey: 'departmentId' });

// 20. Department and MasterDepartment
Department.belongsTo(MasterDepartment, { foreignKey: 'departmentId', targetKey: 'departmentId' });
MasterDepartment.hasMany(Department, { foreignKey: 'departmentId' });

// 21. Otp and User
Otp.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(Otp, { foreignKey: 'userId' });

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
