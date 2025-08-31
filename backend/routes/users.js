import express from 'express';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { username, email, role, isBlocked, isMuted, points } = req.body;
    const [affectedRows] = await User.update(
      { username, email, role, isBlocked, isMuted, points },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Block user (admin only)
router.put('/:id/block', requireAdmin, async (req, res) => {
  try {
    const [affectedRows] = await User.update(
      { isBlocked: true },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });

    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock user (admin only)
router.put('/:id/unblock', requireAdmin, async (req, res) => {
  try {
    const [affectedRows] = await User.update(
      { isBlocked: false },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });

    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mute user (admin only)
router.put('/:id/mute', requireAdmin, async (req, res) => {
  try {
    const [affectedRows] = await User.update(
      { isMuted: true },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });

    res.json({ message: 'User muted successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unmute user (admin only)
router.put('/:id/unmute', requireAdmin, async (req, res) => {
  try {
    const [affectedRows] = await User.update(
      { isMuted: false },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models/Team.js').default,
        as: 'team',
        attributes: ['name']
      }]
    });

    res.json({ message: 'User unmuted successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedRows = await User.destroy({ where: { id: req.params.id } });
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
