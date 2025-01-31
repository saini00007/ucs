import { ControlFramework } from "../models/index.js";
import sequelize from "../config/db.js";

const frameworks = [
    {
        category: 'general',
        frameworkTypes: [
            'NIST CSF',
            'ISO 27001/ISO 27002',
            'CIS Controls',
            'SOC 2',
            'PCI DSS',
            'GDPR',
            'HIPAA',
            'MITRE ATT&CK',
            'MITRE DEFEND',
            'IEC 62443'
        ]
    }, {
        category: 'country',
        frameworkTypes: [
            'Essential Eight Maturity Model (Australia)',
            'Cybersecurity Framework (Canada)',
            'NIS Directive (EU)',
            'IT-Grundschutz (Germany)',
            'Cybersecurity Framework for MSMEs (India)',
        ]
    }, {
        category: 'sector',
        frameworkTypes: [
            'NIST SP 800-82 (OT/ICS)',
            'NISTIR 8259 (IoT)',
            'NIST AI RMF 1.0 (AI)',
            'CSA Security Guidance v4.0 (Cloud)'
        ]
    }, {
        category: 'regulatory',
        frameworkTypes: [
            'SOX',
            'FISMA',
            'GLBA',
            'CCPA'
        ]
    }, {
        category: 'standards',
        frameworkTypes: [
            'PCI-DSS',
            'SWIFT Compliance',
            'NIS 2.0'
        ]
    }, {
        category: 'regional',
        frameworkTypes: [
            'NESA UAE',
            'SAMA SAUDI ARABIA',
            'BAHRAIN CYBER SECURITY FRAMEWORK'
        ]
    }
];

const seedControlFrameworks = async () => {
    const transaction = await sequelize.transaction();
    try {
        for (const framework of frameworks) {
            const { category, frameworkTypes } = framework;

            for (const frameworkType of frameworkTypes) {
                const [existingFramework, created] = await ControlFramework.findOrCreate({
                    where: { frameworkType },
                    defaults: { frameworkType, category },
                    transaction
                });

                if (created) {
                    console.log(`Control Framework "${frameworkType}" inserted under category "${category}".`);
                } else {
                    console.log(`Control Framework "${frameworkType}" already exists.`);
                }
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to seed control frameworks:", error);
    }
};

export default seedControlFrameworks;
