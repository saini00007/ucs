import { connectToDatabase, query } from '../db/db.js'; // Import your db connection functions
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing

const insertSuperAdmin = async () => {
  const superAdminData = {
    username: 'superAdmin', // replace with your desired username
    password: 'blabla', // replace with your desired password
    email: 'sarjeetsingh4680@gmail.com', // replace with your desired email
    role_id: 1, // Assuming 1 is the role ID for admin
    department_id: null, // Assuming no specific department for super admin
    company_id: null, // Assuming no specific company for super admin
  };

  // Hash the password
  const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

  // Prepare the insert query
  const insertQuery = `
    INSERT INTO users (username, password, email, role_id, department_id, company_id)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id;
  `;

  try {
    // Connect to the database
    await connectToDatabase();
    
    // Execute the insert query
    const res = await query(insertQuery, [
      superAdminData.username,
      hashedPassword,
      superAdminData.email,
      superAdminData.role_id,
      superAdminData.department_id,
      superAdminData.company_id,
    ]);

    // Log the user ID of the inserted super admin
    console.log('Super admin inserted with user ID:', res.rows[0].user_id);
  } catch (err) {
    console.error('Error inserting super admin:', err);
  } 
};

// Run the insert function
insertSuperAdmin();
