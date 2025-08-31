import express from 'express';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { verifyToken, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { emitScoreboardUpdate } from '../server.js';

const router = express.Router();

// Get all challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.find();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenge by id
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit flag
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    // Check if user is blocked
    if (req.user.isBlocked) {
      return res.status(403).json({ error: 'Your account is blocked. Contact an administrator.' });
    }

    const { flag } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (!challenge.isActive) {
      return res.status(400).json({ error: 'This challenge is not currently active.' });
    }

    // Check if user has already solved this challenge
    if (challenge.solvedBy.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already solved this challenge.' });
    }

    // Check attempt limits
    const userSubmissions = challenge.submissions.filter(sub => sub.user.toString() === req.user._id.toString());
    if (challenge.maxAttempts > 0 && userSubmissions.length >= challenge.maxAttempts) {
      return res.status(400).json({
        error: `Maximum attempts (${challenge.maxAttempts}) reached for this challenge.`
      });
    }

    // Validate flag format (basic check)
    if (!flag || typeof flag !== 'string' || flag.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid flag format.' });
    }

    const trimmedFlag = flag.trim();
    const isCorrect = challenge.flag === trimmedFlag;

    // Record the submission
    challenge.submissions.push({
      user: req.user._id,
      flag: trimmedFlag,
      isCorrect,
      timestamp: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Update attempt count
    challenge.attempts += 1;

    if (isCorrect) {
      // Add user to solvedBy
      challenge.solvedBy.push(req.user._id);

      // Calculate points (dynamic or static)
      const awardedPoints = challenge.dynamicPoints ?
        challenge.calculateDynamicPoints() : challenge.points;

      // Update user points
      req.user.points += awardedPoints;

      // Update user's solved challenges
      if (!req.user.solvedChallenges.includes(challenge._id)) {
        req.user.solvedChallenges.push(challenge._id);
      }

      await challenge.save();
      await req.user.save();

      // Emit real-time scoreboard update
      emitScoreboardUpdate(challenge.wave);

      res.json({
        success: true,
        points: awardedPoints,
        message: 'Congratulations! Flag accepted.',
        attempts: userSubmissions.length + 1
      });
    } else {
      // Apply penalty if configured
      if (challenge.penaltyPoints > 0) {
        req.user.points = Math.max(0, req.user.points - challenge.penaltyPoints);
        await req.user.save();
      }

      await challenge.save();

      res.json({
        success: false,
        message: 'Incorrect flag.',
        attempts: userSubmissions.length + 1,
        maxAttempts: challenge.maxAttempts,
        penaltyApplied: challenge.penaltyPoints > 0 ? challenge.penaltyPoints : 0,
        remainingPoints: req.user.points
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenges by category
router.get('/category/:category', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      category: req.params.category,
      isActive: true
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenges by difficulty
router.get('/difficulty/:difficulty', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      difficulty: req.params.difficulty,
      isActive: true
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenges by wave
router.get('/wave/:wave', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      wave: req.params.wave,
      isActive: true
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hint for a challenge
router.get('/:id/hint/:hintIndex', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    const hintIndex = parseInt(req.params.hintIndex);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }

    const hint = challenge.hints[hintIndex];

    // Check if user already unlocked this hint
    if (hint.unlockedBy.includes(req.user._id)) {
      return res.json({ hint: hint.content, alreadyUnlocked: true });
    }

    // Check if user has enough points
    if (req.user.points < hint.cost) {
      return res.status(400).json({ error: 'Not enough points to unlock hint' });
    }

    // Deduct points and unlock hint
    req.user.points -= hint.cost;
    hint.unlockedBy.push(req.user._id);

    await req.user.save();
    await challenge.save();

    res.json({ hint: hint.content, pointsDeducted: hint.cost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new challenge (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      createdBy: req.user._id
    };

    const challenge = new Challenge(challengeData);
    await challenge.save();

    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update challenge (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete challenge (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenge statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('solvedBy', 'username')
      .populate('createdBy', 'username');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const stats = {
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      solves: challenge.solves,
      attempts: challenge.attempts,
      solveRate: challenge.attempts > 0 ? (challenge.solves / challenge.attempts * 100).toFixed(2) : 0,
      solvedBy: challenge.solvedBy.map(user => user.username),
      createdBy: challenge.createdBy?.username || 'Unknown'
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user submissions for a challenge (admin only)
router.get('/:id/submissions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('submissions.user', 'username email')
      .select('submissions title');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      challengeTitle: challenge.title,
      submissions: challenge.submissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's submission history for a challenge
router.get('/:id/my-submissions', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .select('submissions title maxAttempts penaltyPoints');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userSubmissions = challenge.submissions
      .filter(sub => sub.user.toString() === req.user._id.toString())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      challengeTitle: challenge.title,
      maxAttempts: challenge.maxAttempts,
      penaltyPoints: challenge.penaltyPoints,
      submissions: userSubmissions,
      attemptsUsed: userSubmissions.length,
      attemptsRemaining: challenge.maxAttempts > 0 ? Math.max(0, challenge.maxAttempts - userSubmissions.length) : 'unlimited'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user attempts for a challenge (admin only)
router.post('/:id/reset-attempts/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Remove all submissions from this user
    challenge.submissions = challenge.submissions.filter(
      sub => sub.user.toString() !== req.params.userId
    );

    // Recalculate attempts
    challenge.attempts = challenge.submissions.length;

    await challenge.save();

    res.json({ message: 'User attempts reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update challenge status (admin only)
router.post('/bulk/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { challengeIds, isActive } = req.body;

    if (!Array.isArray(challengeIds)) {
      return res.status(400).json({ error: 'challengeIds must be an array' });
    }

    const result = await Challenge.updateMany(
      { _id: { $in: challengeIds } },
      { isActive, updatedAt: new Date() }
    );

    res.json({
      message: `Updated ${result.modifiedCount} challenges`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
