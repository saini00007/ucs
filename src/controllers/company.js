import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User, MasterDepartment, UserDepartmentLink, MasterQuestion, IndustrySector, ControlFramework, CompanyControlFrameworkLink, SubDepartment, SubAssessment } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics, calculateAssessmentStatisticsForCompany } from '../utils/calculateStatistics.js';

import { handleCompanyEmailUpdates, validateControlFrameworkIds, validateEmailForCompany } from '../utils/companyUtils.js'
import { ROLE_IDS } from '../utils/constants.js';
// import { getCategorizedAssessments } from '../utils/assessmentUtils.js';
import { getCategorizedAssessments, getCategorizedSubAssessments, getMetricsOfAssessments } from '../utils/progressStatistics.js';
import { getFilteredAssessments } from '../utils/assessmentUtils.js';
import { required } from 'joi';

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
    controlFrameworkIds
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
    if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN].includes(req.user.roleId)) {
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

    if ([ROLE_IDS.ADMIN, ROLE_IDS.SUPER_ADMIN].includes(roleId)) {
      // These roles can see all users in the company
    } else if (roleId === ROLE_IDS.DEPARTMENT_MANAGER) {
      queryOptions.where[Op.or] = [
        { roleId: ROLE_IDS.ADMIN, companyId }, // Company admins
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
        { roleId: ROLE_IDS.ADMIN, companyId }, // Company admins
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

  try {
    // Get company basic info
    const company = await Company.findByPk(companyId, {
      attributes: ['id', 'companyName']
    });

    if (!company) {
      throw new AppError(`Company not found with ID: ${companyId}`, 404);
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
      dept.assessments.some(assessment => { !assessment.submitted })

    );

    if (hasUnsubmittedAssessment) {
      throw new AppError('All assessments must be submitted before generating report', 400);
    }

    // Get detailed department data with assessments using the risk report scope
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
          attributes: ['id', 'assessmentName'],
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            attributes: ['id'],
            include: [
              {
                model: MasterQuestion.scope('riskReport'),
                as: 'masterQuestion'
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
    const companyStats = await calculateCompanyStatistics(companyId);

    // Enhance department report with assessment statistics
    const enhancedDepartmentReport = await Promise.all(
      departmentReport.map(async (department) => {
        const departmentData = department.toJSON();

        // Add statistics to each assessment
        departmentData.assessments = await Promise.all(
          departmentData.assessments.map(async (assessment) => {
            const assessmentStats = await calculateAssessmentStatistics(assessment.id);
            return {
              stats: assessmentStats,
              ...assessment,

            };
          })
        );

        return departmentData;
      })
    );

    // Combine all data in final response
    const finalReport = {

      ...company.toJSON(),
      stats: companyStats
      ,
      departments: enhancedDepartmentReport
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

export const companyProgressReport = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findOne({
      where: { id: companyId },
      attributes: ['id', 'companyName'],
      include: [
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'departmentName'],
          include: [
            {
              model: SubDepartment,
              as: 'subDepartments',
              attributes: ['id', 'subDepartmentName'],
              include: {
                model: SubAssessment,
                as: 'subAssessments',
              }
            },
            {
              model: Assessment,
              as: 'assessments',
              include: {
                model: SubAssessment,
                as: 'subAssessments',
              }
            }
          ]
        }
      ]
    });

    const AllcompletedAssessments = await getFilteredAssessments(companyId, {
      checkComplete: true,
      assessmentStarted: true,
      submitted: false,
      deadline: { [Op.gt]: currentDate }
    });

    // Process all assessments at company level with statistics
    const allAssessmentsOfCompany = await Promise.all(
      company.departments
        .flatMap(department => department.assessments)
        .map(async assessment => {
          const { subAssessments, ...assessmentWithoutSubAssessments } = assessment.toJSON();
          const statistics = await calculateAssessmentStatistics(assessment.id);
          return {
            ...assessmentWithoutSubAssessments,
            statistics
          };
        })
    );

    const categorizedAssessments = getCategorizedAssessments(allAssessmentsOfCompany);
    const metricsOfAssessment = getMetricsOfAssessments(categorizedAssessments);

    // Process departments
    const departments = await Promise.all(company.departments.map(async department => {
      // Get all subassessments with statistics
      const departmentSubAssessments = await Promise.all([
        ...department.subDepartments.flatMap(subDept => subDept.subAssessments || []),
        ...department.assessments.flatMap(assessment => assessment.subAssessments || [])
      ].map(async subAssessment => {
        const subAssessmentData = subAssessment.toJSON();
        const statistics = await calculateAssessmentStatistics(subAssessment.id);
        return {
          ...subAssessmentData,
          statistics
        };
      }));

      const categorizedSubAssessments = getCategorizedSubAssessments(departmentSubAssessments);
      const metricsOfSubAssessment = getMetricsOfAssessments(categorizedSubAssessments);

      // Process department assessments with statistics
      const departmentAssessments = await Promise.all(
        department.assessments.map(async assessment => {
          const { subAssessments, ...assessmentWithoutSubAssessments } = assessment.toJSON();
          const statistics = await calculateAssessmentStatistics(assessment.id);
          return {
            ...assessmentWithoutSubAssessments,
            statistics
          };
        })
      );

      const departmentCategorizedAssessments = getCategorizedAssessments(departmentAssessments);
      const departmentMetricsOfAssessment = getMetricsOfAssessments(departmentCategorizedAssessments);

      return {
        id: department.id,
        departmentName: department.departmentName,
        assessments: {
          metrics: {
            total: departmentAssessments.length,
            ...departmentMetricsOfAssessment,
            completed: AllcompletedAssessments.length
          },
          categorizedAssessments: departmentCategorizedAssessments
        },
        subAssessments: {
          metrics: {
            total: departmentSubAssessments.length,
            ...metricsOfSubAssessment
          },
          categorizedSubAssessments: categorizedSubAssessments
        }
      };
    }));

    res.status(200).json({
      success: true,
      messages: ['Company progress report fetched successfully'],
      progressReport: {
        assessments: {
          metrics: {
            total: allAssessmentsOfCompany.length,
            ...metricsOfAssessment
          },
          categorizedAssessments
        },
        departments
      }
    });
  } catch (error) {
    next(error);
  }
};







