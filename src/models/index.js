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
import AnswerEvidenceFileLink from './AnswerEvidenceFileLink.js';
import QuestionDepartmentLink from './QuestionDepartmentLink.js';

// 1. User and Company
User.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'id' });
Company.hasMany(User, { foreignKey: 'companyId' });

// 2. User and Department
User.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'id' });
Department.hasMany(User, { foreignKey: 'departmentId' });

// 3. User and Role
User.belongsTo(Role, { foreignKey: 'roleId', targetKey: 'id' });
Role.hasMany(User, { foreignKey: 'roleId' });

// 4. Department and Company
Department.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'id' });
Company.hasMany(Department, { foreignKey: 'companyId' });

// 5. Assessment and Company
Assessment.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'id' });
Company.hasMany(Assessment, { foreignKey: 'companyId' });

// 6. Assessment and Department
Assessment.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'id' });
Department.hasMany(Assessment, { foreignKey: 'departmentId' });

// 7. AssessmentQuestion and Assessment
AssessmentQuestion.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'id' });
Assessment.hasMany(AssessmentQuestion, { foreignKey: 'assessmentId' });

// 8. AssessmentQuestion and MasterQuestion
AssessmentQuestion.belongsTo(MasterQuestion, { foreignKey: 'masterQuestionId', targetKey: 'id' });
MasterQuestion.hasMany(AssessmentQuestion, { foreignKey: 'masterQuestionId' });

// 9. Answer and AssessmentQuestion
Answer.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'id' });
AssessmentQuestion.hasMany(Answer, { foreignKey: 'assessmentQuestionId' });

// 10. Answer and User
Answer.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(Answer, { foreignKey: 'createdByUserId' });

// 11. Comment and AssessmentQuestion
Comment.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'id' });
AssessmentQuestion.hasMany(Comment, { foreignKey: 'assessmentQuestionId' });

// 12. Comment and User
Comment.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(Comment, { foreignKey: 'createdByUserId' });

// 13. EvidenceFile and User
EvidenceFile.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(EvidenceFile, { foreignKey: 'createdByUserId' });

// 14. EvidenceFile and Assessment
EvidenceFile.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'id' });
Assessment.hasMany(EvidenceFile, { foreignKey: 'assessmentId' });

// 15. AnswerEvidenceFile and Answer
AnswerEvidenceFileLink.belongsTo(Answer, { foreignKey: 'answerId', targetKey: 'id' });
Answer.hasMany(AnswerEvidenceFileLink, { foreignKey: 'answerId' });

// 16. AnswerEvidenceFile and EvidenceFile
AnswerEvidenceFileLink.belongsTo(EvidenceFile, { foreignKey: 'evidenceFileId', targetKey: 'id' });
EvidenceFile.hasMany(AnswerEvidenceFileLink, { foreignKey: 'evidenceFileId' });

// 17. Answer and EvidenceFile (many-to-many relationship)
Answer.belongsToMany(EvidenceFile, {
  through: AnswerEvidenceFileLink,
  foreignKey: 'answerId',
  otherKey: 'evidenceFileId'
});

// 18. QuestionDepartmentLink and MasterQuestion
QuestionDepartmentLink.belongsTo(MasterQuestion, { foreignKey: 'masterQuestionId', targetKey: 'id' });
MasterQuestion.hasMany(QuestionDepartmentLink, { foreignKey: 'masterQuestionId' });

// 19. QuestionDepartmentLink and MasterDepartment
QuestionDepartmentLink.belongsTo(MasterDepartment, { foreignKey: 'masterDepartmentId', targetKey: 'id' });
MasterDepartment.hasMany(QuestionDepartmentLink, { foreignKey: 'masterDepartmentId' });

// 20. Department and MasterDepartment
Department.belongsTo(MasterDepartment, { foreignKey: 'masterDepartmentId', targetKey: 'id' });
MasterDepartment.hasMany(Department, { foreignKey: 'masterDepartmentId' });

// 21. Otp and User
Otp.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
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
  AnswerEvidenceFileLink,
  QuestionDepartmentLink,
};
