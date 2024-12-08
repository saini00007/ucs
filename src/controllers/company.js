import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment, UserDepartmentLink, MasterQuestion } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

const validateEmailForCompany = async (email, companyId = null) => {
  try {
    // Check the Company table for the email conflict
    const existingCompany = await Company.findOne({
      where: {
        [Op.or]: [
          { primaryEmail: email },
          { secondaryEmail: email }
        ],
        ...(companyId && { id: { [Op.ne]: companyId } })
      },
      paranoid: false
    });

    // Check the User table for the email conflict
    const existingUserEmail = await User.findOne({
      where: { email },
      paranoid: false
    });

    if (existingCompany) {
      return {
        isValid: false,
        message: 'Email already exists in another company'
      };
    }

    if (existingUserEmail) {
      return {
        isValid: false,
        message: 'Email is already in use by a user'
      };
    }

    return { isValid: true };

  } catch (error) {
    throw new Error('Error validating company email: ' + error.message);
  }
};

const handleCompanyEmailUpdates = async (company, primaryEmail, secondaryEmail, transaction) => {
  const originalPrimaryEmail = company.primaryEmail;
  const originalSecondaryEmail = company.secondaryEmail;
  const emailUpdates = [];

  // If primary wants secondary's current email, update secondary first
  if (primaryEmail === originalSecondaryEmail) {
    // Verify new secondary email is provided
    if (!secondaryEmail) {
      throw new Error('New secondary email required when swapping with primary');
    }

    const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail, company.id);
    if (!secondaryEmailValidation.isValid) {
      throw new Error('Secondary email ' + secondaryEmailValidation.message);
    }

    // Update secondary first
    const secondaryAdmin = await User.findOne({
      where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (secondaryAdmin) {
      secondaryAdmin.email = secondaryEmail;
      await secondaryAdmin.save({ transaction });
      emailUpdates.push('Secondary admin email updated');
    }

    // Then update primary
    const primaryAdmin = await User.findOne({
      where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (primaryAdmin) {
      primaryAdmin.email = primaryEmail;
      await primaryAdmin.save({ transaction });
      emailUpdates.push('Primary admin email updated');
    }

    company.secondaryEmail = secondaryEmail;
    company.primaryEmail = primaryEmail;
    return emailUpdates;
  }

  // If secondary wants primary's current email, update primary first
  if (secondaryEmail === originalPrimaryEmail) {
    // Verify new primary email is provided
    if (!primaryEmail) {
      throw new Error('New primary email required when swapping with secondary');
    }

    const primaryEmailValidation = await validateEmailForCompany(primaryEmail, company.id);
    if (!primaryEmailValidation.isValid) {
      throw new Error('Primary email ' + primaryEmailValidation.message);
    }

    // Update primary first
    const primaryAdmin = await User.findOne({
      where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (primaryAdmin) {
      primaryAdmin.email = primaryEmail;
      await primaryAdmin.save({ transaction });
      emailUpdates.push('Primary admin email updated');
    }

    // Then update secondary
    const secondaryAdmin = await User.findOne({
      where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (secondaryAdmin) {
      secondaryAdmin.email = secondaryEmail;
      await secondaryAdmin.save({ transaction });
      emailUpdates.push('Secondary admin email updated');
    }

    company.primaryEmail = primaryEmail;
    company.secondaryEmail = secondaryEmail;
    return emailUpdates;
  }

  // Handle regular updates
  if (primaryEmail && primaryEmail !== originalPrimaryEmail) {
    const primaryEmailValidation = await validateEmailForCompany(primaryEmail, company.id);
    if (!primaryEmailValidation.isValid) {
      throw new Error('Primary email ' + primaryEmailValidation.message);
    }

    const primaryAdmin = await User.findOne({
      where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (primaryAdmin) {
      primaryAdmin.email = primaryEmail;
      await primaryAdmin.save({ transaction });
      emailUpdates.push('Primary admin email updated');
    }
    company.primaryEmail = primaryEmail;
  }

  if (secondaryEmail && secondaryEmail !== originalSecondaryEmail) {
    const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail, company.id);
    if (!secondaryEmailValidation.isValid) {
      throw new Error('Secondary email ' + secondaryEmailValidation.message);
    }

    const secondaryAdmin = await User.findOne({
      where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
      transaction,
    });
    if (secondaryAdmin) {
      secondaryAdmin.email = secondaryEmail;
      await secondaryAdmin.save({ transaction });
      emailUpdates.push('Secondary admin email updated');
    }
    company.secondaryEmail = secondaryEmail;
  }

  return emailUpdates;
};

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
    // Validate primary email
    const primaryEmailValidation = await validateEmailForCompany(primaryEmail);
    if (!primaryEmailValidation.isValid) {
      return res.status(409).json({
        success: false,
        messages: ["Primary " + primaryEmailValidation.message],
      });
    }

    // Validate secondary email
    const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail);
    if (!secondaryEmailValidation.isValid) {
      return res.status(409).json({
        success: false,
        messages: ["Secondary " + secondaryEmailValidation.message],
      });
    }

    // Create the company
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
    panNumber,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(companyId, { transaction });

    if (!company) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        messages: ['Company not found.'],
      });
    }

    // Handle all email updates
    let emailUpdates = [];
    if (primaryEmail || secondaryEmail) {
      try {
        emailUpdates = await handleCompanyEmailUpdates(company, primaryEmail, secondaryEmail, transaction);
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          messages: [error.message],
        });
      }
    }

    if (
      (primaryPhone && primaryPhone === company.secondaryPhone && !secondaryPhone) ||
      (secondaryPhone && secondaryPhone === company.primaryPhone && !primaryPhone)
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        messages: ['Primary email is same as secondary email in database and vice versa.'],
      });
    }

    // Update other fields
    if (companyName) company.companyName = companyName;
    if (postalAddress) company.postalAddress = postalAddress;
    if (gstNumber) company.gstNumber = gstNumber;
    if (primaryPhone) company.primaryPhone = primaryPhone;
    if (secondaryPhone) company.secondaryPhone = secondaryPhone;
    if (primaryCountryCode) company.primaryCountryCode = primaryCountryCode;
    if (secondaryCountryCode) company.secondaryCountryCode = secondaryCountryCode;
    if (panNumber) company.panNumber = panNumber;

    await company.save({ transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      messages: [
        'Company updated successfully',
        ...emailUpdates
      ],
      company,
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      messages: ['Error updating company'],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    if (companyDeleted === 0) {
      await transaction.rollback();  // Rollback if the company wasn't deleted
      return res.status(404).json({
        success: false,
        messages: ['Company not found or already deleted'],
      });
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
  const { roleId, departments } = req.user;

  try {
    // Get department IDs from the user's departments
    const departmentIds = departments.map(department => department.id);

    // Define base query options
    let queryOptions = {
      where: {
        companyId,
      },
      attributes: {
        exclude: ['password', 'deletedAt']
      },
      include: [
        {
          model: Department,
          as: 'departments',
          through: {
            attributes: [], // Exclude junction table attributes
          },
          required: false,
          attributes: ['id'],
        }
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      distinct: true,
      subQuery: false,
    };

    // Apply role-based filtering
    if (['admin', 'superadmin', 'departmentmanager'].includes(roleId)) {
      // These roles can see all users in the company
      // No additional filtering needed
    } else if (['assessor', 'reviewer'].includes(roleId)) {
      // These roles can only see:
      // 1. Company admins
      // 2. Users from their own departments
      queryOptions.where[Op.or] = [
        { roleId: 'admin' }, // Can see admins
        {
          [Op.and]: [
            { '$departments.id$': { [Op.in]: departmentIds } }, // Users from their departments
          ]
        }
      ];
    } else {
      // Unknown role - return error
      return res.status(403).json({
        success: false,
        messages: ['Unauthorized access'],
      });
    }

    // Fetch users based on the query options
    const { count, rows: users } = await User.findAndCountAll(queryOptions);

    // Calculate pagination values
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = parseInt(page, 10);

    // Handle no users found
    if (totalItems === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No users found'],
        users: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage,
          itemsPerPage: parseInt(limit, 10),
        },
      });
    }

    // Handle invalid page number
    if (currentPage > totalPages) {
      return res.status(404).json({
        success: false,
        messages: ['Page not found'],
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      messages: ['Users retrieved successfully'],
      users,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage: parseInt(limit, 10),
      },
    });

  } catch (error) {
    console.error('Error fetching users by company:', error);
    return res.status(500).json({
      success: false,
      messages: ['Error fetching users'],
      error: error.message,
    });
  }
};

export const getReportByCompanyId = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Find all departments
    const departments = await Department.findAll({
      where: { companyId },
      attributes: ['id'],
    });

    if (!departments.length) {
      return res.status(404).json({
        success: false,
        message: `No departments found for company ID: ${companyId}`,
      });
    }

    // Get department IDs
    const departmentIds = departments.map(dept => dept.id);

    // Find all assessments for these departments
    const assessments = await Assessment.findAll({
      where: {
        departmentId: { [Op.in]: departmentIds }
      },
      attributes: ['id', 'submitted']
    });

    // Check if all assessments are submitted
    const unsubmittedAssessment = assessments.find(assessment => !assessment.submitted);
    if (unsubmittedAssessment) {
      return res.status(400).json({
        success: false,
        message: 'All assessments must be submitted before generating report'
      });
    }

    // Get assessment IDs
    const assessmentIds = assessments.map(assessment => assessment.id);

    // Fetch questions answered as "No" with related data
    const questionsAnsweredAsNo = await AssessmentQuestion.findAll({
      where: {
        assessmentId: { [Op.in]: assessmentIds },
      },
      include: [{
        model: MasterQuestion,
        required: true,
        as: 'masterQuestion',
        attributes: {
          exclude: ['id', 'srNo', 'sp80053ControlNumber', 'department']
        }
      }, {
        model: Answer,
        required: true,
        as: 'answer',
        where: {
          answerText: 'no'
        },
        attributes: []
      }],
    });

    return res.status(200).json({
      success: true,
      message: 'Report data successfully fetched',
      data: questionsAnsweredAsNo
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching report data'
    });
  }
};









