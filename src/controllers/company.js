// controllers/companyController.js
import { Company } from '../models/index.js'; // Adjust the import based on your project structure

// Create Company
export const createCompany = async (req, res) => {
    console.log('Creating company...');
    const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;
    const createdBy = req.user.userId;

    if (!companyName || !createdBy || !postalAddress || !primaryEmail || !primaryPhone) {
        return res.status(400).json({ error: 'Company name, postal address, primary email, and primary phone are required.' });
    }

    try {
        const newCompany = await Company.create({
            company_name: companyName,
            postal_address: postalAddress,
            gst_number: gstNumber,
            primary_email: primaryEmail,
            secondary_email: secondaryEmail,
            primary_phone: primaryPhone,
            secondary_phone: secondaryPhone,
            created_by: createdBy
        });

        res.status(201).json({
            message: 'Company created successfully!',
            company: newCompany,
        });
        console.log("done!");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the company.' });
    }
};

// Get All Companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json(companies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching companies.' });
    }
};

// Get Company By ID
export const getCompanyById = async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!id) {
        return res.status(400).json({ error: 'Company ID is required.' });
    }

    try {
        const company = await Company.findOne({ where: { company_id: id } });

        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the company.' });
    }
};

// Update Company
export const updateCompany = async (req, res) => {
    const { id } = req.params; // Get company ID from the request parameters
    const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;

    // Validate ID
    if (!id) {
        return res.status(400).json({ error: 'Company ID is required.' });
    }

    try {
        const company = await Company.findOne({ where: { company_id: id } });

        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        // Update fields if provided
        if (companyName) company.company_name = companyName;
        if (postalAddress) company.postal_address = postalAddress;
        if (gstNumber) company.gst_number = gstNumber;
        if (primaryEmail) company.primary_email = primaryEmail;
        if (secondaryEmail) company.secondary_email = secondaryEmail;
        if (primaryPhone) company.primary_phone = primaryPhone;
        if (secondaryPhone) company.secondary_phone = secondaryPhone;

        // Save the updated company
        await company.save();

        res.status(200).json({ message: 'Company updated successfully', company });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ message: 'Error updating company', error: error.message });
    }
};

// Delete Company
export const deleteCompany = async (req, res) => {
    const { id } = req.params; // Get company ID from the request parameters

    // Validate ID
    if (!id) {
        return res.status(400).json({ error: 'Company ID is required.' });
    }

    try {
        const deleted = await Company.destroy({
            where: { company_id: id },
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.status(204).send(); // Respond with no content (204 status)
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ message: 'Error deleting company', error: error.message });
    }
};
