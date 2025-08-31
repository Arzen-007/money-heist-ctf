import { DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] }
  ]
});

// Define associations
User.associate = (models) => {
  User.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
  User.belongsToMany(models.Challenge, {
    through: 'user_solved_challenges',
    foreignKey: 'userId',
    as: 'solvedChallenges'
  });
  User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
  User.hasMany(models.Message, { foreignKey: 'recipientId', as: 'receivedMessages' });
};

export default User;
