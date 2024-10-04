const { query } = require('../db/db.js');

const initializeMasterQuestions = async () => {
  try {
    // Insert Department Names
    const departmentNames = [
      'Network Security',
      'Application Security',
      'Compliance and Risk Management',
      'Incident Response Team',
      'Cybersecurity Training and Awareness',
      'Security Operations Center (SOC)'
    ];

    // Insert each department name into master_departments table
    for (const department_name of departmentNames) {
      await query(`
        INSERT INTO master_departments (department_name)
        VALUES ($1)
        ON CONFLICT (department_name) DO NOTHING
      `, [department_name]);
    }

    // Retrieve Department IDs to link with questions later
    const departmentIds = {};
    const result = await query(`SELECT department_id, department_name FROM master_departments`);

    result.rows.forEach(row => {
      departmentIds[row.department_name] = row.department_id;
    });

    // Define questions along with associated departments
    const questions = [
      { question_text: 'Do you have a firewall implemented to protect your network?', framework: 'NIST 800-53', department_names: ['Network Security'] },
      { question_text: 'Is multi-factor authentication (MFA) enabled for all user accounts?', framework: 'NIST 800-53', department_names: ['Application Security'] },
      { question_text: 'Are regular security audits conducted?', framework: 'ISO 27001', department_names: ['Compliance and Risk Management', 'Security Operations Center (SOC)'] },
      { question_text: 'Do you have an incident response plan in place?', framework: 'ISO 27001', department_names: ['Incident Response Team'] },
      { question_text: 'Are employees regularly trained on cybersecurity best practices?', framework: 'ISO 27001', department_names: ['Cybersecurity Training and Awareness'] },
      { question_text: 'Is there a secure backup process in place?', framework: 'NIST 800-53', department_names: ['Security Operations Center (SOC)'] },
      { question_text: 'Are software updates and patches applied regularly?', framework: 'NIST 800-53', department_names: ['Network Security'] },
      { question_text: 'Is there a policy for managing user privileges?', framework: 'ISO 27001', department_names: ['Application Security'] },
      { question_text: 'Are physical security controls in place to protect your data centers?', framework: 'NIST 800-53', department_names: ['Compliance and Risk Management'] },
      { question_text: 'Is there a process for detecting and responding to security incidents?', framework: 'ISO 27001', department_names: ['Incident Response Team'] },
      { question_text: 'Are there regular phishing simulations to train employees?', framework: 'ISO 27001', department_names: ['Cybersecurity Training and Awareness'] },
      { question_text: 'Do you perform regular vulnerability assessments?', framework: 'NIST 800-53', department_names: ['Security Operations Center (SOC)'] },
      { question_text: 'Is encryption used to protect sensitive data in transit and at rest?', framework: 'NIST 800-53', department_names: ['Network Security'] },
      { question_text: 'Are secure coding practices followed during software development?', framework: 'NIST 800-53', department_names: ['Application Security'] },
      { question_text: 'Are third-party vendors assessed for security compliance?', framework: 'ISO 27001', department_names: ['Compliance and Risk Management'] },
      { question_text: 'Is there a formal process for reporting security incidents?', framework: 'ISO 27001', department_names: ['Incident Response Team'] },
      { question_text: 'Are employees aware of their responsibilities regarding information security?', framework: 'ISO 27001', department_names: ['Cybersecurity Training and Awareness'] },
      { question_text: 'Is network traffic monitored for suspicious activity?', framework: 'NIST 800-53', department_names: ['Security Operations Center (SOC)'] },
      { question_text: 'Do you have a documented business continuity plan?', framework: 'NIST 800-53', department_names: ['Compliance and Risk Management'] },
      { question_text: 'Are regular data backups performed and tested?', framework: 'NIST 800-53', department_names: ['Security Operations Center (SOC)'] },
      { question_text: 'Is access to sensitive information restricted based on user roles?', framework: 'NIST 800-53', department_names: ['Application Security'] },
      { question_text: 'Is there a process for reviewing and updating security policies?', framework: 'ISO 27001', department_names: ['Compliance and Risk Management'] },
      { question_text: 'Are incident response exercises conducted regularly?', framework: 'ISO 27001', department_names: ['Incident Response Team'] },
      { question_text: 'Are employees trained on recognizing and reporting security incidents?', framework: 'ISO 27001', department_names: ['Cybersecurity Training and Awareness'] },
    ];

    // Insert questions and link them to departments
    for (const question of questions) {
      // Insert question into master_questions table
      const questionResult = await query(`
        INSERT INTO master_questions (question_text, framework)
        VALUES ($1, $2)
        RETURNING question_id
      `, [question.question_text, question.framework]);

      const questionId = questionResult.rows[0].question_id;

      // Insert into question_department_links junction table
      for (const department_name of question.department_names) {
        const departmentId = departmentIds[department_name];
        await query(`
          INSERT INTO question_department_links (question_id, master_department_id)
          VALUES ($1, $2)
        `, [questionId, departmentId]);
      }
    }

    console.log('Departments and questions initialized successfully');
  } catch (error) {
    console.error('Error initializing master questions:', error);
  }
};

// Call the function to initialize master questions
initializeMasterQuestions();
