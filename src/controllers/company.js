import { Company, Department, Assessment, AssessmentQuestion, Answer, Comment, EvidenceFile, User } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import UserDepartmentLink from '../models/UserDepartmentLink.js';

export const createCompany = async (req, res) => {
  const {
    companyName,
    postalAddress,
    gstNumber,
    primaryEmail,
    secondaryEmail,
    primaryPhone,
    secondaryPhone,
    primaryCountryCode,
    secondaryCountryCode,
    panNumber
  } = req.body;

  try {
    const newCompany = await Company.create({
      companyName,
      postalAddress,
      gstNumber,
      primaryEmail,
      secondaryEmail,
      primaryPhone,
      secondaryPhone,
      primaryCountryCode,
      secondaryCountryCode,
      panNumber,
      createdByUserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      messages: ['Company created successfully!'],
      company: newCompany,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while creating the company.'],
    });
  }
};

export const getAllCompanies = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  console.log(req.user);

  try {
    const { count, rows: companies } = await Company.findAndCountAll({
      limit: limit,
      offset: (page - 1) * limit,
    });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No companies found'],
        companies: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        messages: ['Page not found'],
      });
    }
    res.status(200).json({
      success: true,
      messages: ['Companies retrieved successfully'],
      companies,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while fetching companies.'],
    });
  }
};

export const getCompanyById = async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await Company.findByPk(companyId);
    console.log(company);
    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found.'],
      });
    }

    res.status(200).json({
      success: true,
      messages: ['Company retrieved successfully'],
      company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while fetching the company.'],
    });
  }
};

export const updateCompany = async (req, res) => {
  const { companyId } = req.params;
  const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone, primaryCountryCode, secondaryCountryCode, panNumber } = req.body;

  try {
    const company = await Company.findOne({ where: { id: companyId } });

    if (!company) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found.'],
      });
    }

    if (companyName) company.companyName = companyName;
    if (postalAddress) company.postalAddress = postalAddress;
    if (gstNumber) company.gstNumber = gstNumber;
    if (primaryEmail) company.primaryEmail = primaryEmail;
    if (secondaryEmail) company.secondaryEmail = secondaryEmail;
    if (primaryPhone) company.primaryPhone = primaryPhone;
    if (secondaryPhone) company.secondaryPhone = secondaryPhone;
    if (primaryCountryCode) company.primaryCountryCode = primaryCountryCode;
    if (secondaryCountryCode) company.secondaryCountryCode = secondaryCountryCode;
    if (panNumber) company.panNumber = panNumber;

    await company.save();

    res.status(200).json({
      success: true,
      messages: ['Company updated successfully'],
      company,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      messages: ['Error updating company'],
    });
  }
};


export const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  const transaction = await sequelize.transaction();

  try {
    const departments = await Department.findAll({
      where: { companyId },
      attributes: ['id'],
      transaction,
    });

    const departmentIds = departments.map(department => department.id);

    const assessments = await Assessment.findAll({
      where: { departmentId: { [Op.in]: departmentIds } },
      attributes: ['id'],
      transaction,
    });

    const assessmentIds = assessments.map(assessment => assessment.id);

    const assessmentQuestions = await AssessmentQuestion.findAll({
      where: { assessmentId: { [Op.in]: assessmentIds } },
      attributes: ['id'],
      transaction,
    });

    const assessmentQuestionIds = assessmentQuestions.map(q => q.id);

    const answers = await Answer.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

    const answerIds = answers.map(a => a.id);

    const evidenceFiles = await EvidenceFile.findAll({
      where: { answerId: { [Op.in]: answerIds } },
      attributes: ['id'],
      transaction,
    });

    const evidenceFileIds = evidenceFiles.map(e => e.id);

    const comments = await Comment.findAll({
      where: { assessmentQuestionId: { [Op.in]: assessmentQuestionIds } },
      attributes: ['id'],
      transaction,
    });

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
      where: { departmentId: { [Op.in]: departmentIds } },
      transaction,
    });

    await Department.destroy({
      where: { id: { [Op.in]: departmentIds } },
      transaction,
    });

    const companyDeleted = await Company.destroy({
      where: { id: companyId },
      transaction,
    });

    if (companyDeleted === 0) {
      throw new Error('Company not found or already deleted');
    }

    await User.destroy({
      where: { companyId },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      messages: ['Company and related records deleted successfully'],
    });
  } catch (error) {
    await transaction.rollback();

    console.error('Error deleting company and related records:', error);
    return res.status(500).json({
      success: false,
      messages: ['Error deleting company and related records'],
    });
  }
};









