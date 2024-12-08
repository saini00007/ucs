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

export const getDepartmentById = async (req, res) => {
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

        // If the department is not found, return a 404 response
        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }

        // Return the department details in the response
        res.status(200).json({ success: true, department: department });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ success: false, messages: ['Failed to fetch department'] });
    }
};

export const createDepartment = async (req, res) => {
    const { departmentName, masterDepartmentId, companyId } = req.body;

    // Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        // Check if the company exists
        const company = await Company.findByPk(companyId, { transaction });
        if (!company) {
            await transaction.rollback();
            return res.status(400).json({ success: false, messages: ['Invalid company ID'] });
        }

        // Check if the master department exists
        const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId, { transaction });
        if (!masterDepartment) {
            await transaction.rollback();
            return res.status(400).json({ success: false, messages: ['Invalid master department ID'] });
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
        res.status(500).json({ success: false, messages: ['Failed to create department'] });
    }
};

export const updateDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const department = await Department.findByPk(departmentId, { transaction });
        if (!department) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                messages: ['Department not found']
            });
        }

        if (departmentName) {
            department.departmentName = departmentName;
        }

        if (masterDepartmentId) {
            const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId, { transaction });
            if (!masterDepartment) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    messages: ['Invalid master department ID']
                });
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
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        messages: ['Could not update department because some assessments are in progress']
                    });
                }

                const assessments = await Assessment.findAll({
                    where: { departmentId },
                    attributes: ['id'],
                    transaction
                });

                const assessmentIds = assessments.map(assessment => assessment.id);

                //  Delete associated assessment questions
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
        res.status(500).json({
            success: false,
            messages: ['Failed to update department']
        });
    }
};

export const deleteDepartment = async (req, res) => {
    const { departmentId } = req.params;

    const transaction = await sequelize.transaction();

    try {
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

        // Delete comments
        await Comment.destroy({
            where: { id: { [Op.in]: comments.map(c => c.id) } },
            transaction,
        });

        // Delete evidence files
        await EvidenceFile.destroy({
            where: { id: { [Op.in]: evidenceFileIds } },
            transaction,
        });

        // Delete answers
        await Answer.destroy({
            where: { id: { [Op.in]: answerIds } },
            transaction,
        });

        // Delete assessment questions
        await AssessmentQuestion.destroy({
            where: { id: { [Op.in]: assessmentQuestionIds } },
            transaction,
        });

        // Delete assessments
        await Assessment.destroy({
            where: { id: { [Op.in]: assessmentIds } },
            transaction,
        });

        // Delete user-department links
        await UserDepartmentLink.destroy({
            where: { departmentId },
            transaction,
        });

        // Delete the department
        const deleted = await Department.destroy({
            where: { id: departmentId },
            transaction,
        });

        if (deleted === 0) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                messages: ['Department not found or already deleted'],
            });
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            messages: ['Department and related records deleted successfully'],
        });
    } catch (error) {
        await transaction.rollback();

        console.error('Error deleting department and related records:', error);
        return res.status(500).json({
            success: false,
            messages: ['Error deleting department and related records'],
        });
    }
};

export const getAssessmentByDepartmentId = async (req, res) => {
    const { departmentId } = req.params;

    try {
        // Find all assessments associated with the given department ID
        const assessments = await Assessment.findAll({
            where: { departmentId },
            include: [
                { model: Department, as: 'department', attributes: ['id', 'departmentName'] },
            ],
        });

        // If no assessments are found, return a 404 error response
        if (!assessments || assessments.length === 0) {
            return res.status(404).json({
                success: false,
                messages: ['No assessments found for the given department'],
            });
        }

        // Return the assessments with a success message
        res.status(200).json({
            success: true,
            messages: ['Assessments retrieved successfully'],
            assessments,
        });
    } catch (error) {
        // Log and return an error response in case of any issues
        console.error('Error fetching assessments:', error);
        res.status(500).json({ success: false, messages: ['Error fetching assessments'] });
    }
};

export const getUsersByDepartmentId = async (req, res) => {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Fetch users associated with the given department ID, including pagination
        const { count, rows: users } = await User.findAndCountAll({
            include: [
                {
                    model: Department,
                    as: 'departments',
                    attributes: ['id'],
                    through: {
                        attributes: []
                    },
                    // Filter by departmentId if provided
                    where: departmentId ? { id: departmentId } : {},
                },
            ],
            // Exclude sensitive information from the user attributes
            attributes: { exclude: ['password', 'deletedAt'] },
            // Apply pagination
            limit: parseInt(limit, 10),
            offset: (page - 1) * limit,
        });

        // If no users are found, return an empty response with pagination info
        if (count === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found'],
                users: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    itemsPerPage: limit
                },
            });
        }

        // Calculate total number of pages based on the limit
        const totalPages = Math.ceil(count / limit);

        // If the requested page exceeds total pages, return a 404 error
        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                messages: ['Page not found'],
            });
        }

        // Return the users with success message and pagination info
        res.status(200).json({
            success: true,
            messages: ['Users retrieved successfully'],
            users: users,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            },
        });
    } catch (error) {
        // Log and return an error response in case of any issues
        console.error('Error fetching users by department:', error);
        res.status(500).json({
            success: false,
            messages: ['Error fetching users'],
            error: error.message,
        });
    }
};