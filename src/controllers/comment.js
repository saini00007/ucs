import Comment from '../models/Comment.js';

export const createComment = async (req, res) => {
  const { assessmentQuestionId } = req.params;
  const { commentText } = req.body;

  try {
    const newComment = await Comment.create({
      assessmentQuestionId,
      createdByUserId: req.user.id,
      commentText,
    });

    return res.status(201).json({
      success: true,
      messages: ['Comment created successfully'],
      comment: newComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error creating comment'], error: error.message });
  }
};

export const getCommentById = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findOne({
      where: { id },
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

export const getCommentsByQuestionId = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const comments = await Comment.findAll({
      where: { assessmentQuestionId },
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

  try {
    const [updated] = await Comment.update({ commentText }, {
      where: { id: commentId },
    });

    if (updated) {
      const updatedComment = await Comment.findOne({ where: { id: commentId } });
      return res.status(200).json({
        success: true,
        messages: ['Comment updated successfully'],
        comment: updatedComment,
      });
    }

    return res.status(404).json({ success: false, messages: ['Comment not found'] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error updating comment'], error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const deleted = await Comment.destroy({
      where: { id: commentId },
    });

    if (deleted) {
      return res.status(200).json({
        success: true,
        messages: ['Comment deleted successfully'],
      });
    }
    
    return res.status(404).json({ success: false, messages: ['Comment not found'] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, messages: ['Error deleting comment'], error: error.message });
  }
};
