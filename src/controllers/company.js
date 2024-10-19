import { Company } from '../models/index.js';

export const createCompany = async (req, res) => {
  console.log('Creating company...');
  const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;
  const createdBy = req.user.userId;

  try {
    const newCompany = await Company.create({
      companyName,
      postalAddress,
      gstNumber,
      primaryEmail,
      secondaryEmail,
      primaryPhone,
      secondaryPhone,
      createdBy,
    });

    res.status(201).json({
      success: true,
      messages: ['Company created successfully!'],
      company: newCompany,
    });
    console.log("done!");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      messages: ['An error occurred while creating the company.'],
    });
  }
};

export const getAllCompanies = async (req, res) => {
  const { page = 1 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = 10;

  try {
    const { count, rows: companies } = await Company.findAndCountAll({
      attributes: ['companyId', 'companyName'],
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
    });

    const totalPages = Math.ceil(count / limitNumber);

    if (pageNumber > totalPages) {
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
        currentPage: pageNumber,
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
    const company = await Company.findOne({ where: { companyId } });

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

  try {
    const company = await Company.findOne({ where: { companyId } });

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
      where: { companyId },
    });

    if (!deleted) {
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
