const express = require('express');
const router = express.Router();
const { get, all } = require('../db');

router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const totalTasks = Number((await get('SELECT COUNT(*) as c FROM tasks'))?.c ?? 0);
        const doneTasks = Number((await get("SELECT COUNT(*) as c FROM tasks WHERE status='done'"))?.c ?? 0);
        const totalHabits = Number((await get('SELECT COUNT(*) as c FROM habits'))?.c ?? 0);
        const doneHabits = Number((await get('SELECT COUNT(DISTINCT habit_id) as c FROM habit_logs WHERE completed_date=?', [today]))?.c ?? 0);
        const totalNotes = Number((await get('SELECT COUNT(*) as c FROM notes'))?.c ?? 0);
        const totalFiles = Number((await get('SELECT COUNT(*) as c FROM files'))?.c ?? 0);
        const totalSize = Number((await get('SELECT SUM(size) as s FROM files'))?.s ?? 0);
        const totalQuotes = Number((await get('SELECT COUNT(*) as c FROM quotes'))?.c ?? 1);
        const quoteIdx = (dayOfYear % totalQuotes) + 1;
        const quote = await get('SELECT * FROM quotes WHERE id = ?', [quoteIdx]) ?? await get('SELECT * FROM quotes LIMIT 1');
        const recentTasks = await all("SELECT * FROM tasks WHERE status != 'done' ORDER BY created_at DESC LIMIT 5");

        res.json({
            tasks: { total: totalTasks, done: doneTasks, completion: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
            habits: { total: totalHabits, completedToday: doneHabits, completion: totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0 },
            notes: { total: totalNotes },
            files: { total: totalFiles, totalSize },
            quote, recentTasks, date: today
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
