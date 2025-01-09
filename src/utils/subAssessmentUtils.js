import { Answer, AssessmentQuestion } from "../models";


export const checkSubAssessmentCompletion = async (subAssessmentId) => {

    const totalQuestions = await AssessmentQuestion.count({
        where: { subAssessmentId }
    });

    const answeredQuestions = await AssessmentQuestion.count({
        where: { subAssessmentId },
        include: [{
            model: Answer,
            as: 'answer',
            required: true
        }]
    });
    return totalQuestions === answeredQuestions;
}