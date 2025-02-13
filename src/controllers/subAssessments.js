import { Answer, Assessment, AssessmentQuestion, EvidenceFile, MasterQuestion, SubAssessment, User, Comment } from "../models";
import { checkSubAssessmentAccess } from "../services/contextChecks";
import { checkAssessmentState, checkSubAssessmentState } from "../utils/accessValidators";
import AppError from "../utils/AppError";
import { ANSWER_TYPES, SUB_ASSESSMENT_REVIEW_STATUS, ANSWER_REVIEW_STATUS, ROLE_IDS, REVISION_STATUS } from "../utils/constants";
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
                include: [
                    {
                        model: Answer,
                        as: 'answer'
                    },
                    {
                        model: MasterQuestion,
                        as: 'masterQuestion'
                    }
                ]
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

        // Process answers - auto-approve "no" and "not applicable" answers
        const answerUpdates = subAssessment.questions.map(async question => {
            const answer = question.answer;
            const answerText = answer.answerText;

            // Check if the answer matches NO or NOT_APPLICABLE types
            if (answerText === ANSWER_TYPES.NO ||
                answerText === ANSWER_TYPES.NOT_APPLICABLE) {
                await Answer.update(
                    {
                        finalReview: true,
                        reviewStatus: ANSWER_REVIEW_STATUS.APPROVED,
                        reviewedAt: new Date()
                    },
                    {
                        where: { id: answer.id },
                        transaction
                    }
                );
            }
        });

        // Wait for all answer updates to complete
        await Promise.all(answerUpdates);

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
            include: [{
                model: AssessmentQuestion,
                as: 'questions',
                include: [{
                    model: Answer,
                    as: 'answer'
                }]
            }],
            transaction
        });

        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not in need revision status', 404);
        }

        // Check for rejected answers that haven't been improved
        const unprocessedAnswers = await Answer.findAll({
            include: [{
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                where: { subAssessmentId },
                required: true
            }],
            where: {
                reviewStatus: ANSWER_REVIEW_STATUS.REJECTED,
                revisionStatus: {
                    [Op.ne]: REVISION_STATUS.IMPROVED
                }
            },
            transaction
        });

        if (unprocessedAnswers.length > 0) {
            const unprocessedQuestionIds = unprocessedAnswers.map(
                answer => answer.assessmentQuestion.masterQuestionId
            );
            throw new AppError(
                'Please improve all rejected answers before resubmitting.',
                400,
                { unprocessedQuestionIds }
            );
        }

        // Get only previously rejected answers
        const rejectedAnswers = subAssessment.questions
            .filter(q => q.answer && q.answer.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED)
            .map(q => q.answer);

        // Update only previously rejected answers based on their type
        const answerUpdates = rejectedAnswers.map(async answer => {
            const updateData = {};
            if (answer.answerText === ANSWER_TYPES.YES) {
                updateData.reviewStatus = ANSWER_REVIEW_STATUS.PENDING;
                updateData.finalReview = false;
            } else if (
                answer.answerText === ANSWER_TYPES.NO ||
                answer.answerText === ANSWER_TYPES.NOT_APPLICABLE
            ) {
                updateData.reviewStatus = ANSWER_REVIEW_STATUS.APPROVED;
                updateData.finalReview = true;
                updateData.reviewedAt = new Date();
            }
            await Answer.update(updateData, {
                where: { id: answer.id },
                transaction
            });
        });

        await Promise.all(answerUpdates);

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

export const submitForRevision = async (req, res, next) => {
    console.log('[submitForRevision] Starting with params:', {
        subAssessmentId: req.params.subAssessmentId,
        userId: req.user.id
    });

    const { subAssessmentId } = req.params;
    const userId = req.user.id;

    const transaction = await sequelize.transaction();
    console.log('[submitForRevision] Transaction started');

    try {
        console.log('[submitForRevision] Fetching subAssessment with questions and answers');
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW
            },
            include: [{
                model: AssessmentQuestion,
                as: 'questions',
                include: [{
                    model: Answer,
                    as: 'answer'
                }]
            }],
            transaction
        });

        if (!subAssessment) {
            console.log('[submitForRevision] SubAssessment not found or not under review');
            throw new AppError('SubAssessment not found or not under review', 404);
        }

        console.log('[submitForRevision] SubAssessment found:', {
            id: subAssessment.id,
            reviewStatus: subAssessment.reviewStatus
        });

        // Get all answers for this subAssessment
        const answers = subAssessment.questions
            .filter(q => q.answer)
            .map(q => q.answer);

        console.log('[submitForRevision] Extracted answers:', {
            totalAnswers: answers.length,
            approvedAnswers: answers.filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.APPROVED).length,
            rejectedAnswers: answers.filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED).length
        });

        // Update approved answers - set finalReview to true
        const approvedAnswerIds = answers
            .filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.APPROVED)
            .map(a => a.id);

        console.log('[submitForRevision] Updating approved answers:', {
            count: approvedAnswerIds.length,
            ids: approvedAnswerIds
        });

        await Answer.update(
            {
                finalReview: true
            },
            {
                where: {
                    id: {
                        [Op.in]: approvedAnswerIds
                    }
                },
                transaction
            }
        );

        // Update rejected answers - set revisionStatus to initial
        const rejectedAnswerIds = answers
            .filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED)
            .map(a => a.id);

        console.log('[submitForRevision] Updating rejected answers:', {
            count: rejectedAnswerIds.length,
            ids: rejectedAnswerIds
        });

        await Answer.update(
            {
                revisionStatus: REVISION_STATUS.INITIAL
            },
            {
                where: {
                    id: {
                        [Op.in]: rejectedAnswerIds
                    }
                },
                transaction
            }
        );

        console.log('[submitForRevision] Updating subAssessment status');
        // Update subAssessment status to reflect revision needed
        await subAssessment.update({
            reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION,
            revisedAt: new Date(),
            revisedBy: userId
        }, { transaction });

        console.log('[submitForRevision] Committing transaction');
        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['Assessment submitted for revision successfully']
        });
        console.log('[submitForRevision] Request completed successfully');

    } catch (error) {
        console.error('[submitForRevision] Error occurred:', error);
        await transaction.rollback();
        console.log('[submitForRevision] Transaction rolled back');
        next(error);
    }
};

export const markReviewComplete = async (req, res, next) => {
    const { subAssessmentId } = req.params;
    const userId = req.user.id;

    const transaction = await sequelize.transaction();

    try {
        const subAssessment = await SubAssessment.findOne({
            where: {
                id: subAssessmentId,
                reviewStatus: {
                    [Op.in]: [
                        SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW,
                        SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW
                    ]
                }
            },
            include: [{
                model: AssessmentQuestion,
                as: 'questions',
                include: [{
                    model: Answer,
                    as: 'answer'
                }]
            }],
            transaction
        });

        if (!subAssessment) {
            throw new AppError('SubAssessment not found or not in review state', 404);
        }

        // Get all answers for this subAssessment
        const answers = subAssessment.questions
            .filter(q => q.answer)
            .map(q => q.answer);

        // Update all answers to finalReview true since review is complete
        await Answer.update(
            {
                finalReview: true
            },
            {
                where: {
                    id: {
                        [Op.in]: answers.map(a => a.id)
                    }
                },
                transaction
            }
        );

        // Update subAssessment status to completed
        await subAssessment.update({
            reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.COMPLETED,
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['Mark review complete successfully']
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
                        answerText: ANSWER_TYPES.YES,
                        finalReview: false  // Only get answers where final decision is false
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
                    where: { reviewStatus: ANSWER_REVIEW_STATUS.REJECTED },
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
            distinct: true,  // ✅ Ensures unique count of `AssessmentQuestion`
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

