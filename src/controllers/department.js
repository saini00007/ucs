import {
    Department,
    Company,
    MasterDepartment,
    Assessment,
    AssessmentQuestion,
    MasterQuestion,
    QuestionDepartmentLink,
} from '../models/index.js';

export const getAllDepartmentsForCompany = async (req, res) => {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (req.user.roleId === "admin" && req.user.companyId !== companyId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Admins can only manage their own company.',
        });
    }
    try {
        const { count, rows: departments } = await Department.findAndCountAll({
            where: { companyId: companyId },
            limit: limit,
            offset: (page - 1) * limit,
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

        if (count === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No departments found'],
                departments: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    itemsPerPage: limit,
                },
            });
        }

        const totalPages = Math.ceil(count / limit);

        if (page > totalPages) {
            return res.status(404).json({ success: false, messages: ['Page not found'] });
        }

        res.status(200).json({
            success: true,
            departments: departments,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        console.error('Error fetching departments for company:', error);
        res.status(500).json({ success: false, messages: ['Failed to fetch departments'] });
    }
};

export const getDepartmentById = async (req, res) => {
    const { departmentId } = req.params;

    const userDepartmentId = req.user.departmentId;

    if (req.user.roleId !== 'admin' && req.user.roleId !== 'superadmin') {
        if (userDepartmentId !== departmentId) {
            return res.status(403).json({
                success: false,
                messages: ['Access denied: You do not have permission to view this department.'],
            });
        }
    }

    try {
        const department = await Department.findByPk(departmentId, {
            include: [
                {
                    model: Company,
                    as: 'company', // Specify the alias for Company
                    attributes: ['companyName']
                },
                {
                    model: MasterDepartment,
                    as: 'masterDepartment', // Specify the alias for MasterDepartment
                    attributes: ['departmentName']
                },
            ],
        });

        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }

        res.status(200).json({ success: true, department: department }); // Changed to lowercase
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ success: false, messages: ['Failed to fetch department'] });
    }
};

export const createDepartment = async (req, res) => {
    const { departmentName, masterDepartmentId, companyId } = req.body;

    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ success: false, messages: ['Invalid company ID'] });
        }

        const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId);
        if (!masterDepartment) {
            return res.status(400).json({ success: false, messages: ['Invalid master department ID'] });
        }

        const newDepartment = await Department.create({
            departmentName,
            companyId,
            masterDepartmentId,
            createdByUserId: req.user.id,
        });

        const newAssessment = await Assessment.create({
            departmentId: newDepartment.id,
        });

        const questions = await QuestionDepartmentLink.findAll({
            where: { masterDepartmentId },
            include: [{ model: MasterQuestion, as: 'masterQuestion', required: true }],
        });

        if (questions.length === 0) {
            console.warn('No questions found for the master department');
        }

        await Promise.all(questions.map(async (qdl) => {
            try {
                await AssessmentQuestion.create({
                    assessmentId: newAssessment.id,
                    masterQuestionId: qdl.masterQuestionId,
                });
                console.log(`Assessment question created for questionId: ${qdl.masterQuestionId}`);
            } catch (err) {
                console.error(`Failed to create assessment question for questionId: ${qdl.masterQuestionId}`, err);
            }
        }));

        const departmentWithAssociations = await Department.findByPk(newDepartment.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] }
            ]
        });
        res.status(201).json({
            success: true,
            department: departmentWithAssociations,
            assessment: newAssessment,
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, messages: ['Failed to create department'] });
    }
};

//done some changes
export const updateDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }
        if (departmentName) {
            department.departmentName = departmentName;
        }

        if (masterDepartmentId) {
            const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId);
            if (!masterDepartment) {
                return res.status(400).json({ success: false, messages: ['Invalid master department ID'] });
            }
            if (department.masterDepartmentId != masterDepartmentId) {

                const startedAssessments = await Assessment.findAll({
                    where: {
                        departmentId: departmentId,
                        assessmentStarted: true,
                    }
                });

                if (startedAssessments.length > 0) {
                    return res.status(400).json({
                        success: false,
                        messages: ['Could not update department because some assessments are in progress']
                    });
                }

            }
            department.masterDepartmentId = masterDepartmentId;
        }

        await department.save();

        const updatedDepartment = await Department.findByPk(department.id, {
            include: [
                { model: Company, as: 'company', attributes: ['companyName'] },
                { model: MasterDepartment, as: 'masterDepartment', attributes: ['departmentName'] }
            ]
        });

        res.status(200).json({
            success: true,
            messages: ['Department updated successfully'],
            department: updatedDepartment,
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({
            success: false,
            messages: ['Failed to update department'],
        });
    }
};

export const deleteDepartment = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const deleted = await Department.destroy({
            where: { id: departmentId }
        });
        if (deleted === 0) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }

        res.status(200).json({ success: true, messages: ['Department deleted successfully'] });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, messages: ['Failed to delete department'] });
    }
};
