import express from 'express';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Challenge from '../models/Challenge.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get overall scoreboard
router.get('/overall', async (req, res) => {
  try {
    // Get individual player scoreboard
    const players = await User.find({ isBlocked: false })
      .select('username points solvedChallenges createdAt')
      .sort({ points: -1, createdAt: 1 })
      .limit(50);

    // Get team scoreboard
    const teams = await Team.find()
      .populate('members', 'username points')
      .sort({ totalPoints: -1, createdAt: 1 })
      .limit(50);

    // Calculate team points dynamically
    const teamsWithCalculatedPoints = teams.map(team => {
      const totalPoints = team.members.reduce((sum, member) => sum + member.points, 0);
      return {
        _id: team._id,
        name: team.name,
        totalPoints,
        memberCount: team.members.length,
        members: team.members.map(member => ({
          username: member.username,
          points: member.points
        }))
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      players: players.map((player, index) => ({
        rank: index + 1,
        username: player.username,
        points: player.points,
        solvedChallenges: player.solvedChallenges.length
      })),
      teams: teamsWithCalculatedPoints.map((team, index) => ({
        rank: index + 1,
        name: team.name,
        totalPoints: team.totalPoints,
        memberCount: team.memberCount,
        members: team.members
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scoreboard for specific wave
router.get('/wave/:wave', async (req, res) => {
  try {
    const { wave } = req.params;

    if (!['red', 'blue', 'purple'].includes(wave)) {
      return res.status(400).json({ error: 'Invalid wave. Must be red, blue, or purple.' });
    }

    // Get challenges for this wave
    const waveChallenges = await Challenge.find({ wave, isActive: true });

    if (waveChallenges.length === 0) {
      return res.json({
        players: [],
        teams: [],
        message: `No challenges available for ${wave} wave yet.`
      });
    }

    // Get users who solved challenges in this wave
    const solvedChallengeIds = waveChallenges.map(challenge => challenge._id);
    const players = await User.find({
      isBlocked: false,
      solvedChallenges: { $in: solvedChallengeIds }
    })
      .select('username points solvedChallenges createdAt')
      .sort({ points: -1, createdAt: 1 })
      .limit(50);

    // Calculate wave-specific points for each player
    const playersWithWavePoints = await Promise.all(
      players.map(async (player) => {
        const solvedWaveChallenges = await Challenge.find({
          _id: { $in: player.solvedChallenges },
          wave,
          isActive: true
        });

        const wavePoints = solvedWaveChallenges.reduce((sum, challenge) => sum + challenge.points, 0);

        return {
          _id: player._id,
          username: player.username,
          wavePoints,
          solvedWaveChallenges: solvedWaveChallenges.length,
          totalPoints: player.points
        };
      })
    );

    // Sort by wave points
    playersWithWavePoints.sort((a, b) => b.wavePoints - a.wavePoints);

    // Get teams with wave-specific performance
    const teams = await Team.find()
      .populate('members', 'username points solvedChallenges')
      .sort({ totalPoints: -1, createdAt: 1 })
      .limit(50);

    const teamsWithWavePoints = await Promise.all(
      teams.map(async (team) => {
        let teamWavePoints = 0;
        const memberWaveStats = [];

        for (const member of team.members) {
          const solvedWaveChallenges = await Challenge.find({
            _id: { $in: member.solvedChallenges },
            wave,
            isActive: true
          });

          const memberWavePoints = solvedWaveChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
          teamWavePoints += memberWavePoints;

          memberWaveStats.push({
            username: member.username,
            wavePoints: memberWavePoints,
            solvedWaveChallenges: solvedWaveChallenges.length
          });
        }

        return {
          _id: team._id,
          name: team.name,
          wavePoints: teamWavePoints,
          memberCount: team.members.length,
          totalPoints: team.totalPoints,
          members: memberWaveStats
        };
      })
    );

    // Sort teams by wave points
    teamsWithWavePoints.sort((a, b) => b.wavePoints - a.wavePoints);

    res.json({
      wave,
      players: playersWithWavePoints.map((player, index) => ({
        rank: index + 1,
        username: player.username,
        wavePoints: player.wavePoints,
        solvedWaveChallenges: player.solvedWaveChallenges,
        totalPoints: player.totalPoints
      })),
      teams: teamsWithWavePoints.map((team, index) => ({
        rank: index + 1,
        name: team.name,
        wavePoints: team.wavePoints,
        memberCount: team.memberCount,
        totalPoints: team.totalPoints,
        members: team.members
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('solvedChallenges', 'title category difficulty points wave')
      .populate('team', 'name');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate wave-specific statistics
    const waveStats = {
      red: { solved: 0, points: 0 },
      blue: { solved: 0, points: 0 },
      purple: { solved: 0, points: 0 }
    };

    user.solvedChallenges.forEach(challenge => {
      if (waveStats[challenge.wave]) {
        waveStats[challenge.wave].solved += 1;
        waveStats[challenge.wave].points += challenge.points;
      }
    });

    const stats = {
      username: user.username,
      totalPoints: user.points,
      solvedChallenges: user.solvedChallenges.length,
      team: user.team?.name || null,
      waveStats,
      joinDate: user.createdAt,
      rank: await getUserRank(user._id)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team statistics
router.get('/team/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('members', 'username points solvedChallenges')
      .populate('members.solvedChallenges', 'title category difficulty points wave');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Calculate team statistics
    const memberStats = team.members.map(member => ({
      username: member.username,
      points: member.points,
      solvedChallenges: member.solvedChallenges.length
    }));

    const totalTeamPoints = memberStats.reduce((sum, member) => sum + member.points, 0);

    // Calculate wave-specific team statistics
    const waveStats = {
      red: { solved: 0, points: 0 },
      blue: { solved: 0, points: 0 },
      purple: { solved: 0, points: 0 }
    };

    team.members.forEach(member => {
      member.solvedChallenges.forEach(challenge => {
        if (waveStats[challenge.wave]) {
          waveStats[challenge.wave].solved += 1;
          waveStats[challenge.wave].points += challenge.points;
        }
      });
    });

    const stats = {
      name: team.name,
      totalPoints: totalTeamPoints,
      memberCount: team.members.length,
      members: memberStats,
      waveStats,
      createdDate: team.createdAt,
      rank: await getTeamRank(team._id)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top performers
router.get('/top-performers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topPlayers = await User.find({ isBlocked: false })
      .select('username points solvedChallenges')
      .sort({ points: -1 })
      .limit(limit);

    const topTeams = await Team.find()
      .populate('members', 'points')
      .sort({ totalPoints: -1 })
      .limit(limit);

    const teamsWithCalculatedPoints = topTeams.map(team => ({
      name: team.name,
      totalPoints: team.members.reduce((sum, member) => sum + member.points, 0),
      memberCount: team.members.length
    }));

    res.json({
      players: topPlayers.map(player => ({
        username: player.username,
        points: player.points,
        solvedChallenges: player.solvedChallenges.length
      })),
      teams: teamsWithCalculatedPoints
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get user rank
async function getUserRank(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const usersWithHigherPoints = await User.countDocuments({
    points: { $gt: user.points },
    isBlocked: false
  });

  const usersWithSamePoints = await User.countDocuments({
    points: user.points,
    createdAt: { $lt: user.createdAt },
    isBlocked: false
  });

  return usersWithHigherPoints + usersWithSamePoints + 1;
}

// Helper function to get team rank
async function getTeamRank(teamId) {
  const team = await Team.findById(teamId).populate('members', 'points');
  if (!team) return null;

  const teamPoints = team.members.reduce((sum, member) => sum + member.points, 0);

  const teamsWithHigherPoints = await Team.countDocuments({
    _id: { $ne: teamId },
    $expr: {
      $gt: [
        { $sum: '$members.points' },
        teamPoints
      ]
    }
  });

  return teamsWithHigherPoints + 1;
}

export default router;
