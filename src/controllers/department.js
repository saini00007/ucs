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
    User
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics } from '../utils/calculateStatistics.js';


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
    const { departmentName, masterDepartmentId, companyId } = req.body;

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

        // Create a new assessment for the new department
        const newAssessment = await Assessment.create({
            departmentId: newDepartment.id,
        }, { transaction });

        // Find questions linked to the master department
        const questions = await QuestionDepartmentLink.findAll({
            where: { masterDepartmentId },
            transaction,
        });

        if (questions.length === 0) {
            console.warn('No questions found for the master department');
        }

        // Create assessment questions for each linked question
        await Promise.all(questions.map(async (qdl) => {
            await AssessmentQuestion.create({
                assessmentId: newAssessment.id,
                masterQuestionId: qdl.masterQuestionId,
            }, { transaction });
        }));

        // Commit the transaction
        await transaction.commit();

        // Retrieve the newly created department with associated data
        const departmentWithAssociations = await Department.findByPk(newDepartment.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] }
            ]
        });

        // Send a successful response
        res.status(201).json({
            success: true,
            department: departmentWithAssociations,
            assessment: newAssessment,
        });
    } catch (error) {
        console.error('Error creating department:', error);
        await transaction.rollback();
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    const { departmentId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const department = await Department.findByPk(departmentId, { transaction });
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        if (departmentName) {
            department.departmentName = departmentName;
        }

        if (masterDepartmentId) {
            const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId, { transaction });
            if (!masterDepartment) {
                throw new AppError('Invalid master department ID', 400);
            }

            // Check if master department is changing
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

                const assessments = await Assessment.findAll({
                    where: { departmentId },
                    attributes: ['id'],
                    transaction
                });

                const assessmentIds = assessments.map(assessment => assessment.id);

                // Delete associated assessment questions
                await AssessmentQuestion.destroy({
                    where: {
                        assessmentId: {
                            [Op.in]: assessmentIds
                        }
                    },
                    transaction
                });

                // Delete old assessment
                await Assessment.destroy({
                    where: { departmentId },
                    transaction
                });

                // Create new assessment
                const newAssessment = await Assessment.create({
                    departmentId
                }, { transaction });

                // Get questions for new master department
                const questions = await QuestionDepartmentLink.findAll({
                    where: { masterDepartmentId },
                    transaction
                });

                // Create new assessment questions
                await Promise.all(questions.map(async (qdl) => {
                    await AssessmentQuestion.create({
                        assessmentId: newAssessment.id,
                        masterQuestionId: qdl.masterQuestionId
                    }, { transaction });
                }));

                department.masterDepartmentId = masterDepartmentId;
            }
        }

        await department.save({ transaction });

        const updatedDepartment = await Department.findByPk(department.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] }
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

        // Fetch users associated with the given department ID
        const { count, rows: users } = await User.findAndCountAll({
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: { attributes: [] },
                where: departmentId ? { id: departmentId } : {},
            }],
            attributes: { exclude: ['password', 'deletedAt'] },
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