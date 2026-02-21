const { createClient } = require('@libsql/client');
const path = require('path');

// Use TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for cloud, or local file fallback
const isCloud = !!process.env.TURSO_DATABASE_URL;

const db = createClient(
    isCloud
        ? {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        }
        : {
            url: `file:${path.join(__dirname, 'auradesk.db')}`,
        }
);

console.log(`Database mode: ${isCloud ? 'Turso Cloud ☁️' : 'Local SQLite 💾'}`);

async function initDb() {
    await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      folder TEXT DEFAULT 'General',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      frequency TEXT DEFAULT 'daily',
      color TEXT DEFAULT '#C9A84C',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      UNIQUE(habit_id, completed_date)
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT 'application/octet-stream',
      encrypted INTEGER DEFAULT 0,
      folder TEXT DEFAULT 'General',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      author TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

    // Seed quotes
    const { rows } = await db.execute('SELECT COUNT(*) as cnt FROM quotes');
    if (Number(rows[0].cnt) === 0) {
        const quotes = [
            ["The secret of getting ahead is getting started.", "Mark Twain"],
            ["It always seems impossible until it's done.", "Nelson Mandela"],
            ["Don't watch the clock; do what it does. Keep going.", "Sam Levenson"],
            ["Quality is not an act, it is a habit.", "Aristotle"],
            ["The future depends on what you do today.", "Mahatma Gandhi"],
            ["You are never too old to set another goal.", "C.S. Lewis"],
            ["Believe you can and you're halfway there.", "Theodore Roosevelt"],
            ["Success is the sum of small efforts, repeated day in and day out.", "Robert Collier"],
            ["Discipline is the bridge between goals and accomplishment.", "Jim Rohn"],
            ["Focus on being productive instead of busy.", "Tim Ferriss"],
            ["The only way to do great work is to love what you do.", "Steve Jobs"],
            ["Small daily improvements over time lead to stunning results.", "Robin Sharma"],
            ["Your time is limited, don't waste it living someone else's life.", "Steve Jobs"],
            ["Start where you are. Use what you have. Do what you can.", "Arthur Ashe"],
            ["Excellence is not a destination but a continuous journey.", "Brian Tracy"],
        ];
        for (const [text, author] of quotes) {
            await db.execute({ sql: 'INSERT INTO quotes (text, author) VALUES (?, ?)', args: [text, author] });
        }
    }
}

// Helper: run a query with args, returns { rows, rowsAffected }
async function run(sql, args = []) {
    return db.execute({ sql, args });
}

// Helper: get single row or null
async function get(sql, args = []) {
    const result = await db.execute({ sql, args });
    return result.rows[0] ?? null;
}

// Helper: get all rows
async function all(sql, args = []) {
    const result = await db.execute({ sql, args });
    return result.rows;
}

module.exports = { initDb, run, get, all };
