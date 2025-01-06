import { Assessment, Company, Department, AssessmentQuestion, Answer } from "../models";

export const getCategorizedAssessments = async (companyId, whereCondition) => {
    try {
        // Base query optimization
        const baseInclude = [{
            model: Department,
            as: 'department',
            attributes: ['id', 'departmentName'],
            required: true, // Use inner join for better performance
            include: [{
                model: Company,
                as: 'company',
                attributes: [], // Don't select company fields if not needed
                where: { id: companyId },
                required: true
            }]
        }];

        // Optimize completed assessments query
        if (whereCondition.checkComplete) {
            baseInclude.push({
                model: AssessmentQuestion,
                as: 'questions',
                attributes: [],
                required: true,
                include: [{
                    model: Answer,
                    as: 'answer',
                    attributes: [],
                    required: true
                }]
            });
            delete whereCondition.checkComplete;
        }

        return await Assessment.findAll({
            include: baseInclude,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            where: whereCondition,
            subQuery: false // Optimize for large datasets
        });
    } catch (error) {
        console.error('Error in getCategorizedAssessments:', {
            error: error.message,
            companyId,
            whereCondition
        });
        throw error;
    }
};
