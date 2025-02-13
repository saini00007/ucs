import { User, Comment, AssessmentQuestion } from '../models/index.js';
import AppError from '../utils/AppError.js';

export const createComment = async (req, res, next) => {
  const { assessmentQuestionId } = req.params;
  const { commentText } = req.body;

  try {
    // Find the assessment question by its ID
    const assessmentQuestion = await AssessmentQuestion.findOne({ where: { id: assessmentQuestionId } });

    // If no assessment question is found, return a 404 error
    if (!assessmentQuestion) {
      throw new AppError('No associated assessmentQuestion found', 404);
    }

    // Create a new comment associated with the assessment question and user
    const newComment = await Comment.create({
      assessmentQuestionId: assessmentQuestion.id,
      createdByUserId: req.user.id,
      commentText,
    });

    // Fetch the newly created comment with user data
    const commentWithUser = await Comment.findOne({
      where: { id: newComment.id },
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName','lastName'] }],
    });

    // Return success and the created comment with user data
    return res.status(201).json({
      success: true,
      messages: ['Comment created successfully'],
      comment: commentWithUser,
    });
  } catch (error) {
    console.error(error);
    // Return error response in case of failure
    next(error);
  }
};

export const getCommentById = async (req, res, next) => {
  const { commentId } = req.params;

  try {
    // Retrieve the comment by its ID and include the user (creator) data
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
    });

    // If comment is found, return it in the response
    if (comment) {
      return res.status(200).json({
        success: true,
        comment,
      });
    }

    // If no comment is found, return a 404 error
    throw new AppError('Comment not found', 404);
  } catch (error) {
    console.error(error);
    // Return an error response if something goes wrong
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  const { commentId } = req.params;
  const { commentText } = req.body;

  const UPDATE_TIME_LIMIT = 20 * 60 * 1000; // Set the time limit (20 minutes) for updating the comment

  try {
    // Retrieve the comment by its ID and include the user (creator) data
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName','lastName'] }],
    });

    // If the comment is not found, return a 404 error
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Calculate the time difference between the current time and the comment's creation time
    const currentTime = new Date().getTime();
    const commentCreationTime = new Date(comment.createdAt).getTime();

    // If the time limit for updating the comment has passed, return a 403 error
    if (currentTime - commentCreationTime > UPDATE_TIME_LIMIT) {
      throw new AppError('Time limit exceeded. You can no longer update this comment.', 403);
    }

    // Update the comment text with the new value
    comment.commentText = commentText;

    // Save the updated comment
    await comment.save();

    // Return a success response with the updated comment
    return res.status(200).json({
      success: true,
      messages: ['Comment updated successfully'],
      comment,
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    // Return a 500 error response if something goes wrong during the update
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  const { commentId } = req.params;  // Extract the comment ID from the URL parameters

  try {
    // Attempt to delete the comment by its ID from the database
    const rowsDeleted = await Comment.destroy({
      where: { id: commentId },
    });

    // If no rows were deleted, the comment was not found or it has already been deleted
    if (rowsDeleted === 0) {
      throw new AppError('Comment not found or already deleted', 404);
    }

    // Return success response if the comment was deleted successfully
    return res.status(200).json({
      success: true,
      messages: ['Comment deleted successfully'],
    });
  } catch (error) {
    console.error('Error deleting comment:', error);  // Log the error for debugging purposes
    // Return an error response if the deletion process fails
    next(error);
  }
};





