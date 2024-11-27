import Comment from '../models/Comment.js';
import Answer from '../models/Answer.js';
import User from '../models/User.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';

export const createComment = async (req, res) => {
  const { assessmentQuestionId } = req.params; 
  const { commentText } = req.body;

  try {
    // Find the assessment question by its ID
    const assessmentQuestion = await AssessmentQuestion.findOne({ where: { id: assessmentQuestionId } });
    
    // If no assessment question is found, return a 404 error
    if (!assessmentQuestion) {
      return res.status(404).json({ success: false, messages: ['No associated assessmentQuestion found'] });
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
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
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
    return res.status(500).json({ success: false, messages: ['Error creating comment'], error: error.message });
  }
};


export const getCommentById = async (req, res) => {
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
    return res.status(404).json({ success: false, messages: ['Comment not found'] });
  } catch (error) {
    console.error(error);
    // Return an error response if something goes wrong
    return res.status(500).json({ success: false, messages: ['Error retrieving comment'], error: error.message });
  }
};


export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { commentText } = req.body; 

  const UPDATE_TIME_LIMIT = 20 * 60 * 1000; // Set the time limit (20 minutes) for updating the comment

  try {
    // Retrieve the comment by its ID and include the user (creator) data
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
    });

    // If the comment is not found, return a 404 error
    if (!comment) {
      return res.status(404).json({ success: false, messages: ['Comment not found'] });
    }

    // Calculate the time difference between the current time and the comment's creation time
    const currentTime = new Date().getTime();
    const commentCreationTime = new Date(comment.createdAt).getTime();

    // If the time limit for updating the comment has passed, return a 403 error
    if (currentTime - commentCreationTime > UPDATE_TIME_LIMIT) {
      return res.status(403).json({
        success: false,
        messages: ['Time limit exceeded. You can no longer update this comment.']
      });
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
    console.error(error);
    // Return a 500 error response if something goes wrong during the update
    return res.status(500).json({
      success: false,
      messages: ['Error updating comment'],
      error: error.message,
    });
  }
};


export const deleteComment = async (req, res) => {
  const { commentId } = req.params;  // Extract the comment ID from the URL parameters

  try {
    // Attempt to delete the comment by its ID from the database
    const rowsDeleted = await Comment.destroy({
      where: { id: commentId },
    });

    // If no rows were deleted, the comment was not found or it has already been deleted
    if (rowsDeleted === 0) {
      return res.status(404).json({
        success: false,
        messages: ['Comment not found or already deleted'],
      });
    }

    // Return success response if the comment was deleted successfully
    return res.status(200).json({
      success: true,
      messages: ['Comment deleted successfully'],
    });
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    // Return an error response if the deletion process fails
    return res.status(500).json({
      success: false,
      messages: ['Error deleting comment'],
      error: error.message,
    });
  }
};




