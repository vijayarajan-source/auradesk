const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'auradesk-secret-change-me-in-production';
const JWT_EXPIRES = '30d';

// POST /api/auth/register — first-time setup
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const id = uuidv4();
        const hash = await bcrypt.hash(password, 12);
        await run('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [id, name, email.toLowerCase(), hash]);

        const token = jwt.sign({ id, name, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.status(201).json({ token, user: { id, name, email: email.toLowerCase() } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me — verify token
router.get('/me', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        const user = await get('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
});

// GET /api/auth/hasUsers — check if any users exist (for showing register vs login)
router.get('/hasUsers', async (req, res) => {
    try {
        const row = await get('SELECT COUNT(*) as c FROM users');
        res.json({ hasUsers: Number(row?.c ?? 0) > 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, JWT_SECRET };
