import { Company } from '../models/index.js';

export const createCompany = async (req, res) => {

  const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;
  try {
    const newCompany = await Company.create({
      companyName,
      postalAddress,
      gstNumber,
      primaryEmail,
      secondaryEmail,
      primaryPhone,
      secondaryPhone,
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
  const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;
  console.log('hello');
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

  try {
    const deleted = await Company.destroy({
      where: { id: companyId },
    });
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        messages: ['Company not found'],
      });
    }
    res.status(200).json({
      success: true,
      messages: ['Company deleted successfully'],
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      messages: ['Error deleting company'],
    });
  }
};
