import { User, Department, Company, UserDepartmentLink } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import sendEmail from '../utils/mailer.js';
import generateToken from '../utils/token.js';
import bcrypt from 'bcrypt';


export const addUser = async (req, res) => {
    const { username, email, roleId, phoneNumber, departmentId, companyId, countryCode } = req.body;
    const currentUser = req.user; // Current user making the request
    const password = "root"; // Default password

    try {
        // Check if email already exists (including soft-deleted users)
        const existingUser = await User.findOne({
            where: { email },
            paranoid: false
        });

        if (existingUser) {
            return res.status(409).json({ success: false, messages: ['Email already in use'] });
        }

        // Ensure 'superadmin' cannot be assigned here
        if (roleId === 'superadmin') {
            return res.status(422).json({ success: false, messages: ['Invalid roleId'] });
        }

        // Admin users cannot assign another admin role
        if (currentUser.roleId === 'admin' && (roleId === 'admin')) {
            return res.status(403).json({ success: false, messages: ['Admin cannot add admin'] });
        }

        // Department managers cannot assign admin or department manager roles
        if (currentUser.roleId === 'departmentmanager' && ['admin', 'departmentmanager'].includes(roleId)) {
            return res.status(403).json({ success: false, messages: ['Department Manager cannot add admin, or department manager'] });
        }

        // Additional checks for admin role
        if (roleId === 'admin') {
            const company = await Company.findOne({ where: { id: companyId } });
            if (!company) {
                return res.status(404).json({ success: false, messages: ['Company not found.'] });
            }

            // Ensure the company allows only two admins
            const existingAdmins = await User.findAll({ where: { companyId, roleId: 'admin' } });
            if (existingAdmins.length >= 2) {
                return res.status(422).json({ success: false, messages: ['Only two admins are allowed for this company.'] });
            }

            // Validate the admin's email matches the company admin emails
            if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                return res.status(403).json({ success: false, messages: ['Invalid email for admin role.'] });
            }
        }

        // For non-admin roles, check department and company email restrictions
        if (roleId !== 'admin') {
            const department = await Department.findOne({ where: { id: departmentId } });
            if (!department) {
                return res.status(404).json({ success: false, messages: ['Department not found.'] });
            }

            const company = await Company.findOne({ where: { id: department.companyId } });
            if (!company) {
                return res.status(404).json({ success: false, messages: ['Company associated with department not found.'] });
            }

            // Check if the email exists in any company (both primaryEmail and secondaryEmail)
            const existingCompanyEmail = await Company.findOne({
                where: {
                    [Op.or]: [
                        { primaryEmail: email },
                        { secondaryEmail: email }
                    ]
                }, paranoid: false
            });

            if (existingCompanyEmail) {
                return res.status(403).json({ success: false, messages: ['Email is already in use by a company.'] });
            }

            // Ensure user's email doesn't match the company admin emails
            if (currentUser.roleId !== 'admin' && [company.primaryEmail, company.secondaryEmail].includes(email)) {
                return res.status(403).json({ success: false, messages: ['Email cannot match the company admin emails.'] });
            }

            // Proceed with user creation for non-admin roles
            return await createUser({
                username,
                password,
                email,
                roleId,
                departmentId,
                companyId: department.companyId,
                phoneNumber,
                countryCode
            }, res);
        }
        // For admin role, create user with companyId
        return await createUser({
            username,
            password,
            email,
            roleId,
            companyId,
            phoneNumber,
            countryCode
        }, res);

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};

const createUser = async (userData, res) => {
    try {
        // Hash the user's password with bcrypt before storing it
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { departmentId, ...trimmedUserData } = userData;

        // Create a new user with the provided data and hashed password
        const user = await User.create({
            ...trimmedUserData,
            password: hashedPassword,
        });

        // If a departmentId is provided, associate the user with the department
        if (departmentId) {
            await UserDepartmentLink.create({ userId: user.id, departmentId });
        }

        // Fetch the user along with their associated departments, excluding sensitive data
        const userWithDepartments = await User.findOne({
            where: { id: user.id },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
                {
                    model: Department,
                    as: 'departments', // Alias for the association
                    through: { attributes: [] }, // Exclude join table attributes
                    attributes: ['id'], // Only include department IDs
                }
            ]
        });

        // Generate a reset password token for the user
        const token = generateToken(user.id, 'reset-password');
        const resetLink = `http://localhost:3000/set-password?token=${token}`;

        // Email subject and content for setting the password
        const emailSubject = 'Set Your Password';
        const emailText = `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`;

        // Send the email with the reset password link
        await sendEmail(userData.email, emailSubject, emailText);

        // Respond with a success message and the user with their departments
        res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithDepartments
        });
    } catch (error) {
        // Catch any errors and respond with a failure message
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Error adding user'], error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, email, roleId, phoneNumber } = req.body;

    try {
        // Find the user by ID
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            // If the user doesn't exist, return a 404 response
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Check if the email is being updated

        if (email && email !== user.email) {
            // If the email is being updated, check if it's already in use by another user
            const existingUser = await User.findOne({
                where: { email },
                paranoid: false
            });

            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ success: false, messages: ['Email is already in use by another user.'] });
            }

            // Get the company associated with the user
            const companyId = user.companyId;
            const company = await Company.findOne({ where: { id: companyId } });
            if (!company) {
                return res.status(404).json({ success: false, messages: ['Company not found.'] });
            }

            if (roleId === 'admin') {
                // For admin roles, email must match the company's primary or secondary email
                if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                    return res.status(400).json({ success: false, messages: ['Admin email must match one of the company admin emails.'] });
                }
            } else {
                // For non-admin roles, email must not match the company's primary or secondary email
                if ([company.primaryEmail, company.secondaryEmail].includes(email)) {
                    return res.status(400).json({ success: false, messages: ['Email cannot match the company admin emails.'] });
                }

                // Check if the email exists in any company (both primaryEmail and secondaryEmail)
                const existingCompanyEmail = await Company.findOne({
                    where: {
                        [Op.or]: [
                            { primaryEmail: email },
                            { secondaryEmail: email }
                        ]
                    }, paranoid: false
                });

                if (existingCompanyEmail) {
                    return res.status(403).json({ success: false, messages: ['Email is already in use by a company.'] });
                }
            }
        }

        // Check if role assignments are valid
        if (roleId) {
            if (roleId === 'superadmin') {
                return res.status(400).json({ success: false, messages: ['Cannot assign superadmin role.'] });
            }

            if (roleId === 'admin' && user.roleId !== 'admin') {
                return res.status(400).json({ success: false, messages: ['Cannot assign admin role to this user.'] });
            }

            if (user.roleId === 'admin' && roleId !== 'admin') {
                return res.status(400).json({ success: false, messages: ['Cannot change admin role.'] });
            }

            // Prevent assigning departmentmanager role to users who are not currently department managers
            if (roleId === 'departmentmanager' && user.roleId !== 'departmentmanager') {
                return res.status(400).json({ success: false, messages: ['Cannot assign departmentmanager role.'] });
            }

            // Prevent changing role if the user is already a departmentmanager
            if (user.roleId === 'departmentmanager' && roleId !== 'departmentmanager') {
                return res.status(400).json({ success: false, messages: ['Cannot change departmentmanager role.'] });
            }
        }

        // Update user details if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (roleId) user.roleId = roleId;

        // Save the updated user information to the database
        await user.save();

        // Fetch the updated user details, excluding password and deletedAt fields
        const updatedUser = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }
            ]
        });

        // Return the updated user data
        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: updatedUser
        });
    } catch (error) {
        // Log the error and return a 500 response if an unexpected error occurs
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, messages: ['Error updating user'], error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const requestingUserRoleId = req.user.roleId;

    const transaction = await sequelize.transaction();

    try {
        // Fetch the user to be deleted
        const userToDelete = await User.findByPk(userId);

        if (!userToDelete) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        const userToDeleteRoleId = userToDelete.roleId;

        // Check if the requesting user has the right to delete the target user
        const canDelete =
            (requestingUserRoleId === 'superadmin') ||
            (requestingUserRoleId === 'admin' && ['departmentmanager', 'assessor', 'reviewer'].includes(userToDeleteRoleId)) ||
            (requestingUserRoleId === 'departmentmanager' && ['assessor', 'reviewer'].includes(userToDeleteRoleId));

        if (!canDelete) {
            return res.status(403).json({ success: false, messages: ['Unauthorized to delete this user'] });
        }

        // Delete UserDepartmentLink records associated with the user
        await UserDepartmentLink.destroy({
            where: { userId },
            transaction
        });

        // Delete the user record
        const deleted = await User.destroy({ where: { id: userId }, transaction });

        if (!deleted) {
            await transaction.rollback();
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Commit the transaction if all deletions succeeded
        await transaction.commit();
        res.status(200).json({ success: true, messages: ['User deleted successfully'] });
    } catch (error) {
        // Rollback the transaction in case of any error
        await transaction.rollback();
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, messages: ['Error deleting user'] });
    }
};

export const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch user by primary key and include related departments
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] }, // Exclude sensitive data
            include: [{
                model: Department, // Include the associated departments
                as: 'departments',
                attributes: ['id'], // Only return department IDs
                through: { attributes: [] }, // Exclude join table attributes
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Return user data
        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};

export const addUserToDepartment = async (req, res) => {
    const { userId, departmentId } = req.params;

    try {
        // Fetch the user and department by their IDs
        const user = await User.findByPk(userId);
        const department = await Department.findByPk(departmentId);

        // If either the user or department is not found, return 404
        if (!user || !department) {
            return res.status(404).json({
                success: false,
                messages: ['User or department not found']
            });
        }

        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        // Check if the user belongs to the same company as the department
        if (user.companyId !== department.companyId) {
            return res.status(400).json({
                success: false,
                messages: ['User does not belong to the same company as the department']
            });
        }

        // Check if the user is already linked to the department (even soft-deleted links)
        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId },
            paranoid: false // Include soft-deleted records
        });

        if (existingLink) {
            // If the link exists and is not soft-deleted, return a conflict response
            if (existingLink.deletedAt === null) {
                return res.status(409).json({
                    success: false,
                    messages: ['User is already associated with this department']
                });
            } else {
                // Restore the soft-deleted link if it exists
                await existingLink.restore();

                // Fetch the updated user with department association
                const updatedUser = await User.findByPk(userId, {
                    attributes: { exclude: ['password', 'deletedAt'] },
                    include: [
                        {
                            model: Department,
                            as: 'departments',
                            through: { attributes: [] },
                            attributes: ['id'],
                        }
                    ]
                });

                return res.status(200).json({
                    success: true,
                    messages: ['User re-associated with department successfully'],
                    user: updatedUser
                });
            }
        }

        // If no existing link, create a new user-department association
        await UserDepartmentLink.create({ userId, departmentId });

        // Fetch the updated user data after association
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
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
            messages: ['User added to department successfully'],
            user: updatedUser
        });
    } catch (error) {
        // Handle unexpected errors and log them
        console.error('Error adding user to department:', error);
        res.status(500).json({
            success: false,
            messages: ['Server error'],
            error: error.message
        });
    }
};

export const removeUserFromDepartment = async (req, res) => {
    const { userId, departmentId } = req.params;

    try {
        // Check if there is an existing link between the user and department
        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        // If no such link exists, return a 404 response
        if (!userDepartmentLink) {
            return res.status(404).json({
                success: false,
                messages: ['User is not associated with this department']
            });
        }

        // Fetch the user to check their role
        const user = await User.findByPk(userId);

        // If user not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false,
                messages: ['User not found']
            });
        }

        // Check if the user has a valid role (either assessor or reviewer)
        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        // If everything is valid, remove the user from the department by destroying the link
        await userDepartmentLink.destroy();

        // Return a success response
        res.status(200).json({
            success: true,
            messages: ['User removed from department successfully']
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error removing user from department:', error);
        res.status(500).json({
            success: false,
            messages: ['Server error'],
            error: error.message
        });
    }
};

export const getDepartmentsByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch the user along with their associated departments
        const user = await User.findByPk(userId, {
            include: [{
                model: Department, // Include the departments associated with the user
                as: 'departments',
                attributes: ['id', 'departmentName'],
                through: {
                    attributes: [] // Exclude the join table attributes (no need to include them)
                }
            }]
        });

        // If no user is found, return a 404 response
        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Return the user and their associated departments
        res.status(200).json({
            success: true,
            userId: user.id,
            departments: user.departments
        });

    } catch (error) {
        // Catch any errors that occur during the process
        console.error('Error fetching user departments:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
