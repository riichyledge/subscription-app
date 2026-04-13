import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const TRIAL_DAYS = 3;

export function isTrialActive(trialStartDate) {
  const now = new Date();
  const trialEnd = new Date(trialStartDate);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  return now < trialEnd;
}

export function getTrialDaysLeft(trialStartDate) {
  const now = new Date();
  const trialEnd = new Date(trialStartDate);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const msLeft = trialEnd - now;
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAccess(req, res, next) {
  const { user } = req;
  const trialActive = isTrialActive(user.trialStartDate);
  const hasAccess = trialActive || user.subscribed;
  if (!hasAccess) {
    return res.status(403).json({
      error: 'Access denied',
      reason: trialActive ? 'no_subscription' : 'trial_expired',
    });
  }
  next();
}
