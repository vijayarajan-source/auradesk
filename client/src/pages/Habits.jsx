import { useState, useEffect } from 'react'
import { getHabits, createHabit, deleteHabit, logHabit, getHabitHeatmap } from '../api'
import { Plus, X, Flame, Trophy, Check, Trash2, Award, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#C9A84C', '#E86C6C', '#6C9CE8', '#6CE8A4', '#C86CE8', '#E8A46C', '#6CE8E8']
const BADGE_THRESHOLDS = [
    { days: 3, label: '3-Day Spark', icon: '⚡', color: 'text-yellow-500' },
    { days: 7, label: 'Week Warrior', icon: '🔥', color: 'text-orange-500' },
    { days: 14, label: '2-Week Hero', icon: '🦸', color: 'text-blue-500' },
    { days: 30, label: 'Month Master', icon: '👑', color: 'text-gold-500' },
    { days: 60, label: '60-Day Legend', icon: '🏆', color: 'text-purple-500' },
    { days: 100, label: 'Century Club', icon: '💎', color: 'text-cyan-500' },
]

function HeatmapGrid({ habitId }) {
    const [data, setData] = useState([])

    useEffect(() => {
        getHabitHeatmap(habitId).then(setData).catch(() => { })
    }, [habitId])

    const now = new Date()
    const weeks = 16
    const days = weeks * 7
    const logSet = new Set(data.map(d => d.completed_date))

    const cells = []
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        cells.push({ key, done: logSet.has(key) })
    }

    return (
        <div className="flex gap-0.5 flex-wrap mt-3" style={{ maxWidth: '100%' }}>
            {cells.map((c, i) => (
                <div key={i} title={c.key}
                    className={`w-3 h-3 rounded-sm transition-all ${c.done ? 'bg-gold-400 shadow-gold-sm' : 'bg-gold-100'}`} />
            ))}
        </div>
    )
}

function AddHabitModal({ onAdd, onClose }) {
    const [form, setForm] = useState({ name: '', description: '', frequency: 'daily', color: COLORS[0] })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    async function submit(e) {
        e.preventDefault()
        if (!form.name.trim()) return toast.error('Name required')
        await onAdd(form)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold">New Habit</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                </div>
                <form onSubmit={submit} className="space-y-3">
                    <input className="input-field" placeholder="Habit name (e.g. Morning Run)" value={form.name}
                        onChange={e => set('name', e.target.value)} autoFocus />
                    <textarea className="input-field resize-none" placeholder="Why this habit?" rows={2}
                        value={form.description} onChange={e => set('description', e.target.value)} />
                    <select className="input-field" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">Color</p>
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button key={c} type="button" onClick={() => set('color', c)}
                                    className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gold-400 scale-110' : ''}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="ghost-btn flex-1">Cancel</button>
                        <button type="submit" className="gold-btn flex-1">Add Habit</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function Habits() {
    const [habits, setHabits] = useState([])
    const [showAdd, setShowAdd] = useState(false)
    const [expanded, setExpanded] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { load() }, [])

    async function load() {
        try { setLoading(true); setHabits(await getHabits()) }
        catch { toast.error('Failed to load habits') }
        finally { setLoading(false) }
    }

    async function handleAdd(data) {
        try {
            const h = await createHabit(data)
            setHabits(prev => [{ ...h, streak: 0, completedToday: false, totalDone: 0 }, ...prev])
            toast.success('Habit added! 🔥')
        } catch { toast.error('Failed to add habit') }
    }

    async function handleLog(habit) {
        try {
            const result = await logHabit(habit.id)
            setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedToday: result.completed, streak: result.streak, totalDone: h.totalDone + (result.completed ? 1 : -1) } : h))
            if (result.completed) toast.success(`✅ ${habit.name} done! Streak: ${result.streak} 🔥`)
        } catch { toast.error('Failed to log habit') }
    }

    async function handleDelete(id, e) {
        e.stopPropagation()
        if (!confirm('Delete this habit and all logs?')) return
        try {
            await deleteHabit(id)
            setHabits(prev => prev.filter(h => h.id !== id))
            toast.success('Habit removed')
        } catch { toast.error('Failed to delete') }
    }

    const totalCompleted = habits.filter(h => h.completedToday).length
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0)

    return (
        <div className="space-y-6 page-enter">
            {showAdd && <AddHabitModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{totalCompleted}/{habits.length} done today</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="gold-btn flex items-center gap-2">
                    <Plus size={16} /> New Habit
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="glass-card-hover p-4 text-center">
                    <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Flame size={20} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{maxStreak}</p>
                    <p className="text-xs text-gray-500 font-medium">Best Streak</p>
                </div>
                <div className="glass-card-hover p-4 text-center">
                    <div className="w-10 h-10 bg-gold-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Check size={20} className="text-gold-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
                    <p className="text-xs text-gray-500 font-medium">Done Today</p>
                </div>
                <div className="glass-card-hover p-4 text-center">
                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Target size={20} className="text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{habits.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Total Habits</p>
                </div>
            </div>

            {/* Badges */}
            {habits.some(h => h.streak >= 3) && (
                <div className="glass-card p-4">
                    <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Trophy size={12} /> Achievements Unlocked
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {BADGE_THRESHOLDS.map(badge => {
                            const unlocked = habits.some(h => h.streak >= badge.days || h.totalDone >= badge.days)
                            return unlocked ? (
                                <div key={badge.days} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold-50 border border-gold-200">
                                    <span className="text-base">{badge.icon}</span>
                                    <span className={`text-xs font-bold ${badge.color}`}>{badge.label}</span>
                                </div>
                            ) : null
                        })}
                    </div>
                </div>
            )}

            {/* Habit List */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : habits.length === 0 ? (
                <div className="glass-card p-10 text-center">
                    <div className="w-20 h-20 bg-gold-soft rounded-3xl flex items-center justify-center mx-auto mb-4 animate-float">
                        <Flame size={36} className="text-gold-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700">No habits yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start building your streak today</p>
                    <button onClick={() => setShowAdd(true)} className="gold-btn mt-4">Add First Habit</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {habits.map(habit => (
                        <div key={habit.id} className="glass-card overflow-hidden">
                            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === habit.id ? null : habit.id)}>
                                {/* Color dot + check */}
                                <button onClick={e => { e.stopPropagation(); handleLog(habit) }}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm`}
                                    style={{ background: habit.completedToday ? habit.color : 'transparent', border: `2px solid ${habit.color}` }}>
                                    {habit.completedToday && <Check size={20} className="text-white" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{habit.name}</p>
                                    {habit.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{habit.description}</p>}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: habit.color }}>
                                            <Flame size={11} /> {habit.streak} day streak
                                        </span>
                                        <span className="text-xs text-gray-400">{habit.totalDone} total</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {habit.completedToday && (
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-xl">✓ Done</span>
                                    )}
                                    <button onClick={e => handleDelete(habit.id, e)} className="p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded heatmap */}
                            {expanded === habit.id && (
                                <div className="px-4 pb-4 border-t border-aura-border pt-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Last 16 Weeks</p>
                                    <HeatmapGrid habitId={habit.id} key={habit.id} />
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-3 h-3 rounded-sm bg-gold-100" />
                                        <span className="text-xs text-gray-400">No activity</span>
                                        <div className="w-3 h-3 rounded-sm bg-gold-400 ml-3" />
                                        <span className="text-xs text-gray-400">Completed</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
