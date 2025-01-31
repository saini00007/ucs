import { 
    EvidenceFile, 
    Answer, 
    AssessmentQuestion, 
    Assessment,
    Department,
    SubAssessment,
    SubDepartment 
} from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkEvidenceFileAccess = async (user, resourceId) => {
    try {
        // Step 1: Fetch evidence file and answer
        const evidenceFile = await EvidenceFile.findByPk(resourceId, {
            include: [{
                model: Answer,
                as: 'answer',
                attributes: ['id', 'assessmentQuestionId']
            }]
        });

        if (!evidenceFile) {
            throw new AppError('EvidenceFile not found', 404);
        }

        // Step 2: Fetch assessment question and sub-assessment
        const assessmentQuestion = await AssessmentQuestion.findByPk(
            evidenceFile.answer.assessmentQuestionId,
            {
                include: [{
                    model: SubAssessment,
                    as: 'subAssessment',
                    attributes: [
                        'id',
                        'subAssessmentStarted',
                        'submitted',
                        'subDepartmentId',
                        'assessmentId'
                    ]
                }]
            }
        );

        // Step 3: Fetch sub-department and department details
        const subDepartment = await SubDepartment.findByPk(
            assessmentQuestion.subAssessment.subDepartmentId,
            {
                include: [{
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'companyId']
                }]
            }
        );

        // Step 4: Fetch assessment details
        const assessment = await Assessment.findByPk(
            assessmentQuestion.subAssessment.assessmentId,
            {
                attributes: ['assessmentStarted', 'submitted', 'departmentId']
            }
        );

        // Access validation
        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId, subDepartmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient access scope', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessment);
        if (!assessmentState.success) {
            throw new AppError(
                assessmentState.message || 'Invalid assessment state',
                assessmentState.status || 400
            );
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        throw error;
    }
};

export default checkEvidenceFileAccess;