import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserProfile } from '../models/User';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; profile: UserProfile };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: 'JWT secret not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: number; email: string; profile: UserProfile };

    if (!decoded.profile || !['Operator', 'Administrator'].includes(decoded.profile)) {
      res.status(401).json({ message: 'Invalid token profile' });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireProfiles = (...profiles: UserProfile[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const currentProfile = req.user?.profile;

    if (!currentProfile) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!profiles.includes(currentProfile)) {
      res.status(403).json({ message: 'Forbidden for this profile' });
      return;
    }

    next();
  };
};

export const requireAdministrator = requireProfiles('Administrator');
