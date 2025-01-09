import { Answer, Assessment, AssessmentQuestion, EvidenceFile, MasterQuestion, SubAssessment, User, Comment } from "../models";
import { checkSubAssessmentAccess } from "../services/contextChecks";
import { checkAssessmentState, checkSubAssessmentState } from "../utils/accessValidators";
import AppError from "../utils/AppError";
import { ROLE_IDS } from "../utils/constants";
import { checkSubAssessmentCompletion } from "../utils/subAssessmentUtils";

export const getSubAssessmentById = async (req, res, next) => {
    const { subAssessmentId } = req.params;

    try {
        // Find the sub assessment by its primary key (ID)
        const subAssessment = await SubAssessment.findOne({
            where: { id: subAssessmentId },
            include: [
                { model: Assessment, as: 'assessment', attributes: ['id', 'assessmentName'] },
            ],
        });

        // If the sub assessment is not found, return a 404 error
        if (!subAssessment) {
            throw new AppError('Sub assessment not found', 404);
        }

        // Return a success response with the found sub assessment
        res.status(200).json({
            success: true,
            messages: ['Sub assessment retrieved successfully'],
            subAssessment: subAssessment,
        });
    } catch (error) {
        // Log the error and return a 500 error response in case of any issues
        console.error('Error fetching sub assessment:', error);
        next(error);
    }
};

export const getAssessmentQuestionsBySubAssessmentId = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const subAssessment = await SubAssessment.findOne({
            where: { id: subAssessmentId },
            attributes: ['subAssessmentStarted', 'submitted'],
            include: {
                model: Assessment,
                as: 'assessment',
            }
        });

        if (!subAssessment) {
            throw new AppError('subAssessment not found', 404);
        }

        const subAssessmentState = checkSubAssessmentState(subAssessment);
        if (!subAssessmentState.success) {
            throw new AppError(
                req.user.roleId === ROLE_IDS.SUPER_ADMIN
                    ? subAssessmentState.message || 'Access denied: Insufficient content permissions.'
                    : 'Access denied: Insufficient content permissions.',
                subAssessmentState.status || 403
            );
        }

        // Parse and validate pagination params
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            throw new AppError('Invalid pagination parameters', 400);
        }


        // Fetch the questions for the assessment with pagination


        const { count, rows: questions } = await AssessmentQuestion.findAndCountAll({
            where: { subAssessmentId },
            attributes: ['id', 'subAssessmentId'],
            include: [
                {
                    model: MasterQuestion,
                    as: 'masterQuestion',
                    attributes: ['questionText'],
                },
                {
                    model: Answer,
                    as: 'answer',
                    attributes: ['id', 'answerText', 'createdAt', 'updatedAt'],
                    include: [
                        {
                            model: EvidenceFile,
                            as: 'evidenceFiles',
                            attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
                            order: [['createdAt', 'ASC']],
                            include: [{
                                model: User,
                                as: 'creator',
                                attributes: ['id', 'username'],
                            }]
                        },
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['id', 'username'],
                        }
                    ],
                },
                {
                    model: Comment,
                    as: 'comments',
                    paranoid: false,
                    include: [{
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'username'],
                    }],
                    order: [['createdAt', 'ASC']],
                },
            ],
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
            messages: count === 0 ? ['No questions found for the given sub assessment'] : ['Sub assessment questions retrieved successfully'],
            questions,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: pageNum,
                itemsPerPage: limitNum
            },
        });

    } catch (error) {
        console.error('Error fetching sub assessment questions:', error);
        next(error);
    }
};

export const submitSubAssessment = async (req, res, next) => {

    const { subAssessmentId } = req.params;
    try {
        const subAssessment = await SubAssessment.findByPk(subAssessmentId);

        if (!subAssessment?.subAssessmentStarted) {
            throw new AppError('Sub assessment must be started before submission', 400);
        }

        if (!checkSubAssessmentCompletion(subAssessment.id)) {
            throw new AppError('All sub assessment questions must be attempted', 400);
        }

        // If the assessment has already been submitted, return a 400 error
        if (subAssessment.submitted) {
            throw new AppError('Sub assessment has already been submitted', 400);
        }
        await SubAssessment.update(
            {
                submitted: true,
                submittedAt: new Date(),
            },
            {
                where: { subAssessmentId },
            }
        );
        res.status(200).json({
            success: true,
            messages: ['Sub Assessment submitted successfully'],
            assessment: assessmentResponse,
        });

    } catch (error) {
        return next(error);
    }

}

export const reopenSubAssessment = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    try {
        const subAssessment = await SubAssessment.findByPk(subAssessmentId);
        if (!subAssessment.submitted) {
            throw new AppError('Sub assessment is not submitted, cannot reopen', 400);
        }
        await SubAssessment.update(
            {
                submitted: false,
                submittedAt: null
            },
            {
                where: { subAssessmentId },
            }
        );
        res.status(200).json({
            success: true,
            messages: ['Sub Assessment reopened successfully'],
            assessment: assessmentResponse,
        });
    } catch (error) {
        return next(error);
    }
}