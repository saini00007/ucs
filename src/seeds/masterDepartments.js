// seeds/masterDepartments.js
import  Department  from '../models/MasterDepartment'; // Import your Department model

const seedMasterDepartments = async () => {
  try {
    const departments = [
      { department_id: 1, department_name: 'Network Security' },
      { department_id: 2, department_name: 'Application Security' },
      { department_id: 3, department_name: 'Compliance and Risk Management' },
      { department_id: 4, department_name: 'Incident Response Team' },
      { department_id: 5, department_name: 'Cybersecurity Training and Awareness' },
      { department_id: 6, department_name: 'Security Operations Center (SOC)' },
      { department_id: 7, department_name: 'Human Resources' },
    ];

    for (const dept of departments) {
      await Department.create(dept);
      console.log(`Department ${dept.department_name} inserted.`);
    }
  } catch (error) {
    console.error('Error seeding master departments:', error);
  }
};

export default seedMasterDepartments;
