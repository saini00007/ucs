import { Answer, Assessment, AssessmentQuestion, Department, MasterQuestion } from '../models';
import AppError from './AppError';
import { literal, QueryTypes, Sequelize } from 'sequelize';

// Assessment level statistics
export const calculateAssessmentStatistics = async (assessmentId) => {
    try {
        // Get total questions count
        const totalQuestions = await AssessmentQuestion.count({
            where: { assessmentId }
        });

        // Get base answer statistics
        const stats = await Answer.findAll({
            attributes: [
                [literal('COUNT(*)'), 'totalAnswers'],
                [literal('SUM(CASE WHEN LOWER(answer_text) = \'yes\' THEN 1 ELSE 0 END)'), 'yesCount'],
                [literal('SUM(CASE WHEN LOWER(answer_text) = \'no\' THEN 1 ELSE 0 END)'), 'noCount'],
                [literal('SUM(CASE WHEN LOWER(answer_text) = \'notapplicable\' THEN 1 ELSE 0 END)'), 'notApplicableCount']
            ],
            include: [{
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                attributes: [],
                where: { assessmentId },
                required: true
            }],
            raw: true
        });

        // Get control numbers statistics using a raw query
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

        // Format control stats by answer type
        const formatControlStats = (answerType) => {
            const controls = {};
            controlStats
                .filter(stat => stat.answer_text.toLowerCase() === answerType.toLowerCase())
                .forEach(stat => {
                    if (stat.sp80053ControlNum) {
                        controls[stat.sp80053ControlNum] = parseInt(stat.count);
                    }
                });
            return controls;
        };

        // Format the response
        const statistics = {
            totalQuestions,
            totalAnswers: parseInt(stats[0]?.totalAnswers) || 0,
            yesStats: {
                count: parseInt(stats[0]?.yesCount) || 0,
                sp80053ControlNum: formatControlStats('yes')
            },
            noStats: {
                count: parseInt(stats[0]?.noCount) || 0,
                sp80053ControlNum: formatControlStats('no')
            },
            notApplicableStats: {
                count: parseInt(stats[0]?.notApplicableCount) || 0,
                sp80053ControlNum: formatControlStats('notapplicable')
            }
        };

        return statistics;

    } catch (error) {
        console.error('Error calculating assessment statistics:', error);
        throw new AppError('Failed to calculate assessment statistics', 500);
    }
};

// Company level statistics
export const calculateCompanyStatistics = async (companyId) => {
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
                SUM(CASE WHEN LOWER(answer_text) = 'yes' THEN 1 ELSE 0 END) as "yesCount",
                SUM(CASE WHEN LOWER(answer_text) = 'no' THEN 1 ELSE 0 END) as "noCount",
                SUM(CASE WHEN LOWER(answer_text) = 'notapplicable' THEN 1 ELSE 0 END) as "notApplicableCount"
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

        // Format control stats by answer type
        const formatControlStats = (answerType) => {
            const controls = {};
            controlStats
                .filter(stat => stat.answer_text.toLowerCase() === answerType.toLowerCase())
                .forEach(stat => {
                    if (stat.sp80053ControlNum) {
                        controls[stat.sp80053ControlNum] = parseInt(stat.count);
                    }
                });
            return controls;
        };

        // Format the response
        const statistics = {
            totalQuestions,
            totalAnswers: parseInt(stats?.totalAnswers) || 0,
            yesStats: {
                count: parseInt(stats?.yesCount) || 0,
                sp80053ControlNum: formatControlStats('yes')
            },
            noStats: {
                count: parseInt(stats?.noCount) || 0,
                sp80053ControlNum: formatControlStats('no')
            },
            notApplicableStats: {
                count: parseInt(stats?.notApplicableCount) || 0,
                sp80053ControlNum: formatControlStats('notapplicable')
            }
        };

        return statistics;

    } catch (error) {
        console.error('Error calculating company statistics:', error);
        throw new AppError('Failed to calculate company statistics', 500);
    }
};