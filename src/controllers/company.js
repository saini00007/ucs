import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment, UserDepartmentLink, MasterQuestion, IndustrySector, ControlFramework, CompanyControlFrameworkLink, SubDepartment, SubAssessment } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics, calculateAssessmentStatisticsForCompany, getAssessmentStatus } from '../utils/calculateStatistics.js';

import { handleCompanyEmailUpdates, validateControlFrameworkIds, validateEmailForCompany } from '../utils/companyUtils.js'
import { frameworkFieldMapping, ROLE_IDS } from '../utils/constants.js';
// import { getCategorizedAssessments } from '../utils/assessmentUtils.js';
import { getCategorizedAssessments, getCategorizedSubAssessments, getMetricsOfAssessments } from '../utils/progressStatistics.js';
import { getFilteredAssessments } from '../utils/assessmentUtils.js';
import { required } from 'joi';
import { calculateMetrics } from '../utils/calculateRiskMetrics.js';

export const createCompany = async (req, res, next) => {
  const {
    companyName,
    primaryEmail,
    secondaryEmail,
    industrySectorId
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

    // Check if the industry sector ID is provided and valid
    let industrySector = null;
    if (industrySectorId) {
      industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
    }

    // Create the company
    const newCompany = await Company.create(
      {
        companyName,
        primaryEmail,
        secondaryEmail,
        createdByUserId: req.user.id,
        industrySectorId
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Refetch the company and include only desired attributes
    const refetchedCompany = await Company.findByPk(newCompany.id, {
      attributes: ['id', 'companyName', 'primaryEmail', 'secondaryEmail'],
      include: [{
        model: IndustrySector,
        as: 'industrySector',
        attributes: ['id', 'sectorName', 'sectorType'],
      },],
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
    controlFrameworkIds,
    auditCompletionDeadline
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

    if (industrySectorId) {
      const industrySector = await IndustrySector.findByPk(industrySectorId);
      if (!industrySector) {
        throw new AppError('Industry sector not found.', 404);
      }
    }
    company.industrySectorId = industrySectorId;

    // Update other fields
    if (companyName) company.companyName = companyName;
    if (postalAddress) company.postalAddress = postalAddress;
    if (gstNumber) company.gstNumber = gstNumber;
    if (primaryPhone) company.primaryPhone = primaryPhone;
    if (secondaryPhone) company.secondaryPhone = secondaryPhone;
    if (primaryCountryCode) company.primaryCountryCode = primaryCountryCode;
    if (secondaryCountryCode) company.secondaryCountryCode = secondaryCountryCode;
    if (panNumber) company.panNumber = panNumber;
    if (auditCompletionDeadline) company.auditCompletionDeadline = auditCompletionDeadline;
    if (req.files?.['companyLogo']) company.companyLogo = req.files['companyLogo'][0].buffer;

    await company.save({ transaction });

    if (controlFrameworkIds) {
      await validateControlFrameworkIds(controlFrameworkIds);
      await CompanyControlFrameworkLink.destroy({
        where: { companyId },
        transaction
      });
      // Create control framework associations 
      await Promise.all(
        controlFrameworkIds.map(async (frameworkId) => {
          await CompanyControlFrameworkLink.create({
            companyId: company.id,
            controlFrameworkId: frameworkId,
          }, { transaction });
        })
      );
    }
    await transaction.commit();

    // Fetch updated company without logo
    const updatedCompany = await Company.findByPk(companyId, {
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
    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }

    // Base query config
    const queryConfig = {
      where: { companyId },
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
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
        }
      ]
    };

    // Add role-based filtering
    if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.LEADERSHIP].includes(req.user.roleId)) {
      // For non-admin users, only show departments they're associated with
      queryConfig.include.push({
        model: User,
        as: 'users',
        attributes: [],
        where: { id: req.user.id },
        required: true // This ensures only departments with matching users are returned
      });
    }

    // Fetch departments
    const { count, rows: departments } = await Department.findAndCountAll(queryConfig);

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);

    // Check if page exists
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

    return res.status(200).json({
      success: true,
      messages: count === 0 ? ['No departments found'] : ['Departments retrieved successfully'],
      departments,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      },
    });

  } catch (error) {
    console.error('Error fetching departments for company:', error);
    next(error);
  }
};

export const getUsersByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { roleId, departments, subDepartments } = req.user;

  try {
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Validate pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }

    // Get department IDs from the user's departments
    const departmentIds = departments.map(department => department.id);

    // Base query options
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
          through: { attributes: [] },
          required: false,
          attributes: ['id'],
        }
      ],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      distinct: true,
      subQuery: false,
    };

    if ([ROLE_IDS.ADMIN, ROLE_IDS.SUPER_ADMIN, ROLE_IDS.LEADERSHIP].includes(roleId)) {
      // These roles can see all users in the company
    } else if (roleId === ROLE_IDS.DEPARTMENT_MANAGER) {
      queryOptions.where[Op.or] = [
        {
          roleId: {
            [Op.in]: [ROLE_IDS.ADMIN, ROLE_IDS.LEADERSHIP]
          },
          companyId
        }, // Company admins and leadership
        {
          [Op.and]: [
            { roleId: ROLE_IDS.DEPARTMENT_MANAGER },
            { '$departments.id$': { [Op.in]: departmentIds } }
          ]
        }
      ];
    } else {
      // For regular users
      const subdepartmentIds = subDepartments.map(subdept => subdept.id);

      queryOptions.include.push({
        model: SubDepartment,
        as: 'subDepartments',
        through: { attributes: [] },
        required: false,
        attributes: ['id']
      });

      queryOptions.where[Op.or] = [
        {
          roleId: {
            [Op.in]: [ROLE_IDS.ADMIN, ROLE_IDS.LEADERSHIP]
          },
          companyId
        }, // Company admins and leadership
        {
          [Op.and]: [
            { roleId: ROLE_IDS.DEPARTMENT_MANAGER },
            { '$departments.id$': { [Op.in]: departmentIds } }
          ]
        },
        {
          [Op.and]: [
            { '$subDepartments.id$': { [Op.in]: subdepartmentIds } }
          ]
        }
      ];
    }

    // SELECT * FROM Users 
    // WHERE companyId = X
    // AND(
    //   (roleId = 'ADMIN' AND companyId = X)
    // OR
    //   (roleId = 'DEPARTMENT_MANAGER' AND departmentId IN(user's department ids))
    // OR
    //       (subdepartmentId IN(user's subdepartment ids))
    //       )

    const { count, rows: users } = await User.findAndCountAll(queryOptions);

    const totalPages = Math.ceil(count / limitNum);
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

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
      attributes: ['id', 'companyName']
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

    // Validate all assessments are submitted
    const hasUnsubmittedAssessment = departments.some(dept =>
      dept.assessments.some(assessment => !assessment.submitted)
    );

    if (hasUnsubmittedAssessment) {
      throw new AppError('All assessments must be submitted before generating report', 400);
    }

    // Build framework conditions for filtering - modified to check any framework
    const frameworkConditions = frameworks.map(framework => ({
      [frameworkFieldMapping[framework]]: {
        [Op.not]: null  // Just check for not null to include any question with this framework
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
                  [Op.or]: frameworkConditions  // Using OR to include questions with any of the frameworks
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
      ...company.toJSON(),
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

