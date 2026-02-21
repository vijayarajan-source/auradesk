const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
    try {
        const { search, folder, tag } = req.query;
        let sql = 'SELECT * FROM notes';
        const args = [], conds = [];
        if (folder) { conds.push('folder = ?'); args.push(folder); }
        if (search) { conds.push('(title LIKE ? OR content LIKE ?)'); args.push(`%${search}%`, `%${search}%`); }
        if (tag) { conds.push('tags LIKE ?'); args.push(`%"${tag}"%`); }
        if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
        sql += ' ORDER BY updated_at DESC';
        const notes = await all(sql, args);
        res.json(notes.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/folders', async (req, res) => {
    try {
        res.json(await all('SELECT folder, COUNT(*) as count FROM notes GROUP BY folder ORDER BY folder'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tags', async (req, res) => {
    try {
        const notes = await all("SELECT tags FROM notes WHERE tags != '[]'");
        const tagSet = new Set();
        notes.forEach(n => JSON.parse(n.tags || '[]').forEach(t => tagSet.add(t)));
        res.json([...tagSet]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const note = await get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json({ ...note, tags: JSON.parse(note.tags || '[]') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { title, content = '', folder = 'General', tags = [] } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const id = uuidv4();
        await run('INSERT INTO notes (id, title, content, folder, tags) VALUES (?, ?, ?, ?, ?)',
            [id, title, content, folder, JSON.stringify(tags)]);
        const note = await get('SELECT * FROM notes WHERE id = ?', [id]);
        res.status(201).json({ ...note, tags: JSON.parse(note.tags) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const existing = await get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Note not found' });
        const { title, content, folder, tags } = req.body;
        await run(
            `UPDATE notes SET title=?, content=?, folder=?, tags=?, updated_at=datetime('now') WHERE id=?`,
            [title ?? existing.title, content ?? existing.content,
            folder ?? existing.folder, tags ? JSON.stringify(tags) : existing.tags, req.params.id]
        );
        const updated = await get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
        res.json({ ...updated, tags: JSON.parse(updated.tags) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await run('DELETE FROM notes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
