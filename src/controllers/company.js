import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment, UserDepartmentLink, MasterQuestion, IndustrySector, ControlFramework, CompanyControlFrameworkLink, SubDepartment, SubAssessment } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics, calculateAssessmentStatisticsForCompany, getAssessmentStatus } from '../utils/calculateStatistics.js';

import { handleCompanyEmailUpdates, validateControlFrameworkIds, validateEmailForCompany } from '../utils/companyUtils.js'
import { ASSESSMENT_TYPE, frameworkFieldMapping, ROLE_IDS } from '../utils/constants.js';
// import { getCategorizedAssessments } from '../utils/assessmentUtils.js';
import { getCategorizedAssessments, getCategorizedSubAssessments, getMetricsOfAssessments } from '../utils/progressStatistics.js';
import { getFilteredAssessments } from '../utils/assessmentUtils.js';
import { required } from 'joi';
import { calculateMetrics } from '../utils/calculateRiskMetrics.js';

export const createCompany = async (req, res, next) => {
  const {
    companyLegalName,
    primaryEmail,
    secondaryEmail,
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

    // Create the company
    const newCompany = await Company.create(
      {
        companyLegalName,
        primaryEmail,
        secondaryEmail,
        createdByUserId: req.user.id,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Refetch the company and include only desired attributes 
    const refetchedCompany = await Company.findByPk(newCompany.id, {
      attributes: ['id', 'companyLegalName', 'primaryEmail', 'secondaryEmail'],
    });

    res.status(201).json({
      success: true,
      messages: ['Company created successfully!'],
      company: refetchedCompany,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const createCompanyDetails = async (req, res, next) => {
  const { companyId } = req.params;
  const {
    tradeName,
    companyLegalName,
    website,
    incorporationDate,
    companySize,
    streetAddress,
    city,
    state,
    country,
    postalCode,
    taxIdType,
    taxIdNumber,
    companyRegistrationNumber,
    panReferenceNumber,
    primaryPhone,
    secondaryPhone,
    primaryCountryCode,
    secondaryCountryCode,
    auditCompletionDeadline,
    annualRevenueRange,
    industrySectorId,
  } = req.body;
  console.log(companyId);


  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(companyId, { transaction });
    if (!company) {
      throw new AppError('Company not found.', 404);
    }
    console.log(company.id)

    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
    }

    if (company.detailsStatus === 'complete') {
      throw new AppError('Details already completed. ', 409)
    }

    await company.update({
      tradeName,
      companyLegalName,
      website,
      incorporationDate,
      companySize,
      streetAddress,
      city,
      state,
      country,
      postalCode,
      taxIdType,
      taxIdNumber,
      companyRegistrationNumber,
      panReferenceNumber,
      primaryPhone,
      secondaryPhone,
      primaryCountryCode,
      secondaryCountryCode,
      auditCompletionDeadline,
      annualRevenueRange,
      industrySectorId,
      companyLogo: req.files?.['companyLogo']?.[0]?.buffer,
      detailsStatus: 'complete'
    }, { transaction });

    await transaction.commit();

    const updatedCompany = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo', 'createdByUserId', 'deletedAt', 'password'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType']
      }]
    });

    res.status(201).json({
      success: true,
      messages: ['Company details created successfully'],
      company: updatedCompany
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const updateCompanyDetails = async (req, res, next) => {
  const { companyId } = req.params;
  const {
    tradeName,
    companyLegalName,
    website,
    incorporationDate,
    companySize,
    streetAddress,
    city,
    state,
    country,
    postalCode,
    taxIdType,
    taxIdNumber,
    companyRegistrationNumber,
    panReferenceNumber,
    primaryPhone,
    secondaryPhone,
    primaryCountryCode,
    secondaryCountryCode,
    auditCompletionDeadline,
    annualRevenueRange,
    industrySectorId,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(companyId, { transaction });

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    if (company.detailsStatus === 'incomplete') {
      throw new AppError('Complete company details creation first', 400);
    }

    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
    }

    // Check if any data is provided for update
    if (Object.keys(req.body).length === 0 && !req.files) {
      throw new AppError('No data provided for update.', 400);
    }

    const updateData = {
      ...(tradeName && { tradeName }),
      ...(companyLegalName && { companyLegalName }),
      ...(website && { website }),
      ...(incorporationDate && { incorporationDate }),
      ...(companySize && { companySize }),
      ...(streetAddress && { streetAddress }),
      ...(city && { city }),
      ...(state && { state }),
      ...(country && { country }),
      ...(postalCode && { postalCode }),
      ...(taxIdType && { taxIdType }),
      ...(taxIdNumber && { taxIdNumber }),
      ...(companyRegistrationNumber && { companyRegistrationNumber }),
      ...(panReferenceNumber && { panReferenceNumber }),
      ...(primaryPhone && { primaryPhone }),
      ...(secondaryPhone && { secondaryPhone }),
      ...(primaryCountryCode && { primaryCountryCode }),
      ...(secondaryCountryCode && { secondaryCountryCode }),
      ...(auditCompletionDeadline && { auditCompletionDeadline }),
      ...(annualRevenueRange && { annualRevenueRange }),
      ...(industrySectorId && { industrySectorId }),
    };

    // Handle company logo update if provided
    if (req.files?.['companyLogo']?.[0]?.buffer) {
      updateData.companyLogo = req.files['companyLogo'][0].buffer;
    }

    await company.update(updateData, { transaction });

    await transaction.commit();

    const updatedCompany = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo', 'createdByUserId', 'deletedAt', 'password'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType']
      }]
    });

    res.status(200).json({
      success: true,
      messages: ['Company details updated successfully'],
      company: updatedCompany
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const addCompanyControlFrameworks = async (req, res, next) => {
  const { companyId } = req.params;
  const { controlFrameworkIds } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(companyId, { transaction });

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    // Check if company details are completed first
    if (company.detailsStatus !== 'complete') {
      throw new AppError('Please complete company details first.', 400);
    }

    // Validate control framework IDs
    await validateControlFrameworkIds(controlFrameworkIds);

    // Check if controlFrameworkIds array is not empty
    if (!controlFrameworkIds || controlFrameworkIds.length === 0) {
      throw new AppError('At least one control framework must be selected.', 400);
    }

    // Set control frameworks and update status
    await company.setControlFrameworks(controlFrameworkIds, { transaction });
    await company.update({ controlFrameworksStatus: 'complete' }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      messages: [
        'Control frameworks added successfully',
      ]
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const updateCompanyControlFrameworks = async (req, res, next) => {
  const { companyId } = req.params;
  const { controlFrameworkIds } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(companyId, {
      include: [{
        model: ControlFramework,
        as: 'controlFrameworks',
        attributes: ['id'],
        through: { attributes: [] }
      }],
      transaction
    });

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    // Check if control frameworks section is completed first
    if (company.controlFrameworksStatus !== 'complete') {
      throw new AppError('Complete control frameworks creation first.', 400);
    }

    // Get existing framework IDs
    const existingFrameworkIds = company.controlFrameworks.map(fw => fw.id);

    // Find frameworks to add and remove
    const frameworksToAdd = controlFrameworkIds.filter(
      id => !existingFrameworkIds.includes(id)
    );
    const frameworksToRemove = existingFrameworkIds.filter(
      id => !controlFrameworkIds.includes(id)
    );

    // Validate new frameworks exist in database
    if (frameworksToAdd.length > 0) {
      const validFrameworks = await ControlFramework.findAll({
        where: {
          id: frameworksToAdd
        },
        transaction
      });

      if (validFrameworks.length !== frameworksToAdd.length) {
        const foundIds = validFrameworks.map(f => f.id);
        const invalidIds = frameworksToAdd.filter(id => !foundIds.includes(id));
        throw new AppError(`Invalid framework IDs: ${invalidIds.join(', ')}`, 400);
      }
    }

    // Perform the additions
    if (frameworksToAdd.length > 0) {
      await company.addControlFrameworks(frameworksToAdd, { transaction });
    }

    // Perform the removals
    if (frameworksToRemove.length > 0) {
      await company.removeControlFrameworks(frameworksToRemove, { transaction });
    }

    // Get updated company with frameworks for response
    const updatedCompany = await Company.findByPk(companyId, {
      include: [{
        model: ControlFramework,
        as: 'controlFrameworks',
        attributes: ['id', 'frameworkType', 'category'],
        through: { attributes: [] }
      }],
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      messages: ['Control frameworks updated successfully'],
      company: updatedCompany
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getCompanySetupStatus = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findByPk(companyId, {
      attributes: ['detailsStatus', 'controlFrameworksStatus', 'departmentsStatus']
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Determine current stage based on status
    let currentStage = 'details';
    if (company.detailsStatus === 'complete') {
      if (company.controlFrameworksStatus === 'complete') {
        if (company.departmentsStatus === 'complete') {
          currentStage = 'complete';
        } else {
          currentStage = 'departments';
        }
      } else {
        currentStage = 'framework';
      }
    }

    res.json({
      success: true,
      data: {
        detailsStatus: company.detailsStatus,
        controlFrameworksStatus: company.controlFrameworksStatus,
        departmentsStatus: company.departmentsStatus,
        currentStage
      }
    });

  } catch (error) {
    console.error('Error in getCompanySetupStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company setup status',
      error: error.message
    });
  }
};

export const updateCompany = async (req, res, next) => {
  console.log(req.body);
  const { companyId } = req.params;
  const {
    companyLegalName,
    tradeName,
    website,
    incorporationDate,
    companySize,
    streetAddress,
    city,
    state,
    country,
    postalCode,
    taxIdType,
    taxIdNumber,
    companyRegistrationNumber,
    panReferenceNumber,
    primaryEmail,
    secondaryEmail,
    primaryPhone,
    secondaryPhone,
    primaryCountryCode,
    secondaryCountryCode,
    auditCompletionDeadline,
    annualRevenueRange,
    industrySectorId,
    controlFrameworkIds
  } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const company = await Company.findByPk(companyId, { transaction });

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    // Handle all email updates
    let emailUpdates = [];
    if (primaryEmail || secondaryEmail) {
      emailUpdates = await handleCompanyEmailUpdates(company, primaryEmail, secondaryEmail, transaction);
    }

    // Check phone number duplication
    if (
      (primaryPhone && primaryPhone === company.secondaryPhone && !secondaryPhone) ||
      (secondaryPhone && secondaryPhone === company.primaryPhone && !primaryPhone)
    ) {
      throw new AppError('Primary phone is same as secondary phone in database and vice versa.', 400);
    }

    // Validate industry sector
    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
      company.industrySectorId = industrySectorId;
    }

    // Update all fields
    const updateFields = {
      companyLegalName,
      tradeName,
      website,
      incorporationDate,
      companySize,
      streetAddress,
      city,
      state,
      country,
      postalCode,
      taxIdType,
      taxIdNumber,
      companyRegistrationNumber,
      panReferenceNumber,
      primaryPhone,
      secondaryPhone,
      primaryCountryCode,
      secondaryCountryCode,
      auditCompletionDeadline,
      annualRevenueRange
    };

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );

    Object.assign(company, filteredUpdates);

    // Handle company logo if present
    if (req.files?.['companyLogo']) {
      company.companyLogo = req.files['companyLogo'][0].buffer;
    }

    await company.save({ transaction });

    // Handle control frameworks
    if (controlFrameworkIds) {
      await validateControlFrameworkIds(controlFrameworkIds);
      await company.setControlFrameworks(controlFrameworkIds, { transaction });
    }

    await transaction.commit();

    // Fetch updated company
    const updatedCompany = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo'] },
      include: [
        {
          model: IndustrySector,
          as: 'industrySector',
          attributes: ['id', 'sectorName', 'sectorType'],
        },
        {
          model: ControlFramework,
          as: 'controlFrameworks',
          through: { attributes: [] },
          attributes: ['id', 'frameworkType']
        }
      ],
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
    if (transaction) await transaction.rollback();
    next(error);
  }
};

export const getAllCompanies = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    // Validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }

    // Fetch companies with pagination and count
    const { count, rows: companies } = await Company.findAndCountAll({
      attributes: { exclude: ['companyLogo'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType'],
      },
      {
        model: ControlFramework,
        as: 'controlFrameworks',
        through: {
          attributes: []
        },
        attributes: ['id', 'frameworkType']
      }],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);

    // Check if page exists
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

    // Return response with pagination
    res.status(200).json({
      success: true,
      messages: count === 0 ? ['No companies found'] : ['Companies retrieved successfully'],
      companies,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      },
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    next(error);
  }
};

export const getCompanyById = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    // Fetch the company
    const company = await Company.findByPk(companyId, {
      attributes: { exclude: ['companyLogo'] },
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType'],
      }, {
        model: ControlFramework,
        as: 'controlFrameworks',
        through: {
          attributes: []
        },
        attributes: ['id', 'frameworkType']
      }],
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

export const getDepartmentsWithSubDepartmentsByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const departments = await Department.findAll({
      where: {
        companyId
      },
      attributes: ['id', 'departmentName'],
      include: [
        {
          model: SubDepartment,
          as: 'subDepartments',
          attributes: ['id', 'subDepartmentName']

        },
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: SubDepartment, as: 'subDepartments' }, 'createdAt', 'DESC']
      ]
    });

    return res.status(200).json({
      success: true,
      messages: departments.length === 0 ? ['No departments found'] : ['Departments retrieved successfully'],
      departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    next(error);
  }
};

export const getDepartmentsByCompanyId = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { user } = req;  // Current user from request

    // First verify company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    let departments = [];

    // For admin and leadership, fetch all departments
    if (user.roleId === ROLE_IDS.ADMIN || user.roleId === ROLE_IDS.LEADERSHIP) {
      departments = await Department.findAll({
        where: { companyId },
        include: [
          {
            model: Assessment,
            as: 'assessments',
            attributes: ['id', 'deadline'],
            where: { assessmentType: ASSESSMENT_TYPE.DEFAULT },
            required: false
          },
          {
            model: SubDepartment,
            as: 'subDepartments',
            attributes: ['id', 'subDepartmentName']
          }
        ],
        attributes: ['id', 'departmentName', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
    }
    // For department manager, fetch only assigned departments
    else if (user.roleId === ROLE_IDS.DEPARTMENT_MANAGER) {
      departments = await Department.findAll({
        where: { companyId },
        include: [
          {
            model: Assessment,
            as: 'assessments',
            attributes: ['id', 'deadline'],
            where: { assessmentType: ASSESSMENT_TYPE.DEFAULT },
            required: false
          },
          {
            model: SubDepartment,
            as: 'subDepartments',
            attributes: ['id', 'subDepartmentName']
          },
          {
            model: User,
            as: 'users',
            where: { id: user.id },
            attributes: [],
            required: true
          }
        ],
        attributes: ['id', 'departmentName', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
    }

    res.status(200).json({
      success: true,
      messages: departments.length === 0 ?
        ['No departments found'] :
        ['Departments retrieved successfully'],
      departments
    });

  } catch (error) {
    next(error);
  }
};

export const getUsersByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10, roleId } = req.query;

  try {
    // 1. First validate the company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // 2. Validate and parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }

    // 3. Prepare where clause with optional roleId filter
    const whereClause = {
      companyId,
      ...(roleId && { roleId }) // Using roleId directly as string
    };

    // 4. Get the total count of users with filter
    const count = await User.count({
      where: whereClause
    });

    // 5. Get the users WITH their associations
    const users = await User.findAll({
      where: whereClause,
      attributes: {
        exclude: ['password', 'deletedAt']
      },
      include: [
        {
          model: Department,
          as: 'departments',
          through: { attributes: [] },
          required: false,
          attributes: ['id', 'departmentName'],
        },
        {
          model: SubDepartment,
          as: 'subDepartments',
          through: { attributes: [] },
          required: false,
          attributes: ['id', 'subDepartmentName'],
        }
      ],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      order: [['id', 'ASC']],
    });

    // 6. Calculate pagination details
    const totalPages = Math.ceil(count / limitNum);
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

    // 7. Send the response
    res.status(200).json({
      success: true,
      messages: count === 0 ? ['No users found'] : ['Users retrieved successfully'],
      users,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getReportByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;
  const { controlFrameworkIds = '' } = req.query;

  try {
    // Validate controlFrameworkIds is provided
    if (!controlFrameworkIds) {
      throw new AppError('Control framework IDs are required', 400);
    }

    // Get company basic info
    const company = await Company.findByPk(companyId, {
      attributes: ['id', 'companyLegalName']
    });

    if (!company) {
      throw new AppError(`Company not found with ID: ${companyId}`, 404);
    }

    // Parse and validate control framework IDs
    const frameworkIds = controlFrameworkIds.split(',').filter(Boolean);

    if (frameworkIds.length === 0) {
      throw new AppError('At least one valid control framework ID is required', 400);
    }

    // Get authorized frameworks for the company
    const companyFrameworks = await CompanyControlFrameworkLink.findAll({
      where: {
        companyId,
        controlFrameworkId: {
          [Op.in]: frameworkIds
        }
      },
      attributes: ['controlFrameworkId'],
      raw: true
    });

    // Get the IDs that are actually associated with the company
    const authorizedFrameworkIds = companyFrameworks.map(cf => cf.controlFrameworkId);

    // Validate if any frameworks are unauthorized
    const unauthorizedIds = frameworkIds.filter(id => !authorizedFrameworkIds.includes(id));
    if (unauthorizedIds.length > 0) {
      throw new AppError(`Invalid or unauthorized control framework IDs: ${unauthorizedIds.join(', ')}`, 400);
    }


    // Get the full framework details
    const controlFrameworks = await ControlFramework.findAll({
      where: {
        id: {
          [Op.in]: authorizedFrameworkIds
        }
      },
      attributes: ['id', 'frameworkType']
    });

    // Get framework types
    const frameworks = controlFrameworks.map(cf => cf.frameworkType);

    // Validate if framework types are supported
    const invalidFrameworks = frameworks.filter(framework => !frameworkFieldMapping[framework]);
    if (invalidFrameworks.length > 0) {
      throw new AppError(`Unsupported framework types: ${invalidFrameworks.join(', ')}`, 400);
    }

    // Get departments and check submissions
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

    // // Validate all assessments are submitted
    // const hasUnsubmittedAssessment = departments.some(dept =>
    //   dept.assessments.some(assessment => !assessment.submitted)
    // );

    // if (hasUnsubmittedAssessment) {
    //   throw new AppError('All assessments must be submitted before generating report', 400);
    // }

    // Build framework conditions for filtering
    const frameworkConditions = frameworks.map(framework => ({
      [frameworkFieldMapping[framework]]: {
        [Op.not]: null
      }
    }));

    // Get detailed department data with assessments
    const departmentReport = await Department.findAll({
      where: { companyId },
      attributes: ['id', 'departmentName'],
      include: [
        {
          model: MasterDepartment,
          as: 'masterDepartment',
          attributes: ['id', 'departmentName'],
        },
        {
          model: Assessment,
          as: 'assessments',
          attributes: [
            'id',
            'assessmentName',
            'assessmentStarted',
            'submitted',
            'startedAt',
            'submittedAt',
            'deadline'
          ],
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            attributes: ['id'],
            include: [
              {
                model: MasterQuestion.scope('riskReport'),
                as: 'masterQuestion',
                where: {
                  [Op.or]: frameworkConditions
                }
              },
              {
                model: Answer,
                required: true,
                as: 'answer',
                where: {
                  answerText: 'no'
                },
                attributes: ['answerText']
              }
            ]
          }]
        }
      ],
      order: [
        ['departmentName', 'ASC'],
        [{ model: Assessment, as: 'assessments' }, 'assessmentName', 'ASC'],
        [{ model: Assessment, as: 'assessments' }, { model: AssessmentQuestion, as: 'questions' }, 'id', 'ASC']
      ]
    });

    // Get company level statistics
    const companyStats = await calculateAssessmentStatisticsForCompany(companyId);

    // Enhance department report with assessment statistics
    const enhancedDepartmentReport = await Promise.all(
      departmentReport.map(async (department) => {
        const departmentData = department.toJSON();

        // Add statistics to each assessment
        departmentData.assessments = await Promise.all(
          departmentData.assessments.map(async (assessment) => {
            const assessmentStats = await calculateAssessmentStatistics(assessment.id);
            return {
              ...assessment,
              statistics: assessmentStats
            };
          })
        );

        return departmentData;
      })
    );

    // Prepare final response
    const finalReport = {
      id: company.id,
      companyName: company.companyLegalName,
      statistics: companyStats,
      departments: enhancedDepartmentReport,
      metadata: {
        controlFrameworks: controlFrameworks.map(cf => ({
          id: cf.id,
          frameworkType: cf.frameworkType
        })),
        generatedAt: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      messages: ['Report data successfully fetched'],
      reportData: finalReport
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
    // console.log(company.companyLogo)
    console.log(res.headers);

    res.set('Content-Type', 'image/png');
    return res.status(200).send(company.companyLogo);
  } catch (err) {
    console.error(err);
    // Handle error and pass it to the next middleware
    next(err); // Pass error to next middleware (error handler)
  }
};

export const getDepartmentStatusReportAccordingToTime = async (req, res, next) => {
  const { companyId } = req.params;
  const currentDate = new Date();

  try {
    const company = await Company.findOne({
      where: { id: companyId },
      include: [{
        model: Department,
        as: 'departments',
        attributes: ['id', 'departmentName'],
        include: [{
          model: Assessment,
          as: 'assessments',
          attributes: [
            'id',
            'assessmentName',
            'assessmentStarted',
            'submitted',
            'startedAt',
            'submittedAt',
            'deadline'
          ],
          where: {
            assessmentName: 'default'
          },
          required: false,
          paranoid: true
        }]
      }]
    });

    const getDepartmentStatus = (assessments) => {
      if (!assessments || assessments.length === 0) return 'green';

      const missedDeadlines = assessments.filter(assessment => {
        return assessment.deadline &&
          new Date(assessment.deadline) < currentDate &&
          (!assessment.submitted || !assessment.assessmentStarted);
      });

      const upcomingDeadlines = assessments.filter(assessment => {
        if (!assessment.deadline || assessment.submitted) return false;

        const deadline = new Date(assessment.deadline);
        const threeDaysFromNow = new Date(currentDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        return deadline <= threeDaysFromNow &&
          deadline > currentDate &&
          (!assessment.submitted || !assessment.assessmentStarted);
      });

      if (missedDeadlines.length > 0) return 'red';
      if (upcomingDeadlines.length > 0) return 'yellow';
      return 'green';
    };

    // Categorize departments
    const categorizedDepartments = {
      red: [],
      yellow: [],
      green: []
    };

    company.departments.forEach(department => {
      const status = getDepartmentStatus(department.assessments);
      categorizedDepartments[status].push({
        id: department.id,
        name: department.departmentName,
      });
    });

    res.status(200).json({
      success: true,
      messages: ['Progress report generated successfully'],
      categorizedDepartments: {
        red: {
          count: categorizedDepartments.red.length,
          description: 'Past Deadline (Assessment not submitted after deadline)',
          departments: categorizedDepartments.red
        },
        yellow: {
          count: categorizedDepartments.yellow.length,
          description: 'Approaching Deadline (3 days or less remaining)',
          departments: categorizedDepartments.yellow
        },
        green: {
          count: categorizedDepartments.green.length,
          description: 'On Track (No immediate deadline concerns)',
          departments: categorizedDepartments.green
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentStatusReportAccordingToCompliance = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findOne({
      where: { id: companyId },
      include: [{
        model: Department,
        as: 'departments',
        attributes: ['id', 'departmentName'],
        include: [{
          model: Assessment,
          as: 'assessments',
          where: {
            assessmentName: 'default'
          },
          required: false,
          paranoid: true,
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            include: [{
              model: Answer,
              as: 'answer',
              attributes: ['answerText']
            }, {
              model: MasterQuestion,
              as: 'masterQuestion',
              attributes: ['questionText']
            }]
          }]
        }]
      }]
    });

    const calculateComplianceStatus = (assessment) => {
      if (!assessment.questions || assessment.questions.length === 0) return 'green';

      // Filter questions that have been answered
      const answeredQuestions = assessment.questions.filter(question =>
        question.answer && question.answer.answerText
      );

      // If no questions have been answered yet, return green
      if (answeredQuestions.length === 0) return 'green';

      const noAnswers = answeredQuestions.filter(question =>
        question.answer.answerText.toLowerCase() === 'no'
      ).length;

      const noAnswerPercentage = (noAnswers / answeredQuestions.length) * 100;
      const compliancePercentage = 100 - noAnswerPercentage;

      if (compliancePercentage >= 90) return 'green';  // High compliance (0-10% no answers)
      if (compliancePercentage >= 70) return 'yellow'; // Medium compliance (10-30% no answers)
      return 'red';                                    // Low compliance (>30% no answers)
    };

    // Categorize departments
    const categorizedDepartments = {
      red: [],
      yellow: [],
      green: []
    };

    company.departments.forEach(department => {
      let departmentStatus = 'green';

      if (department.assessments && department.assessments.length > 0) {
        const assessmentStatuses = department.assessments.map(assessment =>
          calculateComplianceStatus(assessment)
        );

        if (assessmentStatuses.includes('red')) {
          departmentStatus = 'red';
        } else if (assessmentStatuses.includes('yellow')) {
          departmentStatus = 'yellow';
        }
      }

      categorizedDepartments[departmentStatus].push({
        id: department.id,
        name: department.departmentName,
        complianceDetails: department.assessments.map(assessment => {
          const answeredQuestions = assessment.questions.filter(q =>
            q.answer && q.answer.answerText
          );

          const totalAnswered = answeredQuestions.length;
          const noAnswers = answeredQuestions.filter(q =>
            q.answer.answerText.toLowerCase() === 'no'
          ).length;

          return {
            assessmentId: assessment.id,
            totalQuestions: assessment.questions.length,
            questionsAnswered: totalAnswered,
            noAnswers: noAnswers,
            compliancePercentage: totalAnswered ?
              ((totalAnswered - noAnswers) / totalAnswered * 100).toFixed(2) :
              "100.00"
          };
        })
      });
    });

    res.status(200).json({
      success: true,
      messages: ['compliance report generated successfully'],
      categorizedDepartments: {
        red: {
          count: categorizedDepartments.red.length,
          description: 'Low Compliance (Below 70% compliant)',
          departments: categorizedDepartments.red
        },
        yellow: {
          count: categorizedDepartments.yellow.length,
          description: 'Medium Compliance (70-90% compliant)',
          departments: categorizedDepartments.yellow
        },
        green: {
          count: categorizedDepartments.green.length,
          description: 'High Compliance (Above 90% compliant)',
          departments: categorizedDepartments.green
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentsDashboard = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const departments = await Department.findAll({
      where: { companyId },
      attributes: ['id', 'departmentName'],
      include: [{
        model: Assessment,
        as: 'assessments',
        attributes: [
          'id',
          'assessmentName',
          'assessmentStarted',
          'submitted',
          'startedAt',
          'submittedAt',
          'deadline'
        ]
      }]
    });

    // Get statistics for each assessment
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const departmentData = dept.toJSON();

        const assessmentsWithStats = await Promise.all(
          departmentData.assessments.map(async (assessment) => {
            const statistics = await calculateAssessmentStatistics(assessment.id);
            const status = getAssessmentStatus(assessment, statistics);

            return {
              ...assessment,
              statistics,
              status
            };
          })
        );

        return {
          ...departmentData,
          assessments: assessmentsWithStats
        };
      })
    );

    return res.status(200).json({
      departments: departmentsWithStats
    });

  } catch (error) {
    return next(error);
  }
};

export const getAssessmentsCategoryWise = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    // Directly fetch all assessments with their department info
    const assessments = await Assessment.findAll({
      include: [{
        model: Department,
        as: 'department',
        where: { companyId },
        attributes: ['id', 'departmentName']
      }],
      attributes: [
        'id',
        'assessmentName',
        'assessmentStarted',
        'submitted',
        'startedAt',
        'submittedAt',
        'deadline'
      ]
    });

    // Process all assessments with statistics and status
    const processedAssessments = await Promise.all(
      assessments.map(async (assessment) => {
        const assessmentData = assessment.toJSON();
        const statistics = await calculateAssessmentStatistics(assessment.id);
        const status = getAssessmentStatus(assessmentData, statistics);

        return {
          ...assessmentData,
          statistics,
          status
        };
      })
    );

    // Categorize assessments
    const categorizedAssessments = {
      submitted: {
        description: "Assessments that have been completed and formally submitted",
        assessments: processedAssessments.filter(a => a.status === 'submitted')
      },
      completed: {
        description: "Assessments with all questions answered but pending submission",
        assessments: processedAssessments.filter(a => a.status === 'completed')
      },
      active: {
        description: "Assessments currently in progress with partial completion",
        assessments: processedAssessments.filter(a => a.status === 'active')
      },
      notStarted: {
        description: "Assessments that have not been initiated yet",
        assessments: processedAssessments.filter(a => a.status === 'notStarted')
      },
      deadlined: {
        description: "Assessments that have passed their deadline without submission",
        assessments: processedAssessments.filter(a => a.status === 'deadlined')
      }
    };

    // Calculate counts
    const assessmentCounts = {
      submitted: categorizedAssessments.submitted.assessments.length,
      completed: categorizedAssessments.completed.assessments.length,
      active: categorizedAssessments.active.assessments.length,
      notStarted: categorizedAssessments.notStarted.assessments.length,
      deadlined: categorizedAssessments.deadlined.assessments.length,
      total: processedAssessments.length
    };

    // Calculate progress statistics
    const progressStats = {
      completionRate: assessmentCounts.total > 0
        ? ((assessmentCounts.submitted / assessmentCounts.total) * 100).toFixed(2)
        : 0,
      activeRate: assessmentCounts.total > 0
        ? ((assessmentCounts.active / assessmentCounts.total) * 100).toFixed(2)
        : 0,
      overdueRate: assessmentCounts.total > 0
        ? ((assessmentCounts.deadlined / assessmentCounts.total) * 100).toFixed(2)
        : 0
    };

    return res.status(200).json({
      success: true,
      categorizedAssessments: {
        counts: assessmentCounts,
        progress: progressStats,
        categories: {
          submitted: {
            description: categorizedAssessments.submitted.description,
            assessments: categorizedAssessments.submitted.assessments
          },
          completed: {
            description: categorizedAssessments.completed.description,
            assessments: categorizedAssessments.completed.assessments
          },
          active: {
            description: categorizedAssessments.active.description,
            assessments: categorizedAssessments.active.assessments
          },
          notStarted: {
            description: categorizedAssessments.notStarted.description,
            assessments: categorizedAssessments.notStarted.assessments
          },
          deadlined: {
            description: categorizedAssessments.deadlined.description,
            assessments: categorizedAssessments.deadlined.assessments
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getRiskMetricsForCompany = async (req, res, next) => {
  const { companyId } = req.params;
  console.log('hey');

  try {
    const company = await Company.findByPk(companyId, {
      include: [{
        model: Department,
        as: 'departments',
        include: [{
          model: Assessment,
          as: 'assessments',
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            include: [{
              model: Answer,
              as: 'answer'
            }, {
              model: MasterQuestion,
              as: 'masterQuestion'
            }]
          }]
        }, {
          model: SubDepartment,
          as: 'subDepartments',
          include: [{
            model: SubAssessment,
            as: 'subAssessments',
            include: [{
              model: AssessmentQuestion,
              as: 'questions',
              include: [{
                model: Answer,
                as: 'answer'
              }, {
                model: MasterQuestion,
                as: 'masterQuestion'
              }]
            }]
          }]
        }]
      }]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found']
      });
    }

    if (!company.departments || company.departments.length === 0) {
      return res.status(404).json({
        success: false,
        messages: ['No departments found for company']
      });
    }

    // Map through each department to calculate metrics
    const departmentsData = company.departments.map(department => {
      const assessment = department.assessments?.[0];
      if (!assessment) return null;

      // Calculate department level metrics
      const departmentMetrics = calculateMetrics(assessment.questions);

      // Calculate metrics for all subdepartments
      const subdepartmentsData = department.subDepartments.map(subdepartment => {
        const subAssessment = subdepartment.subAssessments[0];
        if (!subAssessment) return null;

        const subMetrics = calculateMetrics(subAssessment.questions);
        return {
          id: subdepartment.id,
          subDepartmentName: subdepartment.subDepartmentName,
          riskMetrics: {
            departmentRiskIndex: subMetrics.departmentRiskIndex,
            controlCoverageRatio: subMetrics.controlCoverageRatio,
            gapDensityRate: subMetrics.gapDensityRate,
            departmentComplianceScore: subMetrics.departmentComplianceScore,
            documentationCoverageRatio: subMetrics.documentationCoverageRatio
          }
        };
      }).filter(Boolean);

      return {
        id: department.id,
        departmentName: department.departmentName,
        riskMetrics: {
          departmentRiskIndex: departmentMetrics.departmentRiskIndex,
          controlCoverageRatio: departmentMetrics.controlCoverageRatio,
          gapDensityRate: departmentMetrics.gapDensityRate,
          departmentComplianceScore: departmentMetrics.departmentComplianceScore,
          documentationCoverageRatio: departmentMetrics.documentationCoverageRatio
        },
        subDepartmentsRiskMetrics: subdepartmentsData
      };
    }).filter(Boolean);

    const data = {
      company: {
        id: companyId,
        companyName: company.companyName,
        departmentsRiskMetrics: departmentsData
      }
    };
    console.log(data);

    return res.status(200).json({
      success: true,
      companyRiskMetrics: data.company
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyOverview = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findByPk(companyId, {
      attributes: ['id', 'companyName', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'departmentName', 'createdAt', 'updatedAt'],
          include: [
            {
              model: Assessment,
              as: 'assessments',
              attributes: [
                'id',
                'assessmentName',
                'assessmentStarted',
                'submitted',
                'startedAt',
                'submittedAt',
                'deadline'
              ]
            }
          ]
        }
      ]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found']
      });
    }

    // Calculate statistics and status for departments and their assessments
    const departmentsWithStats = await Promise.all(
      company.departments.map(async (dept) => {
        const assessmentsWithStats = await Promise.all(
          dept.assessments.map(async (assessment) => {
            try {
              const stats = await calculateAssessmentStatistics(assessment.id);
              return {
                ...assessment.toJSON(),
                statistics: stats,
                status: getAssessmentStatus(assessment, stats)
              };
            } catch (error) {
              console.error(`Error calculating statistics for assessment ${assessment.id}:`, error);
              return {
                ...assessment.toJSON(),
                statistics: null,
                status: null
              };
            }
          })
        );

        return {
          id: dept.id,
          departmentName: dept.departmentName,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
          assessments: assessmentsWithStats
        };
      })
    );

    const data = {
      company: {
        id: company.id,
        companyName: company.companyName,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        departments: departmentsWithStats
      }
    };

    return res.status(200).json({
      success: true,
      company: data.company
    });

  } catch (error) {
    next(error);
  }
};

