import { MasterDepartment, MasterSubDepartment } from '../models/index.js';
import sequelize from '../config/db.js';

const seedMasterSubDepartments = async () => {
    const subDepartments = [
      { name: 'Legal', department: 'Legal' },
      { name: 'Physical Security', department: 'Physical Security' },
      { name: 'Policy and Procedures', department: 'Business Continuity' },
      { name: 'Policy', department: 'Human Resources' },
      { name: 'Power Equipment and Cabling', department: 'Facilities Management' },
      { name: 'Provenance', department: 'Procurement' },
      { name: 'Remote Access', department: 'Network Security' },
      { name: 'Security Groups', department: 'Information Security' },
      { name: 'Supply Chain Protection', department: 'Procurement' },
      { name: 'System Monitoring', department: 'Information Security' },
      { name: 'Testing', department: 'IT Operations' },
      { name: 'Wireless Access', department: 'Network Security' },
      { name: 'Acquisition Process', department: 'Procurement' },
      { name: 'Audit Record', department: 'Information Security' },
      { name: 'Backup', department: 'IT Operations' },
      { name: 'Business Operations', department: 'Business Operations' },
      { name: 'Contingency Plan', department: 'Business Continuity' },
      { name: 'Cybersecurity', department: 'Cybersecurity' },
      { name: 'Emergency', department: 'Facilities Management' },
      { name: 'Finance', department: 'Finance' },
      { name: 'HR-TRAINING', department: 'Human Resources' },
      { name: 'Identity Access Governance', department: 'IT Operations' },
      { name: 'Information Flow', department: 'Network Security' },
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