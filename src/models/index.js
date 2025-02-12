// index.js
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
import SubAssessment from './subAssessment.js';
import SubDepartment from './SubDepartment.js';
import MasterSubDepartment from './MasterSubDepartment.js';
import UserSubDepartmentLink from './UserSubDepartmentLink.js';

// Import new models
import RiskVulnerabilityAssessment from './RiskVulnerabilityAssessment.js';
import ISO27001Control from './ISO27001Control.js';
import NISTCSFControl from './NISTCSFControl.js';
import MITREControl from './MITREControl.js';
import NIST80082Control from './NIST80082Control.js';
import IEC62443Control from './IEC62443Control.js';
import PCIDSSControl from './PCIDSSControl.js';

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
  UserSubDepartmentLink,
  IndustrySector,
  ControlFramework,
  CompanyControlFrameworkLink,
  SubDepartment,
  SubAssessment,
  MasterSubDepartment,
  // Add new models
  RiskVulnerabilityAssessment,
  ISO27001Control,
  NISTCSFControl,
  MITREControl,
  NIST80082Control,
  IEC62443Control,
  PCIDSSControl
};

// Run associations
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
  UserSubDepartmentLink,
  IndustrySector,
  ControlFramework,
  CompanyControlFrameworkLink,
  SubAssessment,
  SubDepartment,
  MasterSubDepartment,
  // Export new models
  RiskVulnerabilityAssessment,
  ISO27001Control,
  NISTCSFControl,
  MITREControl,
  NIST80082Control,
  IEC62443Control,
  PCIDSSControl
};