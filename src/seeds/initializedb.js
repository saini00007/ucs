import { query } from '../db/db.js';

const initializeDatabase = async () => {
  try {
    // Create Departments Table
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        department_id SERIAL PRIMARY KEY,
        department_name TEXT NOT NULL
      )
    `);

    // Create Roles Table
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id SERIAL PRIMARY KEY,
        role_name TEXT NOT NULL
      )
    `);

    // Insert initial roles
    await query(`
      INSERT INTO roles (role_name) VALUES 
      ('superadmin'),
      ('admin'),
      ('user')
    `);

    // Create Companies Table without spoc_user_id foreign key
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL
      )
    `);

    // Create Users Table with company_id and role_id foreign key
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        role_id INTEGER REFERENCES roles(role_id),
        department_id INTEGER REFERENCES departments(department_id),
        company_id INTEGER REFERENCES companies(company_id) -- company_id references companies
      )
    `);

    // Add spoc_user_id foreign key to Companies Table
    await query(`
      ALTER TABLE companies
      ADD COLUMN spoc_user_id INTEGER REFERENCES users(user_id);
    `);

    // Create Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        question_id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        department_id INTEGER REFERENCES departments(department_id),
        framework TEXT
      )
    `);

    // Create Templates Table
    await query(`
      CREATE TABLE IF NOT EXISTS templates (
        template_id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(department_id),
        template_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Template_Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS template_questions (
        template_question_id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES templates(template_id),
        question_id INTEGER REFERENCES questions(question_id)
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

    // Create Assessment_Questions Table
    await query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        assessment_question_id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(assessment_id),
        question_id INTEGER REFERENCES questions(question_id),
        added_by_company BOOLEAN
      )
    `);

    // Create Answers Table
    await query(`
      CREATE TABLE IF NOT EXISTS answers (
        answer_id SERIAL PRIMARY KEY,
        assessment_question_id INTEGER REFERENCES assessment_questions(assessment_question_id),
        user_id INTEGER REFERENCES users(user_id), -- user_id references users
        answer_text TEXT,
        evidence_file_id INTEGER
      )
    `);

    // Create Evidence_Files Table
    await query(`
      CREATE TABLE IF NOT EXISTS evidence_files (
        evidence_file_id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL,
        uploaded_by_user_id INTEGER REFERENCES users(user_id), -- uploaded_by_user_id references users
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Execute the initialization
initializeDatabase();
