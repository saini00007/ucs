import { MasterDepartment, MasterSubDepartment } from '../models/index.js';
import sequelize from '../config/db.js';

const seedMasterSubDepartments = async () => {
    const subDepartments = [
      { name: 'Recruitment', department: 'Human Resources' },
      { name: 'Training & Development', department: 'Human Resources' },
      { name: 'Employee Relations', department: 'Human Resources' },
      { name: 'Network Operations', department: 'IT Operations' },
      { name: 'System Administration', department: 'IT Operations' },
      { name: 'Technical Support', department: 'IT Operations' },
      { name: 'Security Operations', department: 'Information Security' },
      { name: 'Incident Response', department: 'Information Security' },
      { name: 'Security Compliance', department: 'Information Security' },
      { name: 'Disaster Recovery', department: 'Business Continuity' },
      { name: 'Crisis Management', department: 'Business Continuity' },
      { name: 'Access Control', department: 'Physical Security' },
      { name: 'Surveillance', department: 'Physical Security' }
    ];
  
    const transaction = await sequelize.transaction();
    try {
      for (const { name, department } of subDepartments) {
        const masterDept = await MasterDepartment.findOne({
          where: { departmentName: department },
          transaction
        });
        console.log(masterDept.toJSON());
  
        if (masterDept) {
          const [subDepartment, created] = await MasterSubDepartment.findOrCreate({
            where: { subDepartmentName: name },
            defaults: {
              subDepartmentName: name,
              masterDepartmentId: masterDept.id
            },
            transaction,
          });
  
          if (created) {
            console.log(`SubDepartment "${name}" created under ${department}`);
          }
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding subdepartments:', error);
    }
  };

export default seedMasterSubDepartments;