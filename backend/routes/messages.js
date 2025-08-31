import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get messages for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware sets req.user
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId },
        { recipient: null, type: 'broadcast' }
      ]
    }).populate('sender', 'username').populate('recipient', 'username').sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const { recipient, content, type } = req.body;
    const sender = req.user.id;
    const message = new Message({ sender, recipient, content, type });
    await message.save();
    await message.populate('sender', 'username');
    if (recipient) await message.populate('recipient', 'username');
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.recipient.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    message.read = true;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
