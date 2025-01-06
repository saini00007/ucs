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
import IndustrySector from './IndustrySector.js';
import ControlFramework from './ControlFramework.js';
import CompanyControlFrameworkLink from './CompanyControlFrameworkLink.js';
import SubDepartment from './SubDeartment.js';
import SubAssessment from './subAssessment.js';

const models = {
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
  UserDepartmentLink,
  IndustrySector,
  ControlFramework,
  CompanyControlFrameworkLink
};

Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

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
  UserDepartmentLink,
  IndustrySector,
  ControlFramework,
  CompanyControlFrameworkLink
};
