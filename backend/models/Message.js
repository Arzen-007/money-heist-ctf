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

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('private', 'broadcast', 'system'),
    defaultValue: 'private'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['senderId'] },
    { fields: ['recipientId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

// Define associations
Message.associate = (models) => {
  Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
  Message.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
};

export default Message;
