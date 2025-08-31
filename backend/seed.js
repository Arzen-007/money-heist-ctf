import sequelize from './models/index.js';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Challenge, { Hint } from './models/Challenge.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: false });

    // Create default admin user
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        username: 'TheProfessor',
        email: 'admin@heist.com',
        password: hashedPassword,
        role: 'admin',
        points: 0
      });
      console.log('Default admin user created');
    }

    // Create sample challenges
    const challenges = [
      {
        title: 'Welcome Challenge',
        description: 'Find the flag in the source code',
        category: 'web',
        difficulty: 'easy',
        points: 50,
        flag: 'MH{welcome_to_the_heist}',
        wave: 'red',
        hints: ['Check the HTML source']
      },
      {
        title: 'Basic Crypto',
        description: 'Decrypt this message: SGVsbG8gV29ybGQ=',
        category: 'crypto',
        difficulty: 'easy',
        points: 75,
        flag: 'MH{hello_world}',
        wave: 'blue',
        hints: ['This is base64 encoded']
      }
    ];

    for (const challengeData of challenges) {
      const exists = await Challenge.findOne({ where: { title: challengeData.title } });
      if (!exists) {
        const { hints, ...challengeFields } = challengeData;
        const challenge = await Challenge.create(challengeFields);

        // Create hints for the challenge
        if (hints && hints.length > 0) {
          for (let i = 0; i < hints.length; i++) {
            await Hint.create({
              content: hints[i],
              cost: 10 * (i + 1), // Increasing cost for each hint
              challengeId: challenge.id
            });
          }
        }

        console.log(`Challenge "${challengeData.title}" created`);
      }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
