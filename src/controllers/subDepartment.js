import { QueryTypes } from "sequelize";
import { Answer, Assessment, AssessmentQuestion, Department, MasterQuestion, SubAssessment, SubDepartment, User } from "../models";
import AppError from "../utils/AppError";
import { calculateSubAssessmentStats } from "../utils/subAssessmentUtils";
import { SUB_ASSESSMENT_TYPE } from "../utils/constants";
import { calculateMetrics } from "../utils/calculateRiskMetrics";

export const getUsersBySubDepartmentId = async (req, res, next) => {
    const { subDepartmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const subDepartment = await SubDepartment.findByPk(subDepartmentId);
        if (!subDepartment) {
            throw new AppError('Sub department not found', 404);
        }
        // Parse and validate pagination params
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            throw new AppError('Invalid pagination parameters', 400);
        }

        // Fetch users associated with the given department ID
        const { count, rows: users } = await User.findAndCountAll({
            include: [{
                model: SubDepartment,
                as: 'subDepartments',
                attributes: ['id'],
                through: { attributes: [] },
                where: { id: subDepartmentId }
            }],
            attributes: { exclude: ['password', 'deletedAt'] },
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limitNum);

        // Check if page exists
        if (pageNum > totalPages && count > 0) {
            throw new AppError('Page not found', 404);
        }

        // Return response with pagination
        res.status(200).json({
            success: true,
            messages: count === 0 ? ['No users found'] : ['Users retrieved successfully'],
            users,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: pageNum,
                itemsPerPage: limitNum
            },
        });

    } catch (error) {
        console.error('Error fetching users for sub department:', error);
        next(error);
    }
};

export const getSubAssessmentBySubDepartmentId = async (req, res, next) => {
    const { subDepartmentId } = req.params;

    try {
        const subDepartment = await SubDepartment.findByPk(subDepartmentId);
        if (!subDepartment) {
            throw new AppError('Sub department not found', 404);
        }

        const subAssessments = await SubAssessment.findAll({
            where: { subDepartmentId },
            include: [
                {
                    model: SubDepartment,
                    as: 'subDepartment',
                    attributes: ['id', 'subDepartmentName']
                },
                {
                    model: AssessmentQuestion,
                    as: 'questions',
                    attributes: ['id'],
                    include: [{
                        model: Answer,
                        as: 'answer',
                        attributes: ['answerText', 'reviewStatus', 'revisionStatus']
                    }]
                }
            ]
        });

        const formattedAssessments = subAssessments.map(assessment => {
            const raw = assessment.get();
            const stats = calculateSubAssessmentStats(assessment);
            delete raw.questions;

            return {
                ...raw,
                stats
            };
        });

        res.status(200).json({
            success: true,
            messages: formattedAssessments.length === 0 ? ['No sub assessments found'] : ['Sub Assessments retrieved successfully'],
            subAssessments: formattedAssessments
        });

    } catch (error) {
        console.error('Error fetching sub assessments for department:', error);
        next(error);
    }
};

export const updateSubDepartment = async (req, res, next) => {
    const { subDepartmentId } = req.params;
    const { subDepartmentName } = req.body;

    try {
        // Find and update the subdepartment
        const subDepartment = await SubDepartment.findByPk(subDepartmentId);
        
        if (!subDepartment) {
            throw new AppError('Sub department not found', 404);
        }

        await subDepartment.update({ subDepartmentName });

        res.status(200).json({
            success: true,
            messages: ['Sub department updated successfully'],
            subDepartment
        });

    } catch (error) {
        console.error('Error updating sub department:', error);
        next(error);
    }
};


export const getSubDepartmentById = async (req, res, next) => {
    const { subDepartmentId } = req.params;

    try {
        const subDepartment = await SubDepartment.findByPk(subDepartmentId, {
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName']
                },
            ],
        });

        if (!subDepartment) {
            throw new AppError('Sub department not found', 404);
        }

        res.status(200).json({ success: true, subDepartment });
    } catch (error) {
        console.error('Error fetching sub department:', error);
        next(error);
    }
}

// subdepartmentMetrics.js
export const getSubdepartmentMetrics = async (req, res, next) => {
    const { subDepartmentId } = req.params;
    try {
        // Find specific subdepartment by ID
        const subdepartment = await SubDepartment.findOne({
            where: { id: subDepartmentId },
            include: [{
                model: SubAssessment,
                as: 'subAssessments',
                where: {
                    subAssessmentType: SUB_ASSESSMENT_TYPE.DEFAULT
                },
                required: false,
                include: [{
                    model: AssessmentQuestion,
                    as: 'questions',
                    include: [{
                        model: Answer,
                        as: 'answer'
                    }, {
                        model: MasterQuestion,
                        as: 'masterQuestion'
                    }]
                }]
            }]
        });

        if (!subdepartment) {
            return res.status(404).json({
                success: false,
                messages: ['Subdepartment not found']
            });
        }

        const assessment = subdepartment.subAssessments?.[0];
        if (!assessment) {
            return res.status(404).json({
                success: false,
                messages: ['No default assessment found for subdepartment']
            });
        }

        const metrics = calculateMetrics(assessment.questions);

        return res.status(200).json({
            success: true,
            subdepartmentMetrics: {
                id: subdepartment.id,
                subDepartmentName: subdepartment.subDepartmentName,
                riskMetrics: {
                    departmentRiskIndex: metrics.departmentRiskIndex,
                    controlCoverageRatio: metrics.controlCoverageRatio,
                    gapDensityRate: metrics.gapDensityRate,
                    departmentComplianceScore: metrics.departmentComplianceScore,
                    documentationCoverageRatio: metrics.documentationCoverageRatio
                }
            }
        });
    } catch (error) {
        console.error('Error fetching subdepartment metrics:', error);
        next(error);
    }
};