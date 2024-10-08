import { query } from '../db/db.js';

const initializeDatabase = async () => {
  try {
    // Create Master Departments Table
    await query(`
      CREATE TABLE IF NOT EXISTS master_departments (
        department_id SERIAL PRIMARY KEY,
        department_name TEXT NOT NULL UNIQUE
      )
    `);

    // Insert initial master departments related to cybersecurity if they don't exist
    const departments = [
      'Security Operations Center (SOC)',
      'Incident Response Team',
      'Compliance and Risk Management',
      'Network Security',
      'Application Security',
      'Threat Intelligence',
      'Cybersecurity Training and Awareness',
    ];

    for (const department of departments) {
      await query(`
        INSERT INTO master_departments (department_name)
        SELECT $1
        WHERE NOT EXISTS (SELECT 1 FROM master_departments WHERE department_name = $1)
      `, [department]);
    }

    // Create Roles Table
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id SERIAL PRIMARY KEY,
        role_name TEXT NOT NULL UNIQUE
      )
    `);

    // Insert initial roles if they don't exist
    const roles = [
      'superadmin',
      'admin',
      'department_manager',
      'assessor',
      'reviewer',
      'report_viewer',
      'guest_user'
    ];

    for (const role of roles) {
      await query(`
        INSERT INTO roles (role_name)
        SELECT $1
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = $1)
      `, [role]);
    }

    // Create Companies Table
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        created_by INTEGER -- Track who created the company (reference added later)
      )
    `);

    // Create Departments Table without created_by reference initially
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        department_id SERIAL PRIMARY KEY,
        department_name TEXT NOT NULL,
        company_id INTEGER REFERENCES companies(company_id) ON DELETE CASCADE, -- Foreign key to link with companies
        master_department_id INTEGER REFERENCES master_departments(department_id), -- Link to master departments
        created_by INTEGER -- Track who created the department (reference added later)
      )
    `);

    // Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        role_id INTEGER REFERENCES roles(role_id),
        department_id INTEGER REFERENCES departments(department_id) ON DELETE CASCADE, -- Add foreign key reference with ON DELETE CASCADE
        company_id INTEGER REFERENCES companies(company_id) ON DELETE CASCADE -- Add foreign key reference with ON DELETE CASCADE
      )
    `);

    // Add proper references for department_id and company_id only if they do not exist
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_type='FOREIGN KEY' 
          AND table_name='users' 
          AND constraint_name='fk_department'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_type='FOREIGN KEY' 
          AND table_name='users' 
          AND constraint_name='fk_company'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create Master Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS master_questions (
        question_id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        framework TEXT
      )
    `);

    // Create question_department_links junction table
    await query(`
      CREATE TABLE IF NOT EXISTS question_department_links (
        question_id INT REFERENCES master_questions(question_id) ON DELETE CASCADE,
        master_department_id INT REFERENCES master_departments(department_id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, master_department_id)
      )
    `);

    // Create Templates Table
    await query(`
      CREATE TABLE IF NOT EXISTS templates (
        template_id SERIAL PRIMARY KEY,
        template_name TEXT NOT NULL,
        master_department_id INTEGER REFERENCES master_departments(department_id), -- Link to master departments
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Template Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS template_questions (
        template_question_id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES templates(template_id),
        question_id INTEGER REFERENCES master_questions(question_id) -- Reference to master questions
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS department_templates (
        department_template_id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(department_id) ON DELETE CASCADE,
        template_id INTEGER REFERENCES templates(template_id) ON DELETE CASCADE
      )
    `);

    // Create Assessments Table
    await query(`
      CREATE TABLE IF NOT EXISTS assessments (
        assessment_id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES templates(template_id),
        company_id INTEGER REFERENCES companies(company_id),
        department_id INTEGER REFERENCES departments(department_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Assessment Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        assessment_question_id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(assessment_id),
        question_id INTEGER REFERENCES master_questions(question_id), -- Reference to master questions
        added_by_company BOOLEAN
      )
    `);

    // Create Evidence Files Table
    await query(`
      CREATE TABLE IF NOT EXISTS evidence_files (
        evidence_file_id SERIAL PRIMARY KEY,
        file_path TEXT ,
        pdf_data BYTEA,  -- Store the PDF data as binary  
        uploaded_by_user_id INTEGER REFERENCES users(user_id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Answers Table
    await query(`
      CREATE TABLE IF NOT EXISTS answers (
        answer_id SERIAL PRIMARY KEY,
        assessment_question_id INTEGER REFERENCES assessment_questions(assessment_question_id),
        user_id INTEGER REFERENCES users(user_id), -- user_id references users
        answer_text TEXT
      )
    `); // Removed the trailing comma

    await query(`
      CREATE TABLE IF NOT EXISTS answer_evidence_files (
        answer_id INTEGER REFERENCES answers(answer_id),
        evidence_file_id INTEGER REFERENCES evidence_files(evidence_file_id),
        PRIMARY KEY (answer_id, evidence_file_id)
      )
    `);

    // Create Comments Table
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id SERIAL PRIMARY KEY,
        assessment_question_id INTEGER REFERENCES assessment_questions(assessment_question_id),
        user_id INTEGER REFERENCES users(user_id), -- user_id references users
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create OTPs Table
    await query(`
      CREATE TABLE IF NOT EXISTS otps (
        otp_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Execute the initialization
initializeDatabase();
