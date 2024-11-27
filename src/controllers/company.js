import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import UserDepartmentLink from '../models/UserDepartmentLink.js';

export const createCompany = async (req, res) => {
  const {
    companyName,
    postalAddress,
    gstNumber,
    primaryEmail,
    secondaryEmail,
    primaryPhone,
    secondaryPhone,
    primaryCountryCode,
    secondaryCountryCode,
    panNumber
  } = req.body;

  try {
    // Create a new company record in the database
    const newCompany = await Company.create({
      companyName,
      postalAddress,
      gstNumber,
      primaryEmail,
      secondaryEmail,
      primaryPhone,
      secondaryPhone,
      primaryCountryCode,
      secondaryCountryCode,
      panNumber,
      createdByUserId: req.user.id,
    });

    // Send a success response with the newly created company details
    res.status(201).json({
      success: true,
      messages: ['Company created successfully!'],
      company: newCompany,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while creating the company.'],
    });
  }
};

export const getAllCompanies = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Fetch companies with pagination and count the total number of companies
    const { count, rows: companies } = await Company.findAndCountAll({
      limit: limit,
      offset: (page - 1) * limit,
    });

    // Return empty list if no companies are found
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No companies found'],
        companies: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    // Return 404 if requested page exceeds total pages
    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        messages: ['Page not found'],
      });
    }

    // Return companies with pagination data
    res.status(200).json({
      success: true,
      messages: ['Companies retrieved successfully'],
      companies,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      },
    });
  } catch (error) {
    // Handle error and send response
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while fetching companies.'],
    });
  }
};

export const getCompanyById = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Fetch the company
    const company = await Company.findByPk(companyId);

    // If the company is not found, return a 404 error with a message
    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found.'],
      });
    }

    // If the company is found, return it in the response with a success message
    res.status(200).json({
      success: true,
      messages: ['Company retrieved successfully'],
      company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while fetching the company.'],
    });
  }
};


export const updateCompany = async (req, res) => {

  const { companyId } = req.params;
  const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone, primaryCountryCode, secondaryCountryCode, panNumber } = req.body;

  try {
    // Find the company by its ID in the database
    const company = await Company.findByPk(companyId);

    // If the company is not found, return a 404 error with a message
    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found.'],
      });
    }

    // Update the company's fields if the new values are provided in the request body
    if (companyName) company.companyName = companyName;
    if (postalAddress) company.postalAddress = postalAddress;
    if (gstNumber) company.gstNumber = gstNumber;
    if (primaryEmail) company.primaryEmail = primaryEmail;
    if (secondaryEmail) company.secondaryEmail = secondaryEmail;
    if (primaryPhone) company.primaryPhone = primaryPhone;
    if (secondaryPhone) company.secondaryPhone = secondaryPhone;
    if (primaryCountryCode) company.primaryCountryCode = primaryCountryCode;
    if (secondaryCountryCode) company.secondaryCountryCode = secondaryCountryCode;
    if (panNumber) company.panNumber = panNumber;

    // Save the updated company details to the database
    await company.save();

    // Return a success response with the updated company data
    res.status(200).json({
      success: true,
      messages: ['Company updated successfully'],
      company,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      messages: ['Error updating company'],
    });
  }
};


export const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Find all departments associated with the company
    const departments = await Department.findAll({
      where: { companyId },
      attributes: ['id'],
      transaction,
    });

    const departmentIds = departments.map(department => department.id);

    // Find all assessments associated with the found departments
    const assessments = await Assessment.findAll({
      where: { departmentId: { [Op.in]: departmentIds } },
      attributes: ['id'],
      transaction,
    });

    const assessmentIds = assessments.map(assessment => assessment.id);

    // Find all assessment questions associated with the found assessments
    const assessmentQuestions = await AssessmentQuestion.findAll({
      where: { assessmentId: { [Op.in]: assessmentIds } },
      attributes: ['id'],
      transaction,
    });

    const assessmentQuestionIds = assessmentQuestions.map(q => q.id);

    // Find all answers associated with the found assessment questions
    const answers = await Answer.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

    const answerIds = answers.map(a => a.id);

    // Find all evidence files associated with the found answers
    const evidenceFiles = await EvidenceFile.findAll({
      where: { answerId: { [Op.in]: answerIds } },
      attributes: ['id'],
      transaction,
    });

    const evidenceFileIds = evidenceFiles.map(e => e.id);

    // Find all comments associated with the found assessment questions
    const comments = await Comment.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

    // Delete all found comments
    await Comment.destroy({
      where: { id: { [Op.in]: comments.map(c => c.id) } },
      transaction,
    });

    // Delete all found evidence files
    await EvidenceFile.destroy({
      where: { id: { [Op.in]: evidenceFileIds } },
      transaction,
    });

    // Delete all found answers
    await Answer.destroy({
      where: { id: { [Op.in]: answerIds } },
      transaction,
    });

    // Delete all found assessment questions
    await AssessmentQuestion.destroy({
      where: { id: { [Op.in]: assessmentQuestionIds } },
      transaction,
    });

    // Delete all found assessments
    await Assessment.destroy({
      where: { id: { [Op.in]: assessmentIds } },
      transaction,
    });

    // Delete all user-department links associated with the found departments
    await UserDepartmentLink.destroy({
      where: { departmentId: { [Op.in]: departmentIds } },
      transaction,
    });

    // Delete all found departments
    await Department.destroy({
      where: { id: { [Op.in]: departmentIds } },
      transaction,
    });

    // Delete the company
    const companyDeleted = await Company.destroy({
      where: { id: companyId },
      transaction,
    });

    // Check if the company was actually deleted
    if (companyDeleted === 0) {
      throw new Error('Company not found or already deleted');
    }

    // Delete all users associated with the company
    await User.destroy({
      where: { companyId },
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    // Send success response
    return res.status(200).json({
      success: true,
      messages: ['Company and related records deleted successfully'],
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();

    console.error('Error deleting company and related records:', error);
    return res.status(500).json({
      success: false,
      messages: ['Error deleting company and related records'],
    });
  }
};


export const getDepartmentsByCompanyId = async (req, res) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Fetch departments for the given companyId with pagination
    const { count, rows: departments } = await Department.findAndCountAll({
      where: { companyId: companyId },
      limit: limit,
      offset: (page - 1) * limit,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['companyName'],
        },
        {
          model: MasterDepartment,
          as: 'masterDepartment',
          attributes: ['departmentName'],
        },
      ],
    });

    // If no departments are found, return an empty response with pagination
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No departments found'],
        departments: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    // If the page exceeds total pages, return an error
    if (page > totalPages) {
      return res.status(404).json({ success: false, messages: ['Page not found'] });
    }

    // Return departments with pagination details
    res.status(200).json({
      success: true,
      departments,
      pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit },
    });
  } catch (error) {
    console.error('Error fetching departments for company:', error);
    res.status(500).json({ success: false, messages: ['Failed to fetch departments'] });
  }
};


export const getUsersByCompanyId = async (req, res) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Fetch users for the given companyId with pagination and exclude sensitive fields
    const { count, rows: users } = await User.findAndCountAll({
      where: { companyId },
      attributes: { exclude: ['password', 'deletedAt'] },
      include: [{
        model: Department,
        as: 'departments',
        attributes: ['id'],
        through: { attributes: [] },
      }],
      limit: limit,
      offset: (page - 1) * limit,
    });

    // If no users are found, return an empty response with pagination
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No users found'],
        users: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    // If the page exceeds total pages, return an error
    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        messages: ['Page not found'],
      });
    }

    // Return users with pagination details
    res.status(200).json({
      success: true,
      messages: ['Users retrieved successfully'],
      users: users,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching users by company:', error);
    res.status(500).json({
      success: false,
      messages: ['Error fetching users'],
      error: error.message,
    });
  }
};
