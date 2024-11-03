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

// 5. Assessment and Department
Assessment.belongsTo(Department, { foreignKey: 'departmentId', targetKey: 'id' });
Department.hasMany(Assessment, { foreignKey: 'departmentId' });

// 6. AssessmentQuestion and Assessment
AssessmentQuestion.belongsTo(Assessment, { foreignKey: 'assessmentId', targetKey: 'id' });
Assessment.hasMany(AssessmentQuestion, { foreignKey: 'assessmentId' });

// 7. AssessmentQuestion and MasterQuestion
AssessmentQuestion.belongsTo(MasterQuestion, { foreignKey: 'masterQuestionId', targetKey: 'id' });
MasterQuestion.hasMany(AssessmentQuestion, { foreignKey: 'masterQuestionId' });

// 8. Answer and AssessmentQuestion
Answer.belongsTo(AssessmentQuestion, { foreignKey: 'assessmentQuestionId', targetKey: 'id' });
AssessmentQuestion.hasMany(Answer, { foreignKey: 'assessmentQuestionId' });

// 9. Answer and User
Answer.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(Answer, { foreignKey: 'createdByUserId' });

// 10. Comment and AssessmentQuestion
Comment.belongsTo(Answer, { foreignKey: 'answerId', targetKey: 'id' });
Answer.hasMany(Comment, { foreignKey: 'answerId' });

// 11. Comment and User
Comment.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(Comment, { foreignKey: 'createdByUserId' });

// 12. EvidenceFile and User
EvidenceFile.belongsTo(User, { foreignKey: 'createdByUserId', targetKey: 'id' });
User.hasMany(EvidenceFile, { foreignKey: 'createdByUserId' });


//15
Answer.hasMany(EvidenceFile, {
  foreignKey: 'answerId',
});

//16
EvidenceFile.belongsTo(Answer, {
  foreignKey: 'answerId',
});

// 17. QuestionDepartmentLink and MasterQuestion
QuestionDepartmentLink.belongsTo(MasterQuestion, { foreignKey: 'masterQuestionId', targetKey: 'id' });
MasterQuestion.hasMany(QuestionDepartmentLink, { foreignKey: 'masterQuestionId' });

// 18. QuestionDepartmentLink and MasterDepartment
QuestionDepartmentLink.belongsTo(MasterDepartment, { foreignKey: 'masterDepartmentId', targetKey: 'id' });
MasterDepartment.hasMany(QuestionDepartmentLink, { foreignKey: 'masterDepartmentId' });

// 19. Department and MasterDepartment
Department.belongsTo(MasterDepartment, { foreignKey: 'masterDepartmentId', targetKey: 'id' });
MasterDepartment.hasMany(Department, { foreignKey: 'masterDepartmentId' });

// 20. Otp and User
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
  QuestionDepartmentLink,
  RoleResourceActionLink,
  Action,
  Resource
};
