import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment, UserDepartmentLink, MasterQuestion, IndustrySector } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';

const validateEmailForCompany = async (email, companyId = null) => {
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
};

const handleCompanyEmailUpdates = async (company, primaryEmail, secondaryEmail, transaction) => {
  const originalPrimaryEmail = company.primaryEmail;
  const originalSecondaryEmail = company.secondaryEmail;
  const emailUpdates = [];

  // If primary wants secondary's current email, update secondary first
  if (primaryEmail === originalSecondaryEmail) {
    if (!secondaryEmail) {
      throw new AppError('New secondary email required when swapping with primary', 400);
    }

    const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail, company.id);
    if (!secondaryEmailValidation.isValid) {
      throw new AppError(`Secondary email ${secondaryEmailValidation.message}`, 400);
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
    if (!primaryEmail) {
      throw new AppError('New primary email required when swapping with secondary', 400);
    }

    const primaryEmailValidation = await validateEmailForCompany(primaryEmail, company.id);
    if (!primaryEmailValidation.isValid) {
      throw new AppError(`Primary email ${primaryEmailValidation.message}`, 400);
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
      throw new AppError(`Primary email ${primaryEmailValidation.message}`, 400);
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
      throw new AppError(`Secondary email ${secondaryEmailValidation.message}`, 400);
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

export const createCompany = async (req, res, next) => {
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
    industrySectorId,
  } = req.body;

  const transaction = await sequelize.transaction();
  try {
    // Validate primary email
    const primaryEmailValidation = await validateEmailForCompany(primaryEmail);
    if (!primaryEmailValidation.isValid) {
      throw new AppError(`Primary ${primaryEmailValidation.message}`, 409);
    }

    // Validate secondary email
    const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail);
    if (!secondaryEmailValidation.isValid) {
      throw new AppError(`Secondary ${secondaryEmailValidation.message}`, 409);
    }

    // Check for company logo
    const companyLogo = req.files?.['companyLogo'];
    if (!companyLogo || companyLogo.length === 0) {
      throw new AppError('Company Logo is required', 409);
    }

    // Create the company
    const newCompany = await Company.create(
      {
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
        companyLogo: companyLogo[0]?.buffer,
        createdByUserId: req.user.id,
      },
      { transaction }
    );

    // If an industry sector ID is provided, associate the company with the industry sector
    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }

      // Associate the company with the industry sector
      await newCompany.setIndustrySector(industrySector, { transaction });
    }

    // Commit the transaction
    await transaction.commit();

    // Refetch the company and include only desired attributes
    const refetchedCompany = await Company.findByPk(newCompany.id, {
      attributes: { exclude: ['companyLogo'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType'],
      }],
    });

    res.status(201).json({
      success: true,
      messages: ['Company created successfully!'],
      company: refetchedCompany,
    });
  } catch (error) {
    await transaction.rollback();
    next(error)
  }
};

export const getAllCompanies = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Fetch companies with pagination and count the total number of companies
    const { count, rows: companies } = await Company.findAndCountAll({
      attributes: { exclude: ['companyLogo'] },
      limit: limit,
      offset: (page - 1) * limit,
    });

    // Return empty list if no companies are found
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: 'No companies found',
        companies: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    // Return 404 if requested page exceeds total pages
    if (page > totalPages) {
      throw new AppError('Page not found', 404);
    }

    // Return companies with pagination data
    res.status(200).json({
      success: true,
      messages: 'Companies retrieved successfully',
      companies,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    next(error)
  }
};

export const getCompanyById = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    // Fetch the company
    const company = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo'] }
    });

    // If the company is not found, return a 404 error with a message
    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    // If the company is found, return it in the response with a success message
    res.status(200).json({
      success: true,
      messages: 'Company retrieved successfully',
      company,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
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
    industrySectorId,
  } = req.body;

  const transaction = await sequelize.transaction();
  try {
    const company = await Company.findByPk(companyId, { transaction });

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    // Handle all email updates
    let emailUpdates = [];
    if (primaryEmail || secondaryEmail) {
      emailUpdates = await handleCompanyEmailUpdates(company, primaryEmail, secondaryEmail, transaction);
    }

    if (
      (primaryPhone && primaryPhone === company.secondaryPhone && !secondaryPhone) ||
      (secondaryPhone && secondaryPhone === company.primaryPhone && !primaryPhone)
    ) {
      throw new AppError('Primary phone is same as secondary phone in database and vice versa.', 400);
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
    if (req.files?.['companyLogo']) company.companyLogo = req.files['companyLogo'][0].buffer;

    // If industry sector ID is provided, update the company's industry sector
    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
      await company.setIndustrySector(industrySector, { transaction });
    }

    await company.save({ transaction });
    await transaction.commit();

    // Fetch updated company without logo
    const updatedCompany = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType'],
      }],
    });

    res.status(200).json({
      success: true,
      messages: [
        'Company updated successfully',
        ...emailUpdates
      ],
      company: updatedCompany,
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
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

    if (!departments.length) {
      throw new AppError('No departments found for this company.', 404);
    }

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
      throw new AppError('Company not found or already deleted', 404);
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

    // Pass error to error handling middleware
    console.error('Error deleting company and related records:', error);
    next(error); // Use next(error) as requested
  }
};

export const getDepartmentsByCompanyId = async (req, res, next) => {
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

    // If no departments are found, throw an error
    if (count === 0) {
      throw new AppError('No departments found', 404);
    }

    const totalPages = Math.ceil(count / limit);

    // If the page exceeds total pages, throw an error
    if (page > totalPages) {
      throw new AppError('Page not found', 404);
    }

    // Return departments with pagination details
    res.status(200).json({
      success: true,
      departments,
      pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit },
    });
  } catch (error) {
    console.error('Error fetching departments for company:', error);
    next(error);
  }
};

export const getUsersByCompanyId = async (req, res, next) => {
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
      // Unknown role - throw an error
      throw new AppError('Unauthorized access', 403);
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
      throw new AppError('Page not found', 404);
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
    next(error);
  }
};


export const getReportByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const departments = await Department.findAll({
      where: { companyId },
      attributes: ['id'],
      include: [{
        model: Assessment,
        as: 'assessments',
        attributes: ['id', 'submitted']
      }]
    });

    if (!departments.length) {
      throw new AppError(`No departments found for company ID: ${companyId}`, 404);
    }

    // Check assessment submissions before fetching question data
    const hasUnsubmittedAssessment = departments.some(dept =>
      dept.assessments.some(assessment => !assessment.submitted)
    );

    if (hasUnsubmittedAssessment) {
      throw new AppError('All assessments must be submitted before generating report', 400);
    }

    // Only if all assessments are submitted, fetch the full data
    const fullReport = await Department.findAll({
      where: { companyId },
      attributes: ['id', 'departmentName'],
      include: [
        {
          model: Assessment,
          as: 'assessments',
          attributes: ['id', 'assessmentName'],
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            attributes: ['id'],
            include: [
              {
                model: MasterQuestion,
                as: 'masterQuestion',
                attributes: {
                  exclude: ['questionText', 'vulnerabilityValue', 'riskLikelihoodScore',
                    'riskLikelihoodValue', 'riskLikelihoodRating', 'financialImpactRating',
                    'reputationalImpactRating', 'legalImpactRating', 'complianceImpactRating',
                    'objectivesAndProductionOperationsImpactRating', 'riskImpactValue', 'riskImpactRating', 'inherentRisk', 'currentRiskValue', 'revisedRiskLikelihoodRating', 'revisedRiskImpactRating', 'createdAt', 'updatedAt', 'department', 'id']
                }
              },
              {
                model: Answer,
                required: true,
                as: 'answer',
                where: {
                  answerText: 'no'
                },
                attributes: []
              }
            ]
          }]
        }
      ]
    });

    res.status(200).json({
      success: true,
      messages: ['Report data successfully fetched'],
      reportData: fullReport
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    next(error);
  }
};


export const getCompanyLogo = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Fetch the company record with the logo
    const company = await Company.findByPk(companyId, {
      attributes: ['companyLogo'],
    });

    // Check if the company exists and has a logo
    if (!company || !company.companyLogo) {
      throw new AppError('Logo not found for the company', 404);
    }

    res.set('Content-Type', 'image/png');
    return res.status(200).send(company.companyLogo);
  } catch (err) {
    console.error(err);
    // Handle error and pass it to the next middleware
    next(err); // Pass error to next middleware (error handler)
  }
};










