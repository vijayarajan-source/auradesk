const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { get, all, run } = require('../db');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const id = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${id}${ext}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// GET all files
router.get('/', async (req, res) => {
    try {
        const { folder } = req.query;
        let sql = 'SELECT * FROM files';
        const args = [];
        if (folder) { sql += ' WHERE folder = ?'; args.push(folder); }
        sql += ' ORDER BY created_at DESC';
        res.json(await all(sql, args));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET file folders
router.get('/folders', async (req, res) => {
    try {
        res.json(await all('SELECT folder, COUNT(*) as count FROM files GROUP BY folder'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST upload file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { folder = 'General', encrypted = '0' } = req.body;
        const id = path.basename(req.file.filename, path.extname(req.file.filename));
        await run(
            'INSERT INTO files (id, name, original_name, size, mime_type, encrypted, folder) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, parseInt(encrypted), folder]
        );
        res.status(201).json(await get('SELECT * FROM files WHERE id=?', [id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET download/view file
router.get('/:id/download', async (req, res) => {
    try {
        const file = await get('SELECT * FROM files WHERE id=?', [req.params.id]);
        if (!file) return res.status(404).json({ error: 'File not found' });
        const filePath = path.join(UPLOADS_DIR, file.name);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing from disk' });
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
        res.sendFile(filePath);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE file
router.delete('/:id', async (req, res) => {
    try {
        const file = await get('SELECT * FROM files WHERE id=?', [req.params.id]);
        if (!file) return res.status(404).json({ error: 'File not found' });
        const filePath = path.join(UPLOADS_DIR, file.name);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await run('DELETE FROM files WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
