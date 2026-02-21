const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function calcStreak(habitId) {
    const logs = await all(
        'SELECT completed_date FROM habit_logs WHERE habit_id=? ORDER BY completed_date DESC',
        [habitId]
    );
    if (!logs.length) return 0;
    let streak = 0;
    let current = new Date(); current.setHours(0, 0, 0, 0);
    for (const log of logs) {
        const logDate = new Date(log.completed_date); logDate.setHours(0, 0, 0, 0);
        const diff = Math.round((current - logDate) / 86400000);
        if (diff === 0 || diff === 1) { streak++; current = logDate; } else break;
    }
    return streak;
}

router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const habits = await all('SELECT * FROM habits ORDER BY created_at DESC');
        const result = await Promise.all(habits.map(async h => ({
            ...h,
            streak: await calcStreak(h.id),
            completedToday: !!(await get('SELECT 1 as c FROM habit_logs WHERE habit_id=? AND completed_date=?', [h.id, today])),
            totalDone: Number((await get('SELECT COUNT(*) as c FROM habit_logs WHERE habit_id=?', [h.id]))?.c ?? 0)
        })));
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/heatmap', async (req, res) => {
    try {
        res.json(await all(
            'SELECT completed_date, COUNT(*) as count FROM habit_logs WHERE habit_id=? GROUP BY completed_date ORDER BY completed_date',
            [req.params.id]
        ));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { name, description = '', frequency = 'daily', color = '#C9A84C' } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const id = uuidv4();
        await run('INSERT INTO habits (id, name, description, frequency, color) VALUES (?, ?, ?, ?, ?)',
            [id, name, description, frequency, color]);
        res.status(201).json(await get('SELECT * FROM habits WHERE id=?', [id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const existing = await get('SELECT * FROM habits WHERE id=?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Habit not found' });
        const { name, description, frequency, color } = req.body;
        await run('UPDATE habits SET name=?, description=?, frequency=?, color=? WHERE id=?',
            [name ?? existing.name, description ?? existing.description,
            frequency ?? existing.frequency, color ?? existing.color, req.params.id]);
        res.json(await get('SELECT * FROM habits WHERE id=?', [req.params.id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/log', async (req, res) => {
    try {
        const today = req.body.date || new Date().toISOString().split('T')[0];
        const existing = await get('SELECT * FROM habit_logs WHERE habit_id=? AND completed_date=?', [req.params.id, today]);
        if (existing) {
            await run('DELETE FROM habit_logs WHERE habit_id=? AND completed_date=?', [req.params.id, today]);
            res.json({ completed: false, streak: await calcStreak(req.params.id) });
        } else {
            await run('INSERT INTO habit_logs (id, habit_id, completed_date) VALUES (?, ?, ?)',
                [uuidv4(), req.params.id, today]);
            res.json({ completed: true, streak: await calcStreak(req.params.id) });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await run('DELETE FROM habit_logs WHERE habit_id=?', [req.params.id]);
        await run('DELETE FROM habits WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
