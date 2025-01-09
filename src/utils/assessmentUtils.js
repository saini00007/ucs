import { Assessment, SubAssessment, Company, Department, SubDepartment, AssessmentQuestion, Answer } from "../models";

export const getFilteredAssessments = async (companyId, whereCondition) => {
    try {
        const baseInclude = [{
            model: Department,
            as: 'department',
            attributes: ['id', 'departmentName'],
            required: true,
            include: [{
                model: Company,
                as: 'company',
                attributes: [],
                where: { id: companyId },
                required: true
            }]
        }];

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
            subQuery: false
        });
    } catch (error) {
        throw new AppError('Error in getFilteredAssessments:', 500);

    }
};

export const getFilteredSubAssessments = async (companyId, whereCondition) => {
    try {
        const baseInclude = [{
            model: SubDepartment,
            as: 'subDepartment',
            attributes: ['id', 'subDepartmentName'],
            required: true,
            include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'departmentName'],
                required: true,
                include: [{
                    model: Company,
                    as: 'company',
                    attributes: [],
                    where: { id: companyId },
                    required: true
                }]
            }]
        }];

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

        return await SubAssessment.findAll({
            include: baseInclude,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            where: whereCondition,
            subQuery: false
        });
    } catch (error) {  
        throw new AppError('Error in getFilteredSubAssessments:', 500);
    }
};