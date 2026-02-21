const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
    try {
        const { status, priority } = req.query;
        let sql = 'SELECT * FROM tasks';
        const args = [];
        const conds = [];
        if (status) { conds.push('status = ?'); args.push(status); }
        if (priority) { conds.push('priority = ?'); args.push(priority); }
        if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
        sql += ' ORDER BY created_at DESC';
        res.json(await all(sql, args));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', async (req, res) => {
    try {
        const total = Number((await get('SELECT COUNT(*) as c FROM tasks'))?.c ?? 0);
        const done = Number((await get("SELECT COUNT(*) as c FROM tasks WHERE status='done'"))?.c ?? 0);
        const highPriority = Number((await get("SELECT COUNT(*) as c FROM tasks WHERE priority='high' AND status != 'done'"))?.c ?? 0);
        res.json({ total, done, highPriority, completion: total > 0 ? Math.round((done / total) * 100) : 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { title, description = '', priority = 'medium', status = 'todo', due_date = null } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const id = uuidv4();
        await run('INSERT INTO tasks (id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, description, priority, status, due_date]);
        res.status(201).json(await get('SELECT * FROM tasks WHERE id = ?', [id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const existing = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Task not found' });
        const { title, description, priority, status, due_date } = req.body;
        await run(
            `UPDATE tasks SET title=?, description=?, priority=?, status=?, due_date=?, updated_at=datetime('now') WHERE id=?`,
            [title ?? existing.title, description ?? existing.description,
            priority ?? existing.priority, status ?? existing.status,
            due_date ?? existing.due_date, req.params.id]
        );
        res.json(await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
