import MasterQuestion from '../models/MasterQuestion.js';

export const getMasterQuestions = async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 10;

  try {
    const { count, rows } = await MasterQuestion.findAndCountAll({
      attributes: ['id', 'questionText'],
      limit: limit,
      offset: (page - 1) * limit,
    });
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No Questions found'],
        MasterQuestions: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        },
      });
    }
    
    const totalPages = Math.ceil(count / limit);

    if (page > totalPages) {
      return res.status(404).json({ success: false, messages: ['Page not found'] });
    }
    return res.status(200).json({
      success: true,
      masterQuestions: rows,
      meta: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit
      },
    });
  } catch (error) {
    console.error('Error fetching master questions:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

