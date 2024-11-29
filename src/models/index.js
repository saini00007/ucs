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
import QuestionDepartmentLink from './QuestionDepartmentLink.js';
import RoleResourceActionLink from './RoleResourceActionLink.js';
import Action from './Action.js';
import Resource from './Resource.js';
import UserDepartmentLink from './UserDepartmentLink.js';

// 1. User and Company
User.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'id', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

// 2. User and Department
User.belongsToMany(Department, { through: UserDepartmentLink, foreignKey: 'userId', as: 'departments' });
Department.belongsToMany(User, { through: UserDepartmentLink, foreignKey: 'departmentId', as: 'users' });

// 3. User and Role
User.belongsTo(Role, { foreignKey: 'roleId', targetKey: 'id', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// 4. Otp and User
Otp.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
User.hasMany(Otp, { foreignKey: 'userId', as: 'otps' });

// 5. Department and Company
Department.belongsTo(Company, { foreignKey: 'companyId', targetKey: 'id', as: 'company' });
Company.hasMany(Department, { foreignKey: 'companyId', as: 'departments' });

// 6. Assessment and Department
Assessment.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'id', as: 'department' });
Department.hasMany(Assessment, { foreignKey: 'departmentId', as: 'assessments' });

// 7. AssessmentQuestion and Assessment
AssessmentQuestion.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'id', as: 'assessment' });
Assessment.hasMany(AssessmentQuestion, { foreignKey: 'assessmentId', as: 'questions' });

// 8. AssessmentQuestion and MasterQuestion
AssessmentQuestion.belongsTo(MasterQuestion, { foreignKey: 'masterQuestionId', targetKey: 'id', as: 'masterQuestion' });
MasterQuestion.hasMany(AssessmentQuestion, { foreignKey: 'masterQuestionId', as: 'assessmentQuestions' });

// 9. Answer and AssessmentQuestion
Answer.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'id', as: 'assessmentQuestion' });
AssessmentQuestion.hasOne(Answer, { foreignKey: 'assessmentQuestionId', as: 'answer' });

// 10. Answer and User
Answer.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id', as: 'creator' });
User.hasMany(Answer, { foreignKey: 'createdByUserId', as: 'createdAnswers' });

// 11. Comment and Answer
Comment.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'id', as: 'assessmentQuestion' });
AssessmentQuestion.hasMany(Comment, { foreignKey: 'assessmentQuestionId', as: 'comments' });

// 12. Comment and User
Comment.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id', as: 'creator' });
User.hasMany(Comment, { foreignKey: 'createdByUserId', as: 'createdComments' });

// 13. EvidenceFile and User
EvidenceFile.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id', as: 'creator' });
User.hasMany(EvidenceFile, { foreignKey: 'createdByUserId', as: 'createdEvidenceFiles' });

// 14. Answer and EvidenceFile
Answer.hasMany(EvidenceFile, { foreignKey: 'answerId', as: 'evidenceFiles' });
EvidenceFile.belongsTo(Answer, { foreignKey: 'answerId', as: 'answer' });

// 15. MasterQuestion and MasterDepartment
MasterQuestion.belongsToMany(MasterDepartment, { through: QuestionDepartmentLink, foreignKey: 'masterQuestionId', otherKey: 'masterDepartmentId', as: 'masterDepartments' });
MasterDepartment.belongsToMany(MasterQuestion, { through: QuestionDepartmentLink, foreignKey: 'masterDepartmentId', otherKey: 'masterQuestionId', as: 'masterQuestions' });

// 16. Department and MasterDepartment
Department.belongsTo(MasterDepartment, { foreignKey: 'masterDepartmentId', targetKey: 'id', as: 'masterDepartment' });
MasterDepartment.hasMany(Department, { foreignKey: 'masterDepartmentId', as: 'departments' });

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
  QuestionDepartmentLink,
  RoleResourceActionLink,
  Action,
  Resource,
  UserDepartmentLink
};
