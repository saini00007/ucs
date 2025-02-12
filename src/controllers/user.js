import { User, Department, Company, UserDepartmentLink, SubDepartment, UserSubDepartmentLink, SubAssessment, AssessmentQuestion, Answer } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import sendEmail from '../utils/mailer.js';
import generateToken from '../utils/token.js';
import bcrypt from 'bcrypt';
import AppError from '../utils/AppError.js';
import { validateAdminAssignment, validateRoleAssignment, validateEmailForUser } from '../utils/userUtils.js'
import { ROLE_IDS, SUB_ASSESSMENT_TYPE } from '../utils/constants.js';
import { calculateSubAssessmentStats } from '../utils/subAssessmentUtils.js';

const createUser = async (userData, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const password = "root@7ji"; // Default password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Destructure and prepare user data
        const { departments, ...trimmedUserData } = userData;

        // Create user
        const user = await User.create({
            ...trimmedUserData,
            password: hashedPassword,
        }, { transaction });

        // Handle departments if present
        if (departments?.length > 0) {
            await UserDepartmentLink.bulkCreate(
                departments.map(dept => ({
                    userId: user.id,
                    departmentId: dept.id
                })),
                { transaction }
            );

            // Handle subdepartments
            const subDeptLinks = departments.flatMap(dept =>
                (dept.subDepartments || []).map(subId => ({
                    userId: user.id,
                    subDepartmentId: subId
                }))
            );
            console.log(subDeptLinks);

            if (subDeptLinks.length > 0) {
                await UserSubDepartmentLink.bulkCreate(subDeptLinks, { transaction });
            }
        }


        // Fetch created user with associations
        const userWithDepartments = await User.findOne({
            where: { id: user.id },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] }
            },
            {
                model: SubDepartment,
                as: 'subDepartments',
                through: { attributes: [] }
            }],
            transaction
        });

        // Generate password reset token and send email
        const token = generateToken(user.id, 'reset-password');
        const resetLink = `http://localhost:3000/set-password?token=${token}`;

        await sendEmail(
            userData.email,
            'Set Your Password',
            `Hi ${userData.firstName},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`
        );

        await transaction.commit();

        return res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithDepartments
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const addUser = async (req, res, next) => {
    const { firstName, middleName, lastName, roleId, phoneNumber, email, departments, companyId, countryCode } = req.body;
    const currentUser = req.user;
    const password = "root@7ji";
    console.log(req.body)

    try {
        // Since validation functions now throw AppError, we don't need to check isValid
        await validateEmailForUser(email, null, roleId, companyId);
        await validateRoleAssignment(currentUser, roleId);
        const userData = {
            firstName,
            middleName,
            lastName,
            password,
            email,
            roleId,
            companyId,
            phoneNumber,
            countryCode
        };

        if (roleId === ROLE_IDS.ADMIN) {
            await validateAdminAssignment(companyId);
            // For admin role, create user with provided company
            await createUser(userData, res, next);
        } else if (roleId === ROLE_IDS.LEADERSHIP) {
            await createUser(userData, res, next);
        }
        else {

            if (!departments || departments.length === 0) {
                throw new AppError('Departments are required for this role', 400);
            }
            const existingDepts = await Department.findAll({
                where: { id: departments.map(d => d.id) }
            });

            if (existingDepts.length !== departments.length) {
                throw new AppError('One or more departments not found', 404);
            }

            if (!userData.companyId) {
                userData.companyId = existingDepts[0].companyId;
            }
            await createUser({ ...userData, departments }, res, next);
        }

    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    const { userId } = req.params;
    const {
        firstName,
        middleName,
        lastName,
        email,
        roleId,
        phoneNumber,
        departments,
        countryCode
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
        // Find user with current departments and subdepartments
        const user = await User.findOne({
            where: { id: userId },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] }
                },
                {
                    model: SubDepartment,
                    as: 'subDepartments',
                    through: { attributes: [] }
                }
            ],
            transaction
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Email validation if email is being updated
        if (email && email !== user.email) {
            await validateEmailForUser(email, userId, roleId || user.roleId, user.companyId);
        }

        // Role validation if role is being updated
        await validateRoleAssignment(req.user, roleId, user.roleId);

        // Update user basic fields
        const updateFields = {
            ...(firstName && { firstName }),
            ...(middleName && { middleName }),
            ...(lastName && { lastName }),
            ...(email && { email }),
            ...(phoneNumber && { phoneNumber }),
            ...(roleId && { roleId }),
            ...(countryCode && { countryCode })
        };

        await user.update(updateFields, { transaction });

        // Handle department updates if provided
        if (departments) {
            // Get current department and subdepartment IDs
            const currentDeptIds = user.departments.map(d => d.id);
            const currentSubDeptIds = user.subDepartments.map(sd => sd.id);

            // Calculate departments to add and remove
            const newDeptIds = departments.map(d => d.id);
            const deptsToAdd = newDeptIds.filter(id => !currentDeptIds.includes(id));
            const deptsToRemove = currentDeptIds.filter(id => !newDeptIds.includes(id));

            // Calculate subdepartments to add and remove
            const newSubDeptIds = departments.flatMap(dept => dept.subDepartments || []);
            const subDeptsToAdd = newSubDeptIds.filter(id => !currentSubDeptIds.includes(id));

            // Remove all subdepartments of removed departments and any subdepartments not in new list
            const remainingDepts = departments.filter(d => !deptsToRemove.includes(d.id));
            const validSubDeptIds = remainingDepts.flatMap(dept => dept.subDepartments || []);
            const subDeptsToRemove = currentSubDeptIds.filter(id => !validSubDeptIds.includes(id));

            // Remove old department links
            if (deptsToRemove.length > 0) {
                await UserDepartmentLink.destroy({
                    where: {
                        userId,
                        departmentId: deptsToRemove
                    },
                    transaction
                });
            }

            // Remove old subdepartment links
            if (subDeptsToRemove.length > 0) {
                await UserSubDepartmentLink.destroy({
                    where: {
                        userId,
                        subDepartmentId: subDeptsToRemove
                    },
                    transaction
                });
            }

            // Add new department links
            if (deptsToAdd.length > 0) {
                await UserDepartmentLink.bulkCreate(
                    deptsToAdd.map(deptId => ({
                        userId,
                        departmentId: deptId
                    })),
                    { transaction }
                );
            }

            // Add new subdepartment links
            if (subDeptsToAdd.length > 0) {
                await UserSubDepartmentLink.bulkCreate(
                    subDeptsToAdd.map(subDeptId => ({
                        userId,
                        subDepartmentId: subDeptId
                    })),
                    { transaction }
                );
            }
        }

        // Fetch updated user with all associations
        const updatedUser = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] }
            },
            {
                model: SubDepartment,
                as: 'subDepartments',
                through: { attributes: [] }
            }],
            transaction
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: updatedUser
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const requestingUserRoleId = req.user.roleId;
    const transaction = await sequelize.transaction();

    try {
        // Fetch the user to be deleted
        const userToDelete = await User.findByPk(userId);

        if (!userToDelete) {
            throw new AppError('User not found', 404);
        }

        const userToDeleteRoleId = userToDelete.roleId;

        // Check if the requesting user has the right to delete the target user
        const canDelete =
            (requestingUserRoleId === ROLE_IDS.SUPER_ADMIN) ||
            (requestingUserRoleId === ROLE_IDS.ADMIN && [ROLE_IDS.DEPARTMENT_MANAGER, ROLE_IDS.LEADERSHIP, ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(userToDeleteRoleId)) ||
            (requestingUserRoleId === ROLE_IDS.LEADERSHIP && [ROLE_IDS.DEPARTMENT_MANAGER, ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(userToDeleteRoleId)) ||
            (requestingUserRoleId === ROLE_IDS.DEPARTMENT_MANAGER && [ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(userToDeleteRoleId));

        if (!canDelete) {
            throw new AppError('Unauthorized to delete this user', 403);
        }

        // Delete UserDepartmentLink records associated with the user
        await UserDepartmentLink.destroy({
            where: { userId },
            transaction
        });

        // Delete the user record
        await User.destroy({
            where: { id: userId },
            transaction
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['User deleted successfully']
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Fetch user by primary key and include related departments
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: { attributes: [] },
            }]
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        next(error);
    }
};

export const addUserToDepartment = async (req, res, next) => {
    try {
        const { userId, departmentId } = req.params;

        const department = await Department.findByPk(departmentId);
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        const user = await User.findOne({
            where: {
                id: userId,
                companyId: department.companyId
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (![ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Check for existing link (including soft-deleted)
        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId },
            paranoid: false
        });

        if (existingLink) {
            // If link exists and not soft-deleted
            if (existingLink.deletedAt === null) {
                throw new AppError('User is already associated with this department', 409);
            }

            // Restore soft-deleted link
            await existingLink.restore();

            const updatedUser = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'deletedAt'] },
                include: [{
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }]
            });

            return res.status(200).json({
                success: true,
                messages: ['User re-associated with department successfully'],
                user: updatedUser
            });
        }

        // Create new association
        await UserDepartmentLink.create({ userId, departmentId });

        // Fetch updated user data
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] },
                attributes: ['id'],
            }]
        });

        res.status(200).json({
            success: true,
            messages: ['User added to department successfully'],
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

export const removeUserFromDepartment = async (req, res, next) => {
    try {
        const { userId, departmentId } = req.params;

        // Check if there is an existing link between the user and department
        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        if (!userDepartmentLink) {
            throw new AppError('User is not associated with this department', 404);
        }

        // Fetch the user to check their role
        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if the user has a valid role
        if (![ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Remove the user from the department
        await userDepartmentLink.destroy();

        res.status(200).json({
            success: true,
            messages: ['User removed from department successfully']
        });

    } catch (error) {
        next(error);
    }
};

export const getDepartmentsByUserId = async (req, res, next) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id', 'departmentName'],
                through: {
                    attributes: []
                }
            }]
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Return response
        res.status(200).json({
            success: true,
            messages: user.departments.length === 0
                ? ['No departments found for the user']
                : ['Departments retrieved successfully'],
            departments: user.departments
        });

    } catch (error) {
        console.error('Error fetching departments for user:', error);
        next(error);
    }
};

export const addUserToSubDepartment = async (req, res, next) => {
    try {
        const { userId, subDepartmentId } = req.params;
        console.log(subDepartmentId);
        // Find the subdepartment and its parent department
        const subDepartment = await SubDepartment.findByPk(subDepartmentId, {
            include: [{
                model: Department,
                as: 'department',
                attributes: ['companyId']
            }]
        });

        if (!subDepartment) {
            throw new AppError('SubDepartment not found', 404);
        }

        // Find user with company check
        const user = await User.findOne({
            where: {
                id: userId,
                companyId: subDepartment.department.companyId
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (![ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Check for existing link (including soft-deleted)
        const existingLink = await UserSubDepartmentLink.findOne({
            where: { userId, subDepartmentId },
            paranoid: false
        });

        if (existingLink) {
            // If link exists and not soft-deleted
            if (existingLink.deletedAt === null) {
                throw new AppError('User is already associated with this subdepartment', 409);
            }

            // Restore soft-deleted link
            await existingLink.restore();

            const updatedUser = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'deletedAt'] },
                include: [{
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                    include: [{
                        model: SubDepartment,
                        as: 'subDepartments',
                        attributes: ['id'],
                        include: [{
                            model: User,
                            as: 'users',
                            attributes: [],
                            where: { id: userId }
                        }]
                    },]
                }]
            });

            return res.status(200).json({
                success: true,
                messages: ['User re-associated with subdepartment successfully'],
                user: updatedUser
            });
        }

        // Create new association
        await UserSubDepartmentLink.create({ userId, subDepartmentId });

        // Fetch updated user data
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: SubDepartment,
                as: 'subDepartments',
                through: { attributes: [] },
                attributes: ['id'],
            },
            {
                model: Department,
                as: 'departments',
                through: { attributes: [] },
                attributes: ['id'],
            }
            ]
        });
        res.status(200).json({
            success: true,
            messages: ['User added to subdepartment successfully'],
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

export const removeUserFromSubDepartment = async (req, res, next) => {
    try {
        const { userId, subDepartmentId } = req.params;

        // Check if there is an existing link between the user and subdepartment
        const userSubDepartmentLink = await UserSubDepartmentLink.findOne({
            where: { userId, subDepartmentId }
        });

        if (!userSubDepartmentLink) {
            throw new AppError('User is not associated with this subdepartment', 404);
        }

        // Fetch the user to check their role
        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if the user has a valid role
        if (![ROLE_IDS.ASSESSOR, ROLE_IDS.REVIEWER].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Remove the user from the subdepartment
        await userSubDepartmentLink.destroy();



        res.status(200).json({
            success: true,
            messages: ['User removed from subdepartment successfully']
        });
    } catch (error) {
        next(error);
    }
};


export const getSubAssessmentByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const assessments = await SubAssessment.findAll({
            where: {
                subAssessmentType: SUB_ASSESSMENT_TYPE.DEFAULT
            },
            include: [
                {
                    model: AssessmentQuestion,
                    as: 'questions',
                    attributes: ['id'],
                    include: [{
                        model: Answer,
                        as: 'answer',
                        attributes: ['answerText', 'reviewStatus', 'revisionStatus']
                    }]
                },
                {
                    model: SubDepartment,
                    as: 'subDepartment',
                    attributes: ['id', 'subDepartmentName'],
                    required: true,
                    include: [
                        {
                            model: User,
                            as: 'users',
                            where: { id: userId },
                            attributes: [],
                            through: { attributes: [] }
                        },
                        {
                            model: Department,
                            as: 'department',
                            attributes: ['id', 'departmentName']
                        }
                    ]
                }
            ]
        });

        const formattedAssessments = assessments.map(assessment => {
            const raw = assessment.get();
            const stats = calculateSubAssessmentStats(assessment);
            delete raw.questions;

            return {
                ...raw,
                stats
            };
        });

        return res.json({
            success: true,
            subAssessments: formattedAssessments
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getSubAssessmentStats = async (req, res) => {
    try {
        const { subAssessmentId } = req.params;

        // Fetch the sub-assessment with its questions and answers
        const subAssessment = await SubAssessment.findOne({
            where: { id: subAssessmentId },
            include: [
                {
                    model: AssessmentQuestion,
                    as: 'questions',
                    attributes: ['id'],
                    include: [{
                        model: Answer,
                        as: 'answer',
                        attributes: [
                            'answerText',
                            'reviewStatus',
                            'revisionStatus',
                            'finalReview',  // Added this field
                            'id'           // Also adding id for better tracking
                        ]
                    }]
                }
            ]
        });

        if (!subAssessment) {
            return res.status(404).json({
                success: false,
                message: 'Sub-assessment not found'
            });
        }

        // Calculate stats using the existing calculateSubAssessmentStats function
        const stats = calculateSubAssessmentStats(subAssessment);

        return res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching sub-assessment stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

