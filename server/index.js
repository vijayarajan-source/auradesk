const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const requireAuth = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initDb().then(() => {
    console.log('✅ Database initialized');

    // Public routes (no auth required)
    const { router: authRouter } = require('./routes/auth');
    app.use('/api/auth', authRouter);

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'AuraDesk API ✨', timestamp: new Date().toISOString() });
    });

    // Protected routes (JWT required)
    app.use('/api/tasks', requireAuth, require('./routes/tasks'));
    app.use('/api/notes', requireAuth, require('./routes/notes'));
    app.use('/api/habits', requireAuth, require('./routes/habits'));
    app.use('/api/files', requireAuth, require('./routes/files'));
    app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✨ AuraDesk API running at http://0.0.0.0:${PORT}\n`);
    });
}).catch(err => {
    console.error('❌ DB init failed:', err);
    process.exit(1);
});
