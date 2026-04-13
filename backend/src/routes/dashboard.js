import { Router } from 'express';
import { authenticate, requireAccess, getTrialDaysLeft } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard  — protected: trial or subscribed users only
router.get('/', authenticate, requireAccess, (req, res) => {
  const { user } = req;
  res.json({
    message: `Welcome back, ${user.email}!`,
    stats: {
      accountCreated: user.createdAt,
      trialDaysLeft: getTrialDaysLeft(user.trialStartDate),
      subscriptionStatus: user.subscriptionStatus ?? (user.subscribed ? 'active' : 'trial'),
    },
  });
});

export default router;
