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

  console.log('=== Debug Stats ===');
  console.log('Assessment Review Status:', assessment.reviewStatus);
  console.log('Raw answers:', answers.map(a => ({
    id: a.id,
    finalReview: a.finalReview,
    reviewStatus: a.reviewStatus,
    revisionStatus: a.revisionStatus
  })));

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
      // Log all answers that should be counted
      console.log('Checking answers for review:');
      answers.forEach(a => {
        console.log(`Answer ${a.id}:`, {
          finalReview: a.finalReview,
          reviewStatus: a.reviewStatus,
          shouldCount: a.finalReview === false
        });
      });

      // Get answers that need review
      const answersToReview = answers.filter(a => a.finalReview === false);
      console.log('Answers to review:', answersToReview.length);

      // Get counts with logging
      const pending = answersToReview.filter(a => {
        const isPending = a.reviewStatus === ANSWER_REVIEW_STATUS.PENDING;
        console.log(`Answer ${a.id} pending check:`, isPending);
        return isPending;
      }).length;

      const approved = answersToReview.filter(a => {
        const isApproved = a.reviewStatus === ANSWER_REVIEW_STATUS.APPROVED;
        console.log(`Answer ${a.id} approved check:`, isApproved);
        return isApproved;
      }).length;

      const rejected = answersToReview.filter(a => {
        const isRejected = a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED;
        console.log(`Answer ${a.id} rejected check:`, isRejected);
        return isRejected;
      }).length;

      console.log('Final counts:', { totalToReview: answersToReview.length, pending, approved, rejected });

      return {
        totalToReview: answersToReview.length,
        pending,
        approved,
        rejected
      };
    }

    case SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION: {
      // Add logging for need revision state
      console.log('NEED_REVISION State - All Answers:', answers.length);
      
      const rejected = answers.filter(a => a.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED);
      console.log('Rejected answers:', rejected.length);
      
      const improved = rejected.filter(a => a.revisionStatus === REVISION_STATUS.IMPROVED);
      console.log('Improved answers:', improved.length);

      // Log each rejected answer details
      rejected.forEach(a => {
        console.log('Rejected Answer:', {
          id: a.id,
          reviewStatus: a.reviewStatus,
          revisionStatus: a.revisionStatus,
          finalReview: a.finalReview
        });
      });

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