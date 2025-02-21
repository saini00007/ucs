import {
  Department,
  Company,
  MasterDepartment,
  Assessment,
  AssessmentQuestion,
  MasterQuestion,
  QuestionDepartmentLink,
  Answer,
  EvidenceFile,
  UserDepartmentLink,
  Comment,
  User,
  MasterSubDepartment,
  SubDepartment,
  SubAssessment,
  ControlFramework,
  CompanyControlFrameworkLink
} from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAnswerStats, calculateAssessmentStatistics, calculateSubAssessmentStatistics, getAssessmentStatus, getSubAssessmentStatus } from '../utils/calculateStatistics.js';
import { createDepartmentAssessment, validateAssessmentDeadline, validateDepartmentMappings } from '../utils/departmentUtils.js';
import { ANSWER_TYPES, ASSESSMENT_TYPE, frameworkFieldMapping, ROLE_IDS, SUB_ASSESSMENT_REVIEW_STATUS, SUB_ASSESSMENT_TYPE } from '../utils/constants.js';
import { calculateMetrics } from '../utils/calculateRiskMetrics.js';

export const createDepartments = async (req, res, next) => {
  const { companyId, mappings } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const { company } = await validateDepartmentMappings(mappings, companyId);

    // Status checks
    if (company.detailsStatus !== 'complete') {
      throw new AppError('Complete company details first.', 400);
    }
    if (company.controlFrameworksStatus !== 'complete') {
      throw new AppError('Complete control frameworks setup first.', 400);
    }

    const createdData = await Promise.all(mappings.map(async (dept) => {
      // Create department
      const department = await Department.create({
        departmentName: dept.mappedName,
        companyId,
        masterDepartmentId: dept.masterDepartmentId,
        createdByUserId: req.user.id
      }, { transaction });

      // Create assessment
      const assessment = await Assessment.create({
        departmentId: department.id,
        deadline: dept.closureDate,
        assessmentName: `${dept.mappedName}_Assessment`
      }, { transaction });

      // Process subdepartments
      const subdepartments = [];
      for (const sub of dept.subdepartments) {
        const subdepartment = await SubDepartment.create({
          subDepartmentName: sub.mappedName,
          departmentId: department.id,
          masterSubDepartmentId: sub.masterSubDepartmentId,
          createdByUserId: req.user.id
        }, { transaction });

        const subassessment = await SubAssessment.create({
          subAssessmentName: `${sub.mappedName}_Assessment`,
          subDepartmentId: subdepartment.id,
          assessmentId: assessment.id,
          deadline: dept.closureDate
        }, { transaction });

        // Find and create questions
        const questions = await MasterQuestion.findAll({
          where: {
            masterDepartmentId: dept.masterDepartmentId,
            masterSubDepartmentId: sub.masterSubDepartmentId
          },
          transaction
        });

        console.log(`Found ${questions.length} questions for subdepartment ${sub.mappedName}`);

        // Create assessment questions one by one
        for (const question of questions) {
          await AssessmentQuestion.create({
            assessmentId: assessment.id,
            masterQuestionId: question.id,
            subAssessmentId: subassessment.id
          }, { transaction });
        }

        subdepartments.push({ subdepartment, subassessment });
      }

      return { department, assessment, subdepartments };
    }));

    // Update department status
    await company.update({ departmentsStatus: 'complete' }, { transaction });

    await transaction.commit();
    res.status(201).json({ success: true, data: createdData });

  } catch (error) {
    console.error('Error in createDepartments:', error);
    await transaction.rollback();
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findByPk(departmentId);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.status(200).json({
      success: true,
      department: department.toJSON()
    });

  } catch (error) {
    console.error('Error fetching department:', error);
    next(error);
  }
};

export const getAssessmentByDepartmentId = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Find all assessments associated with the given department ID
    const assessments = await Assessment.findAll({
      where: { departmentId }
    });

    // // Calculate answer statistics for each assessment
    // const assessmentsWithStats = await Promise.all(
    //   assessments.map(async (assessment) => {
    //     const stats = await calculateAssessmentStatistics(assessment.id);
    //     return {
    //       ...assessment.toJSON(),
    //       stats
    //     };
    //   })
    // );

    // Return response
    res.status(200).json({
      success: true,
      messages: assessments.length === 0 ? ['No assessments found'] : ['Assessments retrieved successfully'],
      assessments: assessments
    });

  } catch (error) {
    console.error('Error fetching assessments for department:', error);
    next(error);
  }
};

export const getSubDepartmentsByDepartmentId = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const roleId = req.user.roleId;

    // Base query configuration
    const queryConfig = {
      where: { departmentId },
      attributes: ['id', 'subDepartmentName'],
      order: [['createdAt', 'DESC']],
    };

    // Add user association filter for non-admin roles
    if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.DEPARTMENT_MANAGER, ROLE_IDS.LEADERSHIP].includes(roleId)) {
      queryConfig.include = [{
        model: User,
        as: 'users',
        attributes: [],
        where: { id: req.user.id },
        required: true
      }];
    }

    // Fetch subdepartments with configured filters
    const subDepartments = await SubDepartment.findAll(queryConfig);

    return res.status(200).json({
      success: true,
      messages: subDepartments.length === 0
        ? ['No sub departments found']
        : ['Sub departments retrieved successfully'],
      subDepartments,
    });

  } catch (error) {
    console.error('Error fetching subdepartments:', error);
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  const { departmentId } = req.params;
  const { departmentName, deadline } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // Find the department
    const department = await Department.findByPk(departmentId, {
      include: [
        {
          model: Assessment,
          as: 'assessments',
          include: [
            {
              model: SubAssessment,
              as: 'subAssessments',
            },
          ],
        },
      ],
      transaction,
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Update department name if provided
    if (departmentName) {
      await department.update({ departmentName }, { transaction });
    }

    // Update assessment deadline if provided
    if (deadline) {
      const assessment = department.assessments?.[0]; // Assuming there's only one assessment per department

      if (assessment) {
        // Update the assessment deadline
        await assessment.update({ deadline }, { transaction });

        // Update all related sub-assessments deadlines
        await Promise.all(
          assessment.subAssessments.map((subAssessment) =>
            subAssessment.update({ deadline }, { transaction })
          )
        );
      } else {
        throw new AppError('No assessment found for this department', 404);
      }
    }

    // Commit the transaction
    await transaction.commit();

    // Fetch the updated department with its assessments and sub-assessments
    const updatedDepartment = await Department.findByPk(departmentId, {
      include: [
        {
          model: Assessment,
          as: 'assessments',
          include: [
            {
              model: SubAssessment,
              as: 'subAssessments',
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      messages: ['Department updated successfully'],
      department: updatedDepartment,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  const { departmentId } = req.params;
  const transaction = await sequelize.transaction();

  try {
    // Check if department exists first
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Find all assessments associated with the department
    const assessments = await Assessment.findAll({
      where: { departmentId },
      attributes: ['id'],
      transaction,
    });

    const assessmentIds = assessments.map(assessment => assessment.id);

    // Find all assessment questions related to the assessments
    const assessmentQuestions = await AssessmentQuestion.findAll({
      where: { assessmentId: { [Op.in]: assessmentIds } },
      attributes: ['id'],
      transaction,
    });

    const assessmentQuestionIds = assessmentQuestions.map(q => q.id);

    // Find all answers related to the assessment questions
    const answers = await Answer.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

    const answerIds = answers.map(a => a.id);

    // Find all evidence files related to the answers
    const evidenceFiles = await EvidenceFile.findAll({
      where: { answerId: { [Op.in]: answerIds } },
      attributes: ['id'],
      transaction,
    });

    const evidenceFileIds = evidenceFiles.map(e => e.id);

    // Find all comments related to the assessment questions
    const comments = await Comment.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

    // Delete all related records
    await Comment.destroy({
      where: { id: { [Op.in]: comments.map(c => c.id) } },
      transaction,
    });

    await EvidenceFile.destroy({
      where: { id: { [Op.in]: evidenceFileIds } },
      transaction,
    });

    await Answer.destroy({
      where: { id: { [Op.in]: answerIds } },
      transaction,
    });

    await AssessmentQuestion.destroy({
      where: { id: { [Op.in]: assessmentQuestionIds } },
      transaction,
    });

    await Assessment.destroy({
      where: { id: { [Op.in]: assessmentIds } },
      transaction,
    });

    await UserDepartmentLink.destroy({
      where: { departmentId },
      transaction,
    });

    await Department.destroy({
      where: { id: departmentId },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      messages: ['Department and related records deleted successfully'],
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};


export const getUsersByDepartmentId = async (req, res, next) => {
  const { departmentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { user: requestingUser } = req;

  try {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Parse and validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }

    // Base query options
    let queryOptions = {
      attributes: { exclude: ['password', 'deletedAt'] },
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      include: [{
        model: Department,
        as: 'departments',
        attributes: ['id'],
        through: { attributes: [] },
        where: departmentId ? { id: departmentId } : {},
      }]
    };

    // Add subdepartment filter for non-admin users
    if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.DEPARTMENT_MANAGER, ROLE_IDS.LEADERSHIP].includes(requestingUser.roleId)) {
      // Get the requesting user's subdepartment IDs
      const subdepartmentIds = requestingUser.subDepartments.map(subdept => subdept.id);

      queryOptions.include.push({
        model: SubDepartment,
        as: 'subDepartments',
        attributes: ['id'],
        through: { attributes: [] },
        where: {
          id: subdepartmentIds
        }
      });
    }

    // Fetch users with the constructed query
    const { count, rows: users } = await User.findAndCountAll(queryOptions);

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);

    // Check if page exists
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

    // Return response with pagination
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
    console.error('Error fetching users for department:', error);
    next(error);
  }
};


export const departmentProgressReport = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findOne({
      where: { id: departmentId },
      attributes: ['id', 'departmentName'],
      include: [
        {
          model: Assessment,
          as: 'assessments',
          where: {
            assessmentName: 'default'//assessmentType
          },
          required: false,
          include: [{
            model: AssessmentQuestion,
            as: 'questions',
            include: [{
              model: Answer,
              as: 'answer',
              attributes: ['answerText']
            }]
          }]
        },
        {
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
                as: 'answer',
                attributes: ['answerText']
              }]
            }]
          }]
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        messages: ['Department not found']
      });
    }

    // Calculate compliance percentage based on 'no' answers out of total answers
    const calculateCompliance = (questions) => {
      const answeredQuestions = questions.filter(q => q.answer && q.answer.answerText);

      // If there are no answers at all, return { percentage: 100, status: 'green' }
      if (answeredQuestions.length === 0) {
        return { percentage: 100, status: 'green' };
      }

      const totalAnswered = answeredQuestions.length;
      const noAnswers = answeredQuestions.filter(q =>
        q.answer.answerText.toLowerCase() === 'no'
      ).length;

      const compliancePercentage = ((totalAnswered - noAnswers) / totalAnswered * 100);

      // Determine status based on compliance percentage
      let status;
      if (compliancePercentage >= 90) status = 'green';
      else if (compliancePercentage >= 70) status = 'yellow';
      else status = 'red';

      return { percentage: compliancePercentage, status };
    };

    const getComplianceStatus = (percentage) => {
      if (percentage >= 90) return 'green';
      if (percentage >= 70) return 'yellow';
      return 'red';
    };

    const categorizedSubDepartments = {
      red: [],
      yellow: [],
      green: []
    };

    department.subDepartments.forEach(subDept => {
      let totalCompliance = 0;
      const totalAssessments = subDept.subAssessments.length;

      // Calculate average compliance across all subassessments
      subDept.subAssessments.forEach(subAssessment => {
        const complianceResult = calculateCompliance(subAssessment.questions);
        totalCompliance += complianceResult.percentage;
      });

      const averageCompliance = totalAssessments > 0 ? totalCompliance / totalAssessments : 100;
      // If no assessments or no answers, it should be green
      const status = totalAssessments === 0 ? 'green' : getComplianceStatus(averageCompliance);

      categorizedSubDepartments[status].push({
        id: subDept.id,
        subDepartmentName: subDept.subDepartmentName,
        compliancePercentage: averageCompliance.toFixed(2)
      });
    }); //have to change this based on assessmentType=default

    const { questions, ...defaultAssessment } = department.assessments[0].toJSON(); //assessmentType=default
    const sp80053ControlNumRequired = false;
    const stats = await calculateAssessmentStatistics(defaultAssessment.id, sp80053ControlNumRequired);

    res.status(200).json({
      success: true,
      messages: ['Compliance report generated successfully'],
      departmentName: department.departmentName,
      subDepartments: {
        red: {
          count: categorizedSubDepartments.red.length,
          description: 'Low Compliance (Below 70%)',
          subDepartments: categorizedSubDepartments.red
        },
        yellow: {
          count: categorizedSubDepartments.yellow.length,
          description: 'Medium Compliance (70-90%)',
          subDepartments: categorizedSubDepartments.yellow
        },
        green: {
          count: categorizedSubDepartments.green.length,
          description: 'High Compliance (Above 90%)',
          subDepartments: categorizedSubDepartments.green
        }
      },
      defaultAssessment: {
        defaultAssessment, stats
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getDepartmentAssessmentMetrics = async (req, res, next) => {
  const { departmentId } = req.params;
  console.log('hi')
  try {
    // Get department with related data
    const departmentData = await Department.findOne({
      where: { id: departmentId },
      attributes: ['id', 'departmentName'],
      include: [
        {
          model: SubDepartment,
          as: 'subDepartments',
          attributes: ['id', 'subDepartmentName'],
          include: [
            {
              model: SubAssessment,
              as: 'subAssessments',
              attributes: ['id', 'deadline'],
              include: [
                {
                  model: AssessmentQuestion,
                  as: 'questions',
                  include: [
                    {
                      model: Answer,
                      as: 'answer',
                      attributes: ['answerText', 'reviewStatus']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!departmentData) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Process subdepartments
    const allQuestions = [];
    const subDepartmentMetrics = [];

    departmentData.subDepartments.forEach(subDept => {
      const subDeptQuestions = [];

      // Collect all questions from subassessments
      subDept.subAssessments.forEach(subAssess => {
        subDeptQuestions.push(...(subAssess.questions || []));
        allQuestions.push(...(subAssess.questions || []));
      });

      // Calculate metrics for this subdepartment
      subDepartmentMetrics.push({
        id: subDept.id,
        name: subDept.subDepartmentName,
        deadline: subDept.subAssessments[0]?.deadline,
        metrics: calculateAnswerStats(subDeptQuestions)
      });
    });

    // Calculate department level metrics
    const departmentMetrics = calculateAnswerStats(allQuestions);

    res.status(200).json({
      success: true,
      data: {
        departmentName: departmentData.departmentName,
        departmentMetrics,
        subDepartments: subDepartmentMetrics
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getSubAssessmentsCategoryWise = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findOne({
      where: { id: departmentId },
      attributes: ['id', 'departmentName'],
      include: [{
        model: SubDepartment,
        as: 'subDepartments',
        attributes: ['id', 'subDepartmentName'],
        include: [{
          model: SubAssessment,
          as: 'subAssessments',
          attributes: [
            'id',
            'subAssessmentName',
            'subAssessmentStarted',
            'submitted',
            'startedAt',
            'submittedAt',
            'deadline',
            'assessmentId',
            'reviewStatus'
          ]
        }]
      }]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        messages: ['Department not found']
      });
    }

    // Process all sub-departments
    const categorizedResults = await Promise.all(
      department.subDepartments.map(async (subDept) => {
        const subDepartmentData = subDept.toJSON();

        // Process sub-assessments for each sub-department
        const subAssessmentsWithStats = await Promise.all(
          subDepartmentData.subAssessments.map(async (subAssessment) => {
            const statistics = await calculateAssessmentStatistics(subAssessment.id);
            const status = getSubAssessmentStatus(subAssessment, statistics);

            return {
              ...subAssessment,
              statistics,
              status,
              subDepartmentName: subDepartmentData.subDepartmentName
            };
          })
        );

        return subAssessmentsWithStats;
      })
    );

    // Flatten all sub-assessments from all sub-departments
    const allSubAssessments = categorizedResults.flat();

    // Categorize all sub-assessments
    const categorizedAssessments = {
      notStarted: {
        description: "Assessments that have not been initiated yet",
        assessments: allSubAssessments.filter(a => !a.subAssessmentStarted)
      },
      active: {
        description: "Assessments currently in progress",
        assessments: allSubAssessments.filter(a =>
          a.subAssessmentStarted && !a.submitted)
      },
      submittedForReview: {
        description: "Assessments submitted to reviewer",
        assessments: allSubAssessments.filter(a =>
          a.reviewStatus === SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW
        )
      },
      underReview: {
        description: "Assessments currently being reviewed",
        assessments: allSubAssessments.filter(a =>
          a.reviewStatus === SUB_ASSESSMENT_REVIEW_STATUS.UNDER_REVIEW
        )
      },
      needRevision: {
        description: "Assessments that require modifications based on review",
        assessments: allSubAssessments.filter(a =>
          a.reviewStatus === SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION
        )
      },
      completed: {
        description: "Assessments that have been fully approved",
        assessments: allSubAssessments.filter(a =>
          a.reviewStatus === SUB_ASSESSMENT_REVIEW_STATUS.COMPLETED
        )
      }
    };

    // Calculate counts
    const assessmentCounts = {
      notStarted: categorizedAssessments.notStarted.assessments.length,
      active: categorizedAssessments.active.assessments.length,
      submittedForReview: categorizedAssessments.submittedForReview.assessments.length,
      underReview: categorizedAssessments.underReview.assessments.length,
      needRevision: categorizedAssessments.needRevision.assessments.length,
      completed: categorizedAssessments.completed.assessments.length,
      total: allSubAssessments.length
    };
    const overallProgress = {
      completionRate: assessmentCounts.total > 0
        ? ((assessmentCounts.completed / assessmentCounts.total) * 100).toFixed(2)
        : 0,
      inReviewRate: assessmentCounts.total > 0
        ? (((assessmentCounts.submittedForReview + assessmentCounts.underReview) / assessmentCounts.total) * 100).toFixed(2)
        : 0,
      revisionRate: assessmentCounts.total > 0
        ? ((assessmentCounts.needRevision / assessmentCounts.total) * 100).toFixed(2)
        : 0
    };


    return res.status(200).json({
      success: true,
      categorizedAssessments: {
        counts: assessmentCounts,
        progress: overallProgress,
        categories: {
          notStarted: {
            description: categorizedAssessments.notStarted.description,
            assessments: categorizedAssessments.notStarted.assessments
          },
          active: {
            description: categorizedAssessments.active.description,
            assessments: categorizedAssessments.active.assessments
          },
          submittedForReview: {
            description: categorizedAssessments.submittedForReview.description,
            assessments: categorizedAssessments.submittedForReview.assessments
          },
          underReview: {
            description: categorizedAssessments.underReview.description,
            assessments: categorizedAssessments.underReview.assessments
          },
          needRevision: {
            description: categorizedAssessments.needRevision.description,
            assessments: categorizedAssessments.needRevision.assessments
          },
          completed: {
            description: categorizedAssessments.completed.description,
            assessments: categorizedAssessments.completed.assessments
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getRiskMetricsForDepartment = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findByPk(departmentId, {
      include: [{
        model: Assessment,
        as: 'assessments',
        where: {
          assessmentType: ASSESSMENT_TYPE.DEFAULT
        },
        required: false,
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
          where: {
            subAssessmentType: SUB_ASSESSMENT_TYPE.DEFAULT
          },
          required: false,
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
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        messages: ['Department not found']
      });
    }

    const assessment = department.assessments?.[0];
    if (!assessment) {
      return res.status(404).json({
        success: false,
        messages: ['No default assessment found for department']
      });
    }

    // Calculate department level metrics
    const departmentMetrics = calculateMetrics(assessment.questions);

    // Calculate metrics for all subdepartments
    const subdepartmentsData = department.subDepartments
      .map(subdepartment => {
        const subAssessment = subdepartment.subAssessments?.[0];
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
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      departmentRiskMetrics: {
        id: departmentId,
        departmentName: department.departmentName,
        riskMetrics: {
          departmentRiskIndex: departmentMetrics.departmentRiskIndex,
          controlCoverageRatio: departmentMetrics.controlCoverageRatio,
          gapDensityRate: departmentMetrics.gapDensityRate,
          departmentComplianceScore: departmentMetrics.departmentComplianceScore,
          documentationCoverageRatio: departmentMetrics.documentationCoverageRatio
        },
        subDepartmentsRiskMetrics: subdepartmentsData
      }
    });
  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    next(error);
  }
};

export const getDepartmentOverview = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findByPk(departmentId, {
      attributes: ['id', 'departmentName', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Assessment,
          as: 'assessments',
        },
        {
          model: SubDepartment,
          as: 'subDepartments',
          attributes: ['id', 'subDepartmentName', 'createdAt', 'updatedAt'],
          include: [{
            model: SubAssessment,
            as: 'subAssessments',
          }]
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        messages: ['Department not found']
      });
    }

    // Calculate statistics and status for main assessments
    const assessmentsWithStats = await Promise.all(
      department.assessments.map(async (assessment) => {
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

    // Calculate statistics and status for subassessments
    const subDepartmentsWithStats = await Promise.all(
      department.subDepartments.map(async (subDept) => {
        const subAssessmentsWithStats = await Promise.all(
          subDept.subAssessments.map(async (subAssessment) => {
            try {
              const stats = await calculateSubAssessmentStatistics(subAssessment.id);
              return {
                ...subAssessment.toJSON(),
                statistics: stats,
                status: getSubAssessmentStatus(subAssessment, stats)
              };
            } catch (error) {
              console.error(`Error calculating statistics for subassessment ${subAssessment.id}:`, error);
              return {
                ...subAssessment.toJSON(),
                statistics: null,
                status: null
              };
            }
          })
        );

        return {
          id: subDept.id,
          subDepartmentName: subDept.subDepartmentName,
          createdAt: subDept.createdAt,
          updatedAt: subDept.updatedAt,
          subAssessments: subAssessmentsWithStats
        };
      })
    );

    const data = {
      department: {
        id: department.id,
        departmentName: department.departmentName,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        assessments: assessmentsWithStats,
        subDepartments: subDepartmentsWithStats
      }
    };

    return res.status(200).json({
      success: true,
      department: data.department
    });

  } catch (error) {
    next(error);
  }
};

export const getReportByDepartmentId = async (req, res, next) => {
  const { departmentId } = req.params;
  const { controlFrameworkIds = '' } = req.query;

  try {
    // Validate controlFrameworkIds is provided
    if (!controlFrameworkIds) {
      throw new AppError('Control framework IDs are required', 400);
    }


    // Get department with company info
    const department = await Department.findByPk(departmentId, {
      attributes: ['id', 'departmentName', 'companyId'],
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'companyName'],
      }]
    });

    if (!department) {
      throw new AppError(`Department not found with ID: ${departmentId}`, 404);
    }

    const companyId = department.companyId;

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

    // Get subdepartments and check submissions
    const subDepartments = await SubDepartment.findAll({
      where: { departmentId },
      attributes: ['id'],
      include: [{
        model: SubAssessment,
        as: 'subAssessments',
        attributes: ['id', 'submitted']
      }]
    });

    if (!subDepartments.length) {
      throw new AppError(`No subdepartments found for department ID: ${departmentId}`, 404);
    }

    // Validate all subassessments are submitted
    const hasUnsubmittedSubAssessment = subDepartments.some(subDept =>
      subDept.subAssessments.some(subAssessment => !subAssessment.submitted)
    );

    if (hasUnsubmittedSubAssessment) {
      throw new AppError('All subassessments must be submitted before generating report', 400);
    }

    // Build framework conditions for filtering - modified to check any framework
    const frameworkConditions = frameworks.map(framework => ({
      [frameworkFieldMapping[framework]]: {
        [Op.not]: null  // Just check for not null to include any question with this framework
      }
    }));

    // Get detailed subdepartment data with subassessments
    const subDepartmentReport = await SubDepartment.findAll({
      where: { departmentId },
      attributes: ['id', 'subDepartmentName'],
      include: [
        {
          model: MasterSubDepartment,
          as: 'masterSubDepartment',
          attributes: ['id', 'subDepartmentName'],
        },
        {
          model: SubAssessment,
          as: 'subAssessments',
          attributes: [
            'id',
            'subAssessmentName',
            'subAssessmentStarted',
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
        ['subDepartmentName', 'ASC'],
        [{ model: SubAssessment, as: 'subAssessments' }, 'subAssessmentName', 'ASC'],
        [{ model: SubAssessment, as: 'subAssessments' }, { model: AssessmentQuestion, as: 'questions' }, 'id', 'ASC']
      ]
    });

    // Enhance subdepartment report with statistics
    const enhancedSubDepartmentReport = await Promise.all(
      subDepartmentReport.map(async (subDepartment) => {
        const subDepartmentData = subDepartment.toJSON();

        // Add statistics to each subassessment
        subDepartmentData.subAssessments = await Promise.all(
          subDepartmentData.subAssessments.map(async (subAssessment) => {
            const subAssessmentStats = await calculateSubAssessmentStatistics(subAssessment.id);
            return {
              ...subAssessment,
              statistics: subAssessmentStats
            };
          })
        );

        return subDepartmentData;
      })
    );

    // Prepare final response
    const finalReport = {
      id: department.id,
      departmentName: department.departmentName,
      company: {
        id: department.company.id,
        companyName: department.company.companyName
      },
      subDepartments: enhancedSubDepartmentReport,
      metadata: {
        controlFrameworks: controlFrameworks.map(cf => ({
          id: cf.id,
          frameworkType: cf.frameworkType
        })),
        generatedAt: new Date().toISOString()
      }
    };

    return res.status(200).json({
      success: true,
      messages: ['Report data successfully fetched'],
      reportData: finalReport
    });

  } catch (error) {
    console.error('Error fetching department report data:', error);
    next(error);
  }
};

// Controller
export const getDepartmentProgressMetrics = async (req, res, next) => {
  const { departmentId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // First get all subdepartments of the department
    const departmentData = await Department.findOne({
      where: { id: departmentId },
      include: [{
        model: SubDepartment,
        as: 'subDepartments',
        attributes: ['id', 'subDepartmentName']
      }]
    });

    if (!departmentData) {
      throw new AppError('Department not found', 404);
    }

    // Get answer frequency for each subdepartment
    const questionsFrequency = await AssessmentQuestion.findAll({
      attributes: ['createdAt'],
      include: [{
        model: SubAssessment,
        as: 'subAssessment',
        required: true,
        include: [{
          model: SubDepartment,
          as: 'subDepartment',
          required: true,
          where: {
            departmentId
          },
          attributes: ['id', 'subDepartmentName']
        }]
      }],
      where: startDate && endDate ? {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      } : {}
    });

    // Group questions by date and subdepartment
    const frequencyBySubDept = questionsFrequency.reduce((acc, question) => {
      const date = question.createdAt.toISOString().split('T')[0];
      const subDeptId = question.subAssessment.subDepartment.id;
      const subDeptName = question.subAssessment.subDepartment.subDepartmentName;

      if (!acc[date]) {
        acc[date] = {
          date,
          // Initialize count for each subdepartment
          ...departmentData.subDepartments.reduce((subDepts, dept) => ({
            ...subDepts,
            [dept.subDepartmentName]: 0
          }), {})
        };
      }

      acc[date][subDeptName] = (acc[date][subDeptName] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by date
    const timelineData = Object.values(frequencyBySubDept)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        timelineData,
        subDepartments: departmentData.subDepartments.map(dept => ({
          id: dept.id,
          name: dept.subDepartmentName
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};



export const getDepartmentMetrics = async (req, res, next) => {
  const { departmentId } = req.params;

  try {
    // Find single department with its default assessment
    const department = await Department.findOne({
      where: { id: departmentId },
      include: [{
        model: Assessment,
        as: 'assessments',
        where: {
          assessmentType: ASSESSMENT_TYPE.DEFAULT
        },
        required: false,
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
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        messages: ['Department not found']
      });
    }

    const assessment = department.assessments?.[0];
    if (!assessment) {
      return res.status(404).json({
        success: false,
        messages: ['No default assessment found for department']
      });
    }

    const metrics = calculateMetrics(assessment.questions);

    return res.status(200).json({
      success: true,
      departmentRiskMetrics: {
        id: department.id,
        departmentName: department.departmentName,
        riskMetrics: {
          departmentRiskIndex: metrics.departmentRiskIndex,
          controlCoverageRatio: metrics.controlCoverageRatio,
          gapDensityRate: metrics.gapDensityRate,
          departmentComplianceScore: metrics.departmentComplianceScore,
          documentationCoverageRatio: metrics.documentationCoverageRatio
        }
      }
    });
  } catch (error) {
    console.error('Error fetching department metrics:', error);
    next(error);
  }
};