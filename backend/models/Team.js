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

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'teams',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['totalPoints', 'rank'] }
  ]
});

// Define associations
Team.associate = (models) => {
  Team.hasMany(models.User, { foreignKey: 'teamId', as: 'members' });
};

export default Team;
