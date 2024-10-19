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
    const { page = 1 } = req.query;

    try {
        const { count, rows: departments } = await Department.findAndCountAll({
            where: { companyId: companyId },
            limit: 10,
            offset: (page - 1) * 10,
        });

        const totalPages = Math.ceil(count / 10);

        if (page > totalPages) {
            return res.status(404).json({ success: false, messages: ['Page not found'] });
        }

        res.status(200).json({ success: true, departments, pagination: { totalItems: count, totalPages, currentPage: page } });
    } catch (error) {
        console.error('Error fetching departments for company:', error);
        res.status(500).json({ success: false, messages: ['Failed to fetch departments'] });
    }
};

export const getDepartmentById = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findOne({
            where: { departmentId: departmentId },
            include: [{ model: Company, attributes: ['companyName', 'companyId'] }],
        });

        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }

        res.status(200).json({ success: true, department });
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
            departmentName: departmentName,
            companyId: companyId,
            masterDepartmentId: masterDepartmentId,
            createdBy: req.user.userId,
        });

        const newAssessment = await Assessment.create({
            companyId: companyId,
            departmentId: newDepartment.departmentId,
        });

        const questions = await QuestionDepartmentLink.findAll({
            where: { masterDepartmentId: masterDepartmentId },
            include: [{ model: MasterQuestion, required: true }],
        });

        if (questions.length === 0) {
            console.warn('No questions found for the master department');
        }

        await Promise.all(questions.map(async (qdl) => {
            try {
                await AssessmentQuestion.create({
                    assessmentId: newAssessment.assessmentId,
                    questionId: qdl.questionId,
                });
                console.log(`Assessment question created for questionId: ${qdl.questionId}`);
            } catch (err) {
                console.error(`Failed to create assessment question for questionId: ${qdl.questionId}`, err);
            }
        }));

        res.status(201).json({ success: true, department: newDepartment, assessment: newAssessment });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, messages: ['Failed to create department'] });
    }
};

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
            department.masterDepartmentId = masterDepartmentId;
        }

        await department.save();

        res.status(200).json({ success: true, messages: ['Department updated successfully'], department });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, messages: ['Failed to update department'] });
    }
};

export const deleteDepartment = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found'] });
        }

        await department.destroy();

        res.status(200).json({ success: true, messages: ['Department deleted successfully'] });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, messages: ['Failed to delete department'] });
    }
};
