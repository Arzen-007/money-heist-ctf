import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Import models
import User from './User.js';
import Team from './Team.js';
import Challenge, { Hint, Submission, UserSolvedChallenges } from './Challenge.js';
import Message from './Message.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'money_heist_ctf',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Initialize models
const models = {
  User,
  Team,
  Challenge,
  Hint,
  Submission,
  UserSolvedChallenges,
  Message,
  sequelize
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
  }
};

testConnection();

export default sequelize;
export { models };
