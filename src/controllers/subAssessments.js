import { Answer, Assessment, AssessmentQuestion, EvidenceFile, MasterQuestion, SubAssessment, User, Comment } from "../models";
import { checkSubAssessmentAccess } from "../services/contextChecks";
import { checkAssessmentState, checkSubAssessmentState } from "../utils/accessValidators";
import AppError from "../utils/AppError";
import { ANSWER_TYPES, SUB_ASSESSMENT_REVIEW_STATUS, ANSWER_REVIEW_STATUS, ROLE_IDS } from "../utils/constants";
import { checkSubAssessmentCompletion } from "../utils/subAssessmentUtils";
import sequelize from "../config/db";
import { Op } from "sequelize";


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
        console.log('---------------------------------------');
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
                                attributes: ['id', 'firstName', 'lastName'],
                            }]
                        },
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['id', 'firstName', 'lastName'],
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
                        attributes: ['id', 'firstName', 'lastName'],
                    }],
                    order: [['createdAt', 'ASC']],
                },
            ],
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
        });
        console.log('--------------------hehehe----------------');


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

export const submitForReview = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const userId = req.user.id;

    const transaction = await sequelize.transaction();

    try {
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.DRAFT
            },
            include: [{
                model: AssessmentQuestion,
                as: 'questions',
                include: ['answer']
            }],
            transaction
        });

        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not in draft status', 404);
        }

        // Check if all questions are answered
        const unansweredQuestions = subAssessment.questions.filter(q => !q.answer);
        if (unansweredQuestions.length > 0) {
            throw new AppError('All questions must be answered before submission', 400);
        }

        // Update subAssessment status
        await subAssessment.update({
            reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW,
            submittedForReviewAt: new Date(),
            submittedForReviewBy: userId
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['Assessment submitted for review successfully']
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const resubmitAfterRevision = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const userId = req.user.id;
    
    const transaction = await sequelize.transaction();
    
    try {
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION
            },
            transaction
        });
        
        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not in need revision status', 404);
        }
        
        // Check if any answers are still rejected
        const rejectedAnswers = await Answer.count({
            include: [{
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                where: { subAssessmentId }
            }],
            where: {
                reviewStatus: ANSWER_REVIEW_STATUS.REJECTED
            },
            transaction
        });

        if (rejectedAnswers > 0) {
            throw new AppError('All rejected answers must be updated before resubmission', 400);
        }
        
        // Update subAssessment status
        await subAssessment.update({
            reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW,
            submittedForReviewAt: new Date(),
            submittedForReviewBy: userId
        }, { transaction });
        
        await transaction.commit();
        
        res.status(200).json({
            success: true,
            messages: ['Assessment resubmitted for review successfully']
        });
        
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const getQuestionsForReview = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: {
                    [Op.in]: [SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW, SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW]
                }
            }
        });


        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not submitted for review', 404);
        }

        // Update status to UNDER_REVIEW
        await subAssessment.update({
            reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW
        });

        const { count, rows: questions } = await AssessmentQuestion.findAndCountAll({
            where: { subAssessmentId },
            include: [
                {
                    model: MasterQuestion,
                    as: 'masterQuestion',
                    attributes: ['questionText'],
                },
                {
                    model: Answer,
                    as: 'answer',
                    required: true,
                    where: {
                        [Op.or]: [
                            // Case 1: YES answers with PENDING or REJECTED status
                            {
                                [Op.and]: [
                                    { answerText: ANSWER_TYPES.YES },
                                    {
                                        reviewStatus: {
                                            [Op.in]: [ANSWER_REVIEW_STATUS.PENDING, ANSWER_REVIEW_STATUS.REJECTED]
                                        }
                                    }
                                ]
                            },
                            // Case 2: Any answer type with IMPROVED status
                            { reviewStatus: ANSWER_REVIEW_STATUS.IMPROVED }
                        ]
                    },
                    include: [
                        {
                            model: EvidenceFile,
                            as: 'evidenceFiles',
                            attributes: ['id', 'filePath', 'fileName'],
                        },
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['id', 'firstName', 'lastName']
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            questions,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / parseInt(limit)),
                currentPage: parseInt(page)
            }
        });

    } catch (error) {
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

export const getRejectedQuestions = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION
            }
        });

        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not in revision status', 404);
        }

        const { count, rows: questions } = await AssessmentQuestion.findAndCountAll({
            where: { subAssessmentId },
            include: [
                {
                    model: MasterQuestion,
                    as: 'masterQuestion',
                    attributes: ['questionText'],
                },
                {
                    model: Answer,
                    as: 'answer',
                    required: true,
                    where: {
                        reviewStatus: ANSWER_REVIEW_STATUS.REJECTED
                    },
                    include: [
                        {
                            model: EvidenceFile,
                            as: 'evidenceFiles',
                            attributes: ['id', 'filePath', 'fileName'],
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            questions,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / parseInt(limit)),
                currentPage: parseInt(page)
            }
        });

    } catch (error) {
        next(error);
    }
};

