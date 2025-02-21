import { Resource } from "../models/index.js";
import sequelize from "../config/db.js";
//have to change resourceName to camelcase
const resources = [
    { id: 'company', resourceName: 'Company' },
    { id: 'department', resourceName: 'Department' },
    { id: 'subdepartment', resourceName: 'SubDepartment' },
    { id: 'assessment', resourceName: 'Assessment' },
    { id: 'subassessment', resourceName: 'SubAssessment' },
    { id: 'assessmentquestion', resourceName: 'AssessmentQuestion' },
    { id: 'subassessmentquestion', resourceName: 'SubAssessmentQuestion' },
    { id: 'answer', resourceName: 'Answer' },
    { id: 'user', resourceName: 'User' },
    { id: 'evidencefile', resourceName: 'EvidenceFile' },
    { id: 'comment', resourceName: 'Comment' },
    { id: 'masterquestion', resourceName: 'MasterQuestion' },
    { id: 'masterdepartment', resourceName: 'MasterDepartment' },
    { id: 'role', resourceName: 'Role' },
    { id: 'userdepartmentlink', resourceName: 'UserDepartmentLink' },
    { id: 'usersubdepartmentlink', resourceName: 'UserSubDepartmentLink' },
    { id: 'report', resourceName: 'Report' },
    { id: 'industrysector', resourceName: 'IndustrySector' },
    { id: 'controlframework', resourceName: 'ControlFramework' },
    { id: 'companyprogressreport', resourceName: 'CompanyProgressReport' },
];

const seedResources = async () => {
    const transaction = await sequelize.transaction();
    try {
        for (const resource of resources) {
            const [existingResource, created] = await Resource.findOrCreate({
                where: { id: resource.id },
                defaults: resource,
                transaction,
            });
            if (created) {
                console.log(`Resource ${resource.resourceName} inserted.`);
            } else {
                console.log(`Resource ${resource.resourceName} already exists.`);
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error seeding resources:', error);
    }
};

export default seedResources;
