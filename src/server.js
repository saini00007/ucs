import express from 'express';
import dotenv from 'dotenv';

import initializeDatabase from './initializeDatabase.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 443;

//authentication
import mockAuthenticate from './middleware/mockAuth.js';
import { authenticate } from './middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;

//importing routes
import companyRoutes from './routes/company.js';
import departmentRoutes from './routes/department.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessment.js';
import assessmentQuestionRoutes from './routes/assessmentQuestion.js';
import answerRoutes from './routes/answer.js';
import masterRoutes from './routes/master.js'
import masterQuestionRoute from './routes/masterQuestion.js';
import commentRoutes from './routes/comment.js';


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use('/', authRoutes);

app.use(authMiddleware);

app.use('/companies', companyRoutes);
app.use('/departments', departmentRoutes);
app.use('/users', userRoutes);
app.use('/assessments', assessmentRoutes);
app.use('/questions', assessmentQuestionRoutes);
app.use('/', answerRoutes);
app.use('/', commentRoutes);
app.use('/', masterRoutes);


const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
