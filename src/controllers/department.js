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

    try {
        const departments = await Department.findAll({
            where: { company_id: companyId },
        });
        res.status(200).json({ success: true, departments });
    } catch (error) {
        console.error('Error fetching departments for company:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch departments' });
    }
};

export const getDepartmentById = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findOne({
            where: { department_id: departmentId },
            include: [{ model: Company, attributes: ['company_name', 'company_id'] }],
        });

        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }

        res.status(200).json({ success: true, department });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch department' });
    }
};

export const createDepartment = async (req, res) => {
    const { companyId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ success: false, error: 'Invalid company ID' });
        }

        const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId);
        if (!masterDepartment) {
            return res.status(400).json({ success: false, error: 'Invalid master department ID' });
        }

        const newDepartment = await Department.create({
            department_name: departmentName,
            company_id: companyId,
            master_department_id: masterDepartmentId,
            created_by: req.user.user_id
        });

        const newAssessment = await Assessment.create({
            company_id: companyId,
            department_id: newDepartment.department_id,
        });

        const questions = await QuestionDepartmentLink.findAll({
            where: { master_department_id: masterDepartmentId },
            include: [{ model: MasterQuestion, required: true }],
        });

        if (questions.length === 0) {
            console.warn('No questions found for the master department');
        }

        await Promise.all(questions.map(async (qdl) => {
            try {
                await AssessmentQuestion.create({
                    assessment_id: newAssessment.assessment_id,
                    question_id: qdl.question_id,
                });
                console.log(`Assessment question created for question_id: ${qdl.question_id}`);
            } catch (err) {
                console.error(`Failed to create assessment question for question_id: ${qdl.question_id}`, err);
            }
        }));

        res.status(201).json({ success: true, department: newDepartment, assessment: newAssessment });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, error: 'Failed to create department' });
    }
};

export const updateDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }

        if (departmentName) {
            department.department_name = departmentName;
        }

        if (masterDepartmentId) {
            const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId);
            if (!masterDepartment) {
                return res.status(400).json({ success: false, error: 'Invalid master department ID' });
            }
            department.master_department_id = masterDepartmentId;
        }

        await department.save();

        res.status(200).json({ success: true, message: 'Department updated successfully', department });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, error: 'Failed to update department' });
    }
};

export const deleteDepartment = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }

        await department.destroy();

        res.status(200).json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, error: 'Failed to delete department' });
    }
};
