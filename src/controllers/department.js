import {
    Department,
    Company,
    MasterDepartment,
    Assessment,
    AssessmentQuestion,
    MasterQuestion,
    QuestionDepartmentLink,
} from '../models/index.js'; // Import all models from the index file

// Get All Departments for a Company
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

// Get Department By ID
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

// Create Department
export const createDepartment = async (req, res) => {
    const { companyId } = req.params;
    const { departmentName, masterDepartmentId } = req.body;

    try {
        // Validate that companyId exists
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ success: false, error: 'Invalid company ID' });
        }

        // Validate that masterDepartmentId exists
        const masterDepartment = await MasterDepartment.findByPk(masterDepartmentId);
        if (!masterDepartment) {
            return res.status(400).json({ success: false, error: 'Invalid master department ID' });
        }

        // Create the new department
        const newDepartment = await Department.create({
            department_name: departmentName,
            company_id: companyId,
            master_department_id: masterDepartmentId,
            created_by: req.user.user_id
        });

        // Automatically create an assessment for the new department
        const newAssessment = await Assessment.create({
            company_id: companyId,
            department_id: newDepartment.department_id,
        });

        // Find questions linked to the master department
        const questions = await QuestionDepartmentLink.findAll({
            where: { master_department_id: masterDepartmentId },
            include: [{ model: MasterQuestion, required: true }],
        });

        // Check if questions were found
        if (questions.length === 0) {
            console.warn('No questions found for the master department');
        }

        // Insert filtered questions into assessment_questions
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

// Update Department
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

        await department.save(); // Save the updated department

        res.status(200).json({ success: true, message: 'Department updated successfully', department });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, error: 'Failed to update department' });
    }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }

        await department.destroy(); // Delete the department

        res.status(200).json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, error: 'Failed to delete department' });
    }
};
