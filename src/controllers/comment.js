import Comment from '../models/Comment.js';
import Answer from '../models/Answer.js';
import User from '../models/User.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';

export const createComment = async (req, res) => {
  const { assessmentQuestionId } = req.params;
  const { commentText } = req.body;

  try {
    const assessmentQuestion = await AssessmentQuestion.findOne({ where: { id: assessmentQuestionId } });
    if (!assessmentQuestion) {
      return res.status(404).json({ success: false, messages: ['No associated assessmentQuestion found'] });
    }

    const newComment = await Comment.create({
      assessmentQuestionId: assessmentQuestion.id,
      createdByUserId: req.user.id,
      commentText,
    });

    const commentWithUser = await Comment.findOne({
      where: { id: newComment.id },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
    });

    return res.status(201).json({
      success: true,
      messages: ['Comment created successfully'],
      comment: commentWithUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error creating comment'], error: error.message });
  }
};

export const getCommentById = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],

    });

    if (comment) {
      return res.status(200).json({
        success: true,
        comment,
      });
    }

    return res.status(404).json({ success: false, messages: ['Comment not found'] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error retrieving comment'], error: error.message });
  }
};

export const getCommentsByAssessmentQuestionId = async (req, res) => {
  const { assessmentQuestionId } = req.params;
  try {
    const comments = await Comment.findAll({
      where: { assessmentQuestionId: assessmentQuestionId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
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

export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { commentText } = req.body;

  const UPDATE_TIME_LIMIT = 20 * 60 * 1000;

  try {
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
    });

    if (!comment) {
      return res.status(404).json({ success: false, messages: ['Comment not found'] });
    }

    const currentTime = new Date().getTime();
    const commentCreationTime = new Date(comment.createdAt).getTime();
    console.log(currentTime - commentCreationTime);
    if (currentTime - commentCreationTime > UPDATE_TIME_LIMIT) {
      return res.status(403).json({
        success: false,
        messages: ['Time limit exceeded. You can no longer update this comment.']
      });
    }

    comment.commentText = commentText;
    await comment.save();
    return res.status(200).json({
      success: true,
      messages: ['Comment updated successfully'],
      comment,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      messages: ['Error updating comment'],
      error: error.message
    });
  }
};



export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        messages: ['Comment not found'],
      });
    }

    if (comment.deleted) {
      return res.status(400).json({
        success: false,
        messages: ['This comment has already been deleted'],
      });
    }
    comment.deletedAt = new Date();
    comment.deleted = true;
    await comment.save();

    return res.status(200).json({
      success: true,
      messages: ['Comment deleted successfully'],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      messages: ['Error deleting comment'],
      error: error.message,
    });
  }
};


