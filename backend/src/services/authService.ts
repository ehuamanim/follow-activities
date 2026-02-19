import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { CreateUserDTO, UserPublic } from '../models/User';

const SALT_ROUNDS = 12;

export const registerUser = async (dto: CreateUserDTO): Promise<{ user: UserPublic; token: string }> => {
  const { name, surnames, email, password } = dto;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    'INSERT INTO users (name, surnames, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, surnames, email, created_at',
    [name ?? null, surnames ?? null, email, password_hash]
  );

  const user: UserPublic = result.rows[0];
  const token = generateToken(user.id, user.email);

  return { user, token };
};

export const loginUser = async (email: string, password: string): Promise<{ user: UserPublic; token: string }> => {
  const result = await pool.query(
    'SELECT id, name, surnames, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const row = result.rows[0];
  const valid = await bcrypt.compare(password, row.password_hash);

  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const user: UserPublic = {
    id: row.id,
    name: row.name,
    surnames: row.surnames,
    email: row.email,
    created_at: row.created_at,
  };

  const token = generateToken(user.id, user.email);
  return { user, token };
};

const generateToken = (id: number, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  return jwt.sign({ id, email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};
