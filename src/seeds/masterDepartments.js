// seeds/masterDepartments.js
import MasterDepartment from '../models/MasterDepartment'; 

const seedMasterDepartments = async () => {
  try {
    const departments = [
      { departmentId: 1, departmentName: 'Network Security' },
      { departmentId: 2, departmentName: 'Application Security' },
      { departmentId: 3, departmentName: 'Compliance and Risk Management' },
      { departmentId: 4, departmentName: 'Incident Response Team' },
      { departmentId: 5, departmentName: 'Cybersecurity Training and Awareness' },
      { departmentId: 6, departmentName: 'Security Operations Center (SOC)' },
      { departmentId: 7, departmentName: 'Human Resources' },
    ];

    for (const dept of departments) {
      await MasterDepartment.create(dept);
      console.log(`Department ${dept.departmentName} inserted.`);
    }
  } catch (error) {
    console.error('Error seeding master departments:', error);
  }
};

export default seedMasterDepartments;
