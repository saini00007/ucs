import { IndustrySector } from "../models/index.js";
import sequelize from "../config/db.js";

const seedIndustrySectors = async () => {
    const sectors = [
        {
            sectorType: 'major',
            sectorNames: [
                'Financial Services', 'Manufacturing', 'Healthcare', 'Technology', 'Retail',
                'Agriculture', 'Construction', 'Transportation', 'Professional Services',
                'Entertainment', 'Education', 'Hospitality', 'Mining & Materials',
                'Energy & Utilities', 'Media & Communications', 'Real Estate',
                'Defense & Aerospace', 'Telecommunications', 'Chemical', 'Automotive'
            ]
        },
        {
            sectorType: 'minor',
            sectorNames: [
                'Microfinance', 'Craft Manufacturing', 'Alternative Medicine', 'Tech Support Services',
                'Specialty Retail', 'Urban Farming', 'Home Improvement', 'Courier Services',
                'Business Support', 'Local Entertainment', 'Tutoring Services', 'Food Service',
                'Environmental Services', 'Renewable Energy', 'Digital Media', 'Property Management',
                'Security Services', 'Internet Services', 'Specialty Chemicals', 'Auto Parts & Service',
                'Personal Services', 'Waste Management', 'Custom Fabrication', 'Event Planning',
                'Sports & Recreation', 'Pet Services', 'Art & Design', 'Consulting Services',
                'Research Services', 'Testing & Certification'
            ]
        }
    ];

    const transaction = await sequelize.transaction();
    try {
        // Loop through each sector group (Major and Minor)
        for (const { sectorType, sectorNames } of sectors) {
            for (const sectorName of sectorNames) {
                const existingSector = await IndustrySector.findOne({
                    where: { sectorType, sectorName },
                    transaction
                });

                if (!existingSector) {
                    await IndustrySector.create({ sectorType, sectorName }, { transaction });
                    console.log(`${sectorType} sector ${sectorName} inserted.`);
                } else {
                    console.log(`${sectorType} sector ${sectorName} already exists.`);
                }
            }
        }

        await transaction.commit();
    } catch (error) {
        console.error('Error seeding industry sectors:', error);
        await transaction.rollback();
    }
};

export default seedIndustrySectors;
