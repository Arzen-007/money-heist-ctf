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

const Challenge = sequelize.define('Challenge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('web', 'crypto', 'forensics', 'misc', 'pwn', 'reverse', 'steganography'),
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dynamicPoints: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  minPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wave: {
    type: DataTypes.ENUM('red', 'blue', 'purple'),
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  files: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  solves: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  penaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'challenges',
  timestamps: true,
  indexes: [
    { fields: ['category', 'difficulty', 'wave'] },
    { fields: ['isActive'] },
    { fields: ['solves'] }
  ]
});

// Hint model
const Hint = sequelize.define('Hint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  cost: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Challenge,
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hints',
  timestamps: true
});

// Submission model
const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Challenge,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  indexes: [
    { fields: ['challengeId', 'userId'] },
    { fields: ['isCorrect'] }
  ]
});

// User solved challenges junction table
const UserSolvedChallenges = sequelize.define('UserSolvedChallenges', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Challenge,
      key: 'id'
    }
  },
  solvedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_solved_challenges',
  timestamps: false,
  indexes: [
    { fields: ['userId', 'challengeId'], unique: true }
  ]
});

// Define associations
Challenge.associate = (models) => {
  Challenge.hasMany(Hint, { foreignKey: 'challengeId', as: 'hints' });
  Challenge.hasMany(Submission, { foreignKey: 'challengeId', as: 'submissions' });
  Challenge.belongsToMany(models.User, {
    through: UserSolvedChallenges,
    foreignKey: 'challengeId',
    as: 'solvedBy'
  });
  Challenge.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  Challenge.belongsToMany(models.Challenge, {
    through: 'challenge_dependencies',
    foreignKey: 'challengeId',
    otherKey: 'dependencyId',
    as: 'dependencies'
  });
};

Hint.associate = (models) => {
  Hint.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });
  Hint.belongsToMany(models.User, {
    through: 'hint_unlocked_by',
    foreignKey: 'hintId',
    as: 'unlockedBy'
  });
};

Submission.associate = (models) => {
  Submission.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });
  Submission.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

// Method to calculate dynamic points
Challenge.prototype.calculateDynamicPoints = function() {
  if (!this.dynamicPoints) return this.points;

  const basePoints = this.points;
  const solveRate = this.attempts > 0 ? this.solves / this.attempts : 0;
  const dynamicPoints = Math.max(
    this.minPoints || basePoints * 0.5,
    Math.min(this.maxPoints || basePoints * 2, basePoints * (1 + (1 - solveRate)))
  );

  return Math.round(dynamicPoints);
};

export default Challenge;
export { Hint, Submission, UserSolvedChallenges };
