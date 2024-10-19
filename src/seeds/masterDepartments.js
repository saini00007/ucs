import MasterDepartment from '../models/MasterDepartment';

const seedMasterDepartments = async () => {
  try {
    const departments = [
      { departmentName: 'Network Security' },
      { departmentName: 'Application Security' },
      { departmentName: 'Compliance and Risk Management' },
      { departmentName: 'Incident Response Team' },
      { departmentName: 'Cybersecurity Training and Awareness' },
      { departmentName: 'Security Operations Center (SOC)' },
      { departmentName: 'Human Resources' },
    ];

    for (const dept of departments) {
      const [deptInfo, created] = await MasterDepartment.findOrCreate({
        where: { departmentName: dept.departmentName },
        defaults: dept,
      });
      if (created) {
        console.log(`Department ${deptInfo.departmentName} inserted with Department ID ${deptInfo.departmentId}`);
      } else {
        console.log(`Department ${deptInfo.departmentName} already exists.`);
      }
    }
  } catch (error) {
    console.error('Error seeding master departments:', error);
  }
};

export default seedMasterDepartments;
