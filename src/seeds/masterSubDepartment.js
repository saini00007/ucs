import { MasterSubDepartment } from '../models/index.js';
import sequelize from '../config/db.js';

const seedMasterSubDepartments = async () => {
    const subDepartments = [
        'Recruitment',
        'Training & Development',
        'Employee Relations',
        'Network Operations',
        'System Administration',
        'Technical Support',
        'Security Operations',
        'Incident Response',
        'Security Compliance',
        'Disaster Recovery',
        'Crisis Management',
        'Access Control',
        'Surveillance'
    ];

    const transaction = await sequelize.transaction();
    try {
        for (const subDepartmentName of subDepartments) {
            const [subDepartment, created] = await MasterSubDepartment.findOrCreate({
                where: { subDepartmentName },
                defaults: { subDepartmentName },
                transaction,
            });

            if (created) {
                console.log(`SubDepartment "${subDepartmentName}" inserted with SubDepartment ID ${subDepartment.subDepartmentId}`);
            } else {
                console.log(`SubDepartment "${subDepartmentName}" already exists.`);
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error seeding master subdepartments:', error);
    }
};

export default seedMasterSubDepartments;