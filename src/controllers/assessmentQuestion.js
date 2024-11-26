import { Assessment, AssessmentQuestion, Department, MasterQuestion, Answer, EvidenceFile, Comment, User } from '../models/index.js';

// export const addAssessmentQuestions = async (req, res) => {
//   const { assessmentId } = req.params;
//   const { questionIds } = req.body;

//   try {
//     const validQuestions = await MasterQuestion.findAll({
//       where: { id: questionIds },
//       attributes: ['id', 'questionText'],
//     });

//     const validQuestionIds = validQuestions.map(question => question.id);
//     const invalidQuestionIds = questionIds.filter(id => !validQuestionIds.includes(id));

//     if (invalidQuestionIds.length > 0) {
//       return res.status(400).json({
//         success: false,
//         messages: ['Invalid question IDs: ' + invalidQuestionIds.join(', ')],
//       });
//     }

//     const assessmentQuestions = await Promise.all(
//       questionIds.map(async (questionId) => {
//         const assessmentQuestion = await AssessmentQuestion.create({
//           assessmentId,
//           masterQuestionId: questionId,
//         });

//         const masterQuestion = validQuestions.find(question => question.id === questionId);

//         return {
//           id: assessmentQuestion.id,
//           assessmentId: assessmentQuestion.assessmentId,
//           masterQuestionId: assessmentQuestion.assessmentId,
//           masterQuestion: {
//             questionText: masterQuestion.questionText,
//           },
//           answer: null,
//         };
//       })
//     );

//     res.status(201).json({
//       success: true,
//       messages: ['Assessment questions added successfully'],
//       addedAssessmentQuestions: assessmentQuestions,
//     });
//   } catch (error) {
//     console.error('Error adding assessment questions:', error);
//     res.status(500).json({ success: false, messages: ['Server error'] });
//   }
// };

export const getAssessmentQuestionById = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const assessmentQuestion = await AssessmentQuestion.findOne({
      where: { id: assessmentQuestionId },
      attributes: ['id', 'assessmentId'],
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
                attributes: ['id', 'username']
              }]
            }, {
              model: User,
              as: 'creator',
              attributes: ['id', 'username']
            }
          ],

        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username']
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!assessmentQuestion) {
      return res.status(404).json({ success: false, messages: ['Assessment question not found'] });
    }

    res.status(200).json({
      success: true,
      assessmentQuestion,
    });
  } catch (error) {
    console.error('Error fetching assessment question:', error);
    res.status(500).json({ success: false, messages: ['Server error'] });
  }
};

export const getAnswerByAssessmentQuestionId = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const answer = await Answer.findOne({
      where: { assessmentQuestionId },
      include: [{
        model: EvidenceFile,
        as: 'evidenceFiles',
        attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }
      ],
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        messages: ['No Answer found'],
      });
    }

    res.status(200).json({
      success: true,
      answer: answer,
    });
  } catch (error) {
    console.error('Error retrieving answer:', error);
    res.status(500).json({ success: false, messages: ['Error retrieving answer.'], error: error.message });
  }
};

export const getCommentsByAssessmentQuestionId = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const comments = await Comment.findAll({
      where: { assessmentQuestionId: assessmentQuestionId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
      paranoid: false,
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      messages: ['Comments retrieved successfully'],
      comments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error retrieving comments'], error: error.message });
  }
};

// export const deleteAssessmentQuestions = async (req, res) => {
//   const { questionIds } = req.body;
//   const assessmentId = req.params.assessmentId;

//   try {
//     const result = await AssessmentQuestion.destroy({
//       where: {
//         id: questionIds,
//       },
//     });

//     if (result === 0) {
//       return res.status(404).json({ success: false, messages: ['No assessment questions found'] });
//     }

//     res.status(200).json({
//       success: true,
//       messages: ['Assessment questions deleted successfully'],
//       deletedCount: result,
//     });
//   } catch (error) {
//     console.error('Error deleting assessment questions:', error);
//     res.status(500).json({ success: false, messages: ['Server error'] });
//   }
// };
