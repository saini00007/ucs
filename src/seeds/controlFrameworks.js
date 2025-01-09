import { ControlFramework } from "../models/index.js";
import sequelize from "../config/db.js";

const frameworks = [
    { frameworkType: 'PCIDSS' },
    { frameworkType: 'IEC62443' },
    { frameworkType: 'NIST80082' },
    { frameworkType: 'MITREDEFEND' },
    { frameworkType: 'NISTCSF' },
    { frameworkType: 'ISO27001' },
    
];

const seedControlFrameworks = async () => {
    const transaction = await sequelize.transaction();
    try {
        for (const framework of frameworks) {
            const [existingFramework, created] = await ControlFramework.findOrCreate({
                where: { frameworkType: framework.frameworkType },
                defaults: framework,
                transaction
            });

            if (created) {
                console.log(`Control Framework ${framework.frameworkType} inserted.`);
            } else {
                console.log(`Control Framework ${framework.frameworkType} already exists.`);
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to seed control frameworks:", error);
    }
};

export default seedControlFrameworks;