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
    SubAssessment
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics } from '../utils/calculateStatistics.js';
import { createDepartmentAssessment } from '../utils/departmentUtils.js';
import { ROLE_IDS } from '../utils/constants.js';


export const getDepartmentById = async (req, res, next) => {
    const { departmentId } = req.params;

    try {
        // Fetch the department by its ID, including associated Company and MasterDepartment details
        const department = await Department.findByPk(departmentId, {
            include: [
                {
                    model: Company,
                    as: 'company',
                    attributes: ['companyName']
                },
                {
                    model: MasterDepartment,
                    as: 'masterDepartment',
                    attributes: ['departmentName']
                },
            ],
        });

        // If the department is not found, throw an error
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        // Return the department details in the response
        res.status(200).json({ success: true, department: department });
    } catch (error) {
        console.error('Error fetching department:', error);
        next(error);
    }
};

export const createDepartment = async (req, res, next) => {
    const { departmentName, masterDepartmentId, companyId, deadline } = req.body;

    // Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        // Check if the company exists
        const company = await Company.findByPk(companyId, { transaction });
        if (!company) {
            throw new AppError('Invalid company ID', 400);
        }

        // Check if the master department exists
        const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId, { transaction });
        if (!masterDepartment) {
            throw new AppError('Invalid master department ID', 400);
        }

        // Create the new department
        const newDepartment = await Department.create({
            departmentName,
            companyId,
            masterDepartmentId,
            createdByUserId: req.user.id,
        }, { transaction });

        const { assessment, subDepartments } = await createDepartmentAssessment({
            departmentId: newDepartment.id,
            masterDepartmentId,
            deadline,
            transaction
        });

        // Commit the transaction
        await transaction.commit();

        // Retrieve the newly created department with associated data
        const departmentWithAssociations = await Department.findByPk(newDepartment.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] },
                {
                    model: SubDepartment,
                    as: 'subDepartments',
                    attributes: ['id', 'subDepartmentName']
                }
            ]
        });

        // Send a successful response
        res.status(201).json({
            success: true,
            department: departmentWithAssociations,
            assessment: assessment,
        });
    } catch (error) {
        console.error('Error creating department:', error);
        await transaction.rollback();
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    const { departmentId } = req.params;
    const { departmentName, masterDepartmentId, deadline } = req.body;

    const transaction = await sequelize.transaction();

    try {
        // Find department
        const department = await Department.findByPk(departmentId, { transaction });
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        // Update department name if provided
        if (departmentName) {
            department.departmentName = departmentName;
        }

        // Handle master department update if provided
        if (masterDepartmentId) {
            const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId, { transaction });
            if (!masterDepartment) {
                throw new AppError('Invalid master department ID', 400);
            }

            // Check if master department is actually changing
            if (department.masterDepartmentId !== masterDepartmentId) {
                // Check for started assessments
                const startedAssessments = await Assessment.findAll({
                    where: {
                        departmentId,
                        assessmentStarted: true
                    },
                    transaction
                });

                if (startedAssessments.length > 0) {
                    throw new AppError('Could not update department because some assessments are in progress', 400);
                }

                // Get existing assessment IDs
                const assessments = await Assessment.findAll({
                    where: { departmentId },
                    attributes: ['id'],
                    transaction
                });
                const assessmentIds = assessments.map(assessment => assessment.id);

                // Delete existing sub-departments
                await SubDepartment.destroy({
                    where: { departmentId },
                    transaction
                });

                // Delete existing assessment questions, sub-assessments, and assessments
                await AssessmentQuestion.destroy({
                    where: {
                        assessmentId: {
                            [Op.in]: assessmentIds
                        }
                    },
                    transaction
                });

                // Delete sub-assessments
                await SubAssessment.destroy({
                    where: {
                        assessmentId: {
                            [Op.in]: assessmentIds
                        }
                    },
                    transaction
                });

                // Delete main assessments
                await Assessment.destroy({
                    where: { departmentId },
                    transaction
                });

                // Create new assessment structure using the modular function
                await createDepartmentAssessment({
                    departmentId,
                    masterDepartmentId,
                    deadline,
                    transaction
                });

                department.masterDepartmentId = masterDepartmentId;
            }
        }

        // Save department changes
        await department.save({ transaction });

        // Fetch updated department with associations
        const updatedDepartment = await Department.findByPk(department.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] },
                {
                    model: SubDepartment,
                    as: 'subDepartments',
                    attributes: ['id', 'subDepartmentName']
                }
            ],
            transaction
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['Department updated successfully'],
            department: updatedDepartment
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating department:', error);
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

export const getAssessmentByDepartmentId = async (req, res, next) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        // Find all assessments associated with the given department ID
        const assessments = await Assessment.findAll({
            where: { departmentId },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName']
                }
            ]
        });

        // Calculate answer statistics for each assessment
        const assessmentsWithStats = await Promise.all(
            assessments.map(async (assessment) => {
                const stats = await calculateAssessmentStatistics(assessment.id);
                return {
                    ...assessment.toJSON(),
                    stats
                };
            })
        );

        // Return response
        res.status(200).json({
            success: true,
            messages: assessments.length === 0 ? ['No assessments found'] : ['Assessments retrieved successfully'],
            assessments: assessmentsWithStats
        });

    } catch (error) {
        console.error('Error fetching assessments for department:', error);
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
        if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.DEPARTMENT_MANAGER].includes(requestingUser.roleId)) {
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
      if (![ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.DEPARTMENT_MANAGER].includes(roleId)) {
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
              assessmentName: 'default'
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
  
      // Calculate compliance percentage
      const calculateCompliance = (questions) => {
        const answeredQuestions = questions.filter(q => q.answer && q.answer.answerText);
        if (answeredQuestions.length === 0) return 0;
  
        const noAnswers = answeredQuestions.filter(q => 
          q.answer.answerText.toLowerCase() === 'no'
        ).length;
  
        return ((answeredQuestions.length - noAnswers) / answeredQuestions.length) * 100;
      };
  
      // Get status based on compliance percentage
      const getComplianceStatus = (percentage) => {
        if (percentage >= 90) return 'green';
        if (percentage >= 70) return 'yellow';
        return 'red';
      };
  
      // Process subdepartments
      const categorizedSubDepartments = {
        red: [],
        yellow: [],
        green: []
      };
  
      department.subDepartments.forEach(subDept => {
        let totalCompliance = 0;
  
        // Calculate average compliance across all subassessments
        subDept.subAssessments.forEach(subAssessment => {
          totalCompliance += calculateCompliance(subAssessment.questions);
        });
  
        const averageCompliance = subDept.subAssessments.length > 0 
          ? totalCompliance / subDept.subAssessments.length 
          : 0;
  
        const status = getComplianceStatus(averageCompliance);
  
        categorizedSubDepartments[status].push({
          id: subDept.id,
          name: subDept.subDepartmentName,
          compliancePercentage: averageCompliance.toFixed(2)
        });
      });
  
      // Calculate default assessment compliance with detailed stats
      const defaultAssessment = department.assessments.map(assessment => {
        const questions = assessment.questions || [];
        const answeredQuestions = questions.filter(q => q.answer && q.answer.answerText);
        
        const stats = {
          total: questions.length,
          answered: answeredQuestions.length,
          unanswered: questions.length - answeredQuestions.length,
          answers: {
            yes: answeredQuestions.filter(q => q.answer.answerText.toLowerCase() === 'yes').length,
            no: answeredQuestions.filter(q => q.answer.answerText.toLowerCase() === 'no').length,
            notApplicable: answeredQuestions.filter(q => q.answer.answerText.toLowerCase() === 'not applicable').length,
            partial: answeredQuestions.filter(q => q.answer.answerText.toLowerCase() === 'partial').length
          }
        };
  
        // Calculate percentages
        const percentages = {
          completion: stats.total ? ((stats.answered / stats.total) * 100).toFixed(2) : "0.00",
          yes: stats.answered ? ((stats.answers.yes / stats.answered) * 100).toFixed(2) : "0.00",
          no: stats.answered ? ((stats.answers.no / stats.answered) * 100).toFixed(2) : "0.00",
          notApplicable: stats.answered ? ((stats.answers.notApplicable / stats.answered) * 100).toFixed(2) : "0.00",
          partial: stats.answered ? ((stats.answers.partial / stats.answered) * 100).toFixed(2) : "0.00"
        };
  
        const compliancePercentage = calculateCompliance(questions).toFixed(2);
  
        return {
          compliancePercentage,
          status: getComplianceStatus(parseFloat(compliancePercentage)),
          stats,
          percentages,
          assessmentFields: {
            id: assessment.id,
            assessmentName: assessment.assessmentName,
            assessmentStarted: assessment.assessmentStarted,
            submitted: assessment.submitted,
            startedAt: assessment.startedAt,
            submittedAt: assessment.submittedAt,
            deadline: assessment.deadline
          }
        };
      })[0] || {
        compliancePercentage: "0.00",
        status: "red",
        stats: {
          total: 0,
          answered: 0,
          unanswered: 0,
          answers: { yes: 0, no: 0, notApplicable: 0, partial: 0 }
        },
        percentages: {
          completion: "0.00",
          yes: "0.00",
          no: "0.00",
          notApplicable: "0.00",
          partial: "0.00"
        },
        assessmentFields: {
          id: null,
          assessmentName: "default",
          assessmentStarted: false,
          submitted: false,
          startedAt: null,
          submittedAt: null,
          deadline: null
        }
      };
  
      res.status(200).json({
        success: true,
        messages: ['Compliance report generated successfully'],
        departmentName: department.departmentName,
        subDepartments: {
          red: {
            count: categorizedSubDepartments.red.length,
            description: 'Low Compliance (Below 70%)',
            items: categorizedSubDepartments.red
          },
          yellow: {
            count: categorizedSubDepartments.yellow.length,
            description: 'Medium Compliance (70-90%)',
            items: categorizedSubDepartments.yellow
          },
          green: {
            count: categorizedSubDepartments.green.length,
            description: 'High Compliance (Above 90%)',
            items: categorizedSubDepartments.green
          }
        },
        defaultAssessment
      });
    } catch (error) {
      next(error);
    }
  };