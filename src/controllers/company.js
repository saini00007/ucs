// controllers/companyController.js
import { Company } from '../models/index.js'; // Adjust the import based on your project structure

// Create Company
export const createCompany = async (req, res) => {
    console.log('Creating company...');
    const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;
    const createdBy = req.user.user_id;

    if (!companyName || !createdBy || !postalAddress || !primaryEmail || !primaryPhone) {
        return res.status(400).json({ success: false, error: 'Company name, postal address, primary email, and primary phone are required.' });
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
            success: true,
            message: 'Company created successfully!',
            company: newCompany,
        });
        console.log("done!");
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'An error occurred while creating the company.' });
    }
};

// Get All Companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json({ success: true, companies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching companies.' });
    }
};

// Get Company By ID
export const getCompanyById = async (req, res) => {
    const { companyId } = req.params;

    // Validate ID
    if (!companyId) {
        return res.status(400).json({ success: false, error: 'Company ID is required.' });
    }

    try {
        const company = await Company.findOne({ where: { company_id: companyId } });

        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found.' });
        }

        res.status(200).json({ success: true, company });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching the company.' });
    }
};

// Update Company
export const updateCompany = async (req, res) => {
    const { companyId } = req.params; // Get company ID from the request parameters
    const { companyName, postalAddress, gstNumber, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone } = req.body;

    // Validate ID
    if (!companyId) {
        return res.status(400).json({ success: false, error: 'Company ID is required.' });
    }

    try {
        const company = await Company.findOne({ where: { company_id: companyId } });

        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found.' });
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

        res.status(200).json({ success: true, message: 'Company updated successfully', company });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, message: 'Error updating company', error: error.message });
    }
};

// Delete Company
export const deleteCompany = async (req, res) => {
    const { companyId } = req.params; // Get company ID from the request parameters

    // Validate ID
    if (!companyId) {
        return res.status(400).json({ success: false, error: 'Company ID is required.' });
    }

    try {
        const deleted = await Company.destroy({
            where: { company_id: companyId },
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(204).json({ success: true, message: 'Company deleted successfully' }); // Respond with no content (204 status)
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, message: 'Error deleting company', error: error.message });
    }
};
