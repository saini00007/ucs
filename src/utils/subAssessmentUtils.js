import { Answer, AssessmentQuestion } from "../models";
import { ANSWER_REVIEW_STATUS, REVISION_STATUS, SUB_ASSESSMENT_REVIEW_STATUS } from "./constants";

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

export const calculateSubAssessmentStats = (assessment) => {
  const questions = assessment.questions || [];
  const answers = questions.map(q => q.answer).filter(Boolean);

  switch (assessment.reviewStatus) {
    case SUB_ASSESSMENT_REVIEW_STATUS.DRAFT:
      return {
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        yes: answers.filter(a => a.answerText === 'yes').length,
        no: answers.filter(a => a.answerText === 'no').length,
        notApplicable: answers.filter(a => a.answerText === 'notApplicable').length
      };

    case SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW:
    case SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW: {

      // Get answers that need review
      const answersToReview = answers.filter(a => a.finalReview === false);

      // Get counts with logging
      const pending = answersToReview.filter(a => {
        const isPending = a.reviewStatus === ANSWER_REVIEW_STATUS.PENDING;
        return isPending;
      }).length;

      const approved = answersToReview.filter(a => {
        const isApproved = a.reviewStatus === ANSWER_REVIEW_STATUS.APPROVED;
        return isApproved;
      }).length;

      const rejected = answersToReview.filter(a => {
        const isRejected = a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED;
        return isRejected;
      }).length;


      return {
        totalToReview: answersToReview.length,
        pending,
        approved,
        rejected
      };
    }

    case SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION: {
      // Add logging for need revision state
      
      const rejected = answers.filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED);
      
      const improved = rejected.filter(a => a.revisionStatus === REVISION_STATUS.IMPROVED);


      return {
        totalRejected: rejected.length,
        improved: improved.length,
        remaining: rejected.length - improved.length
      };
    }

    default:
      return null;
  }
};