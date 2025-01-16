import { Answer, Assessment, AssessmentQuestion, Department, MasterQuestion } from '../models';
import AppError from './AppError';
import { literal, QueryTypes, Sequelize } from 'sequelize';
import { ANSWER_TYPES } from './constants'

const formatControlStats = (answerType, controlStats) => {
    const groupedCounts = {};

    controlStats
        .filter(stat => stat.answer_text === answerType)
        .forEach(stat => {
            if (stat.sp80053ControlNum) {
                const prefix = stat.sp80053ControlNum.split('-')[0];
                groupedCounts[prefix] = (groupedCounts[prefix] || 0) + parseInt(stat.count);
            }
        });

    return groupedCounts;
};

const calculatePercentage = (count, total) => {
    if (total === 0) return 0;
    return parseFloat(((count / total) * 100).toFixed(2));
};

const baseStatistics = async (id, type = 'assessment') => {
    const whereClause = type === 'assessment' ? 
        { assessmentId: id } : 
        { subAssessmentId: id };

    const stats = await Answer.findAll({
        attributes: [
            [literal('COUNT(*)'), 'totalAnswers'],
            [literal(`SUM(CASE WHEN answer_text = '${ANSWER_TYPES.YES}' THEN 1 ELSE 0 END)`), 'yesCount'],
            [literal(`SUM(CASE WHEN answer_text = '${ANSWER_TYPES.NO}' THEN 1 ELSE 0 END)`), 'noCount'],
            [literal(`SUM(CASE WHEN answer_text = '${ANSWER_TYPES.NOT_APPLICABLE}' THEN 1 ELSE 0 END)`), 'notApplicableCount']
        ],
        include: [{
            model: AssessmentQuestion,
            as: 'assessmentQuestion',
            attributes: [],
            where: whereClause,
            required: true
        }],
        raw: true
    });
    return stats;
}

const totalQuestionsCount = async (id, type = 'assessment') => {
    const whereClause = type === 'assessment' ? 
        { assessmentId: id } : 
        { subAssessmentId: id };

    const totalQuestions = await AssessmentQuestion.count({
        where: whereClause
    });
    return totalQuestions;
}

export const calculateAssessmentStatistics = async (assessmentId) => {
    try {
        const totalQuestions = await totalQuestionsCount(assessmentId, 'assessment')
        const stats = await baseStatistics(assessmentId, 'assessment')
        
        const controlStatsQuery = `
            SELECT 
                a.answer_text,
                mq.sp_800_53_control_number as "sp80053ControlNum",
                COUNT(*) as count
            FROM answers a
            INNER JOIN assessment_questions aq ON a.assessment_question_id = aq.id
            INNER JOIN master_questions mq ON aq.master_question_id = mq.id
            WHERE aq.assessment_id = :assessmentId
            GROUP BY a.answer_text, mq.sp_800_53_control_number
        `;

        const controlStats = await Answer.sequelize.query(
            controlStatsQuery,
            {
                replacements: { assessmentId },
                type: QueryTypes.SELECT
            }
        );

        const totalAnswers = parseInt(stats[0]?.totalAnswers) || 0;
        const yesCount = parseInt(stats[0]?.yesCount) || 0;
        const noCount = parseInt(stats[0]?.noCount) || 0;
        const notApplicableCount = parseInt(stats[0]?.notApplicableCount) || 0;

        return {
            totalQuestions,
            totalAnswers,
            percentageCompleted: calculatePercentage(totalAnswers, totalQuestions),
            yesStats: {
                count: yesCount,
                percentage: calculatePercentage(yesCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.YES, controlStats)
            },
            noStats: {
                count: noCount,
                percentage: calculatePercentage(noCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NO, controlStats)
            },
            notApplicableStats: {
                count: notApplicableCount,
                percentage: calculatePercentage(notApplicableCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NOT_APPLICABLE, controlStats)
            }
        };

    } catch (error) {
        console.error('Error calculating assessment statistics:', error);
        throw new AppError('Failed to calculate assessment statistics', 500);
    }
};

export const calculateSubAssessmentStatistics = async (subAssessmentId) => {
    try {
        const totalQuestions = await totalQuestionsCount(subAssessmentId, 'subassessment')
        const stats = await baseStatistics(subAssessmentId, 'subassessment')
        
        const controlStatsQuery = `
            SELECT 
                a.answer_text,
                mq.sp_800_53_control_number as "sp80053ControlNum",
                COUNT(*) as count
            FROM answers a
            INNER JOIN assessment_questions aq ON a.assessment_question_id = aq.id
            INNER JOIN master_questions mq ON aq.master_question_id = mq.id
            WHERE aq.sub_assessment_id = :subAssessmentId
            GROUP BY a.answer_text, mq.sp_800_53_control_number
        `;

        const controlStats = await Answer.sequelize.query(
            controlStatsQuery,
            {
                replacements: { subAssessmentId },
                type: QueryTypes.SELECT
            }
        );

        const totalAnswers = parseInt(stats[0]?.totalAnswers) || 0;
        const yesCount = parseInt(stats[0]?.yesCount) || 0;
        const noCount = parseInt(stats[0]?.noCount) || 0;
        const notApplicableCount = parseInt(stats[0]?.notApplicableCount) || 0;

        return {
            totalQuestions,
            totalAnswers,
            percentageCompleted: calculatePercentage(totalAnswers, totalQuestions),
            yesStats: {
                count: yesCount,
                percentage: calculatePercentage(yesCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.YES, controlStats)
            },
            noStats: {
                count: noCount,
                percentage: calculatePercentage(noCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NO, controlStats)
            },
            notApplicableStats: {
                count: notApplicableCount,
                percentage: calculatePercentage(notApplicableCount, totalAnswers),
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NOT_APPLICABLE, controlStats)
            }
        };

    } catch (error) {
        console.error('Error calculating subassessment statistics:', error);
        throw new AppError('Failed to calculate subassessment statistics', 500);
    }
};

// Company level statistics
export const calculateAssessmentStatisticsForCompany = async (companyId) => {
    try {
        // Get total questions count using subquery
        const totalQuestionsQuery = `
            SELECT COUNT(DISTINCT aq.id) as total
            FROM assessment_questions aq
            INNER JOIN assessments a ON aq.assessment_id = a.id
            INNER JOIN departments d ON a.department_id = d.id
            WHERE d.company_id = :companyId
        `;

        const [totalQuestionsResult] = await Answer.sequelize.query(
            totalQuestionsQuery,
            {
                replacements: { companyId },
                type: QueryTypes.SELECT
            }
        );

        const totalQuestions = totalQuestionsResult.total;

        // Get base answer statistics using raw query
        const statsQuery = `
            SELECT 
                COUNT(*) as "totalAnswers",
                SUM(CASE WHEN answer_text = '${ANSWER_TYPES.YES}' THEN 1 ELSE 0 END) as "yesCount",
                SUM(CASE WHEN answer_text = '${ANSWER_TYPES.NO}' THEN 1 ELSE 0 END) as "noCount",
                SUM(CASE WHEN answer_text = '${ANSWER_TYPES.NOT_APPLICABLE}' THEN 1 ELSE 0 END) as "notApplicableCount"
            FROM answers a
            INNER JOIN assessment_questions aq ON a.assessment_question_id = aq.id
            INNER JOIN assessments ast ON aq.assessment_id = ast.id
            INNER JOIN departments d ON ast.department_id = d.id
            WHERE d.company_id = :companyId
        `;

        const [stats] = await Answer.sequelize.query(
            statsQuery,
            {
                replacements: { companyId },
                type: QueryTypes.SELECT
            }
        );

        // Get control numbers statistics using raw query
        const controlStatsQuery = `
            SELECT 
                a.answer_text,
                mq.sp_800_53_control_number as "sp80053ControlNum",
                COUNT(*) as count
            FROM answers a
            INNER JOIN assessment_questions aq ON a.assessment_question_id = aq.id
            INNER JOIN master_questions mq ON aq.master_question_id = mq.id
            INNER JOIN assessments ast ON aq.assessment_id = ast.id
            INNER JOIN departments d ON ast.department_id = d.id
            WHERE d.company_id = :companyId
            GROUP BY a.answer_text, mq.sp_800_53_control_number
        `;

        const controlStats = await Answer.sequelize.query(
            controlStatsQuery,
            {
                replacements: { companyId },
                type: QueryTypes.SELECT
            }
        );

        // Format the response
        const statistics = {
            totalQuestions: parseInt(totalQuestions),
            totalAnswers: parseInt(stats?.totalAnswers) || 0,
            yesStats: {
                count: parseInt(stats?.yesCount) || 0,
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.YES, controlStats)
            },
            noStats: {
                count: parseInt(stats?.noCount) || 0,
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NO, controlStats)
            },
            notApplicableStats: {
                count: parseInt(stats?.notApplicableCount) || 0,
                sp80053ControlNum: formatControlStats(ANSWER_TYPES.NOT_APPLICABLE, controlStats)
            }
        };

        return statistics;

    } catch (error) {
        console.error('Error calculating company statistics:', error);
        throw new AppError('Failed to calculate company statistics', 500);
    }
};

export const getAssessmentStatus = (assessment, statistics) => {
    const now = new Date();
    if (!assessment.submitted && assessment.deadline && new Date(assessment.deadline) < now) {
        return 'deadlined';
    }
    if (assessment.submitted) {
        return 'submitted';
    }

    if (!assessment.assessmentStarted) {
        return 'notStarted';
    }

    // If assessment is started but not all questions are answered
    if (statistics.totalAnswers < statistics.totalQuestions) {
        return 'active';
    }

    // If all questions are answered but not submitted
    if (statistics.totalAnswers === statistics.totalQuestions && !assessment.submitted) {
        return 'completed';
    }

    return 'active';
};

export const getSubAssessmentStatus = (subAssessment, statistics) => {
    const now = new Date();

    if (!subAssessment.submitted && subAssessment.deadline && new Date(subAssessment.deadline) < now) {
        return 'deadlined';
    }

    if (subAssessment.submitted) {
        return 'submitted';
    }

    if (!subAssessment.subAssessmentStarted) {
        return 'notStarted';
    }

    if (statistics.totalAnswers < statistics.totalQuestions) {
        return 'active';
    }

    if (statistics.totalAnswers === statistics.totalQuestions && !subAssessment.submitted) {
        return 'completed';
    }

    return 'active';
};

