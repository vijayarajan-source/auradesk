import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../api'
import { Plus, X, Check, Circle, CheckCircle2, Calendar, ChevronRight, Trash2, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS = ['low', 'medium', 'high']
const STATUS_OPTIONS = ['todo', 'in_progress', 'done']
const VIEWS = ['Daily', 'Weekly', 'Monthly']

function TaskCard({ task, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(task.title)

    async function toggleDone() {
        await onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
    }

    async function saveTitle() {
        if (title.trim() && title !== task.title) await onUpdate(task.id, { title })
        setEditing(false)
    }

    async function cyclePriority() {
        const idx = PRIORITY_OPTIONS.indexOf(task.priority)
        await onUpdate(task.id, { priority: PRIORITY_OPTIONS[(idx + 1) % 3] })
    }

    return (
        <div className={`glass-card p-4 flex items-start gap-3 transition-all duration-300 group ${task.status === 'done' ? 'opacity-60' : ''}`}>
            <button onClick={toggleDone} className="mt-0.5 shrink-0 transition-colors hover:scale-110">
                {task.status === 'done'
                    ? <CheckCircle2 size={20} className="text-gold-500" />
                    : <Circle size={20} className="text-gray-300 group-hover:text-gold-400" />}
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                        onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()}
                        className="w-full text-sm font-medium bg-transparent border-b border-gold-300 outline-none pb-1" />
                ) : (
                    <p className={`text-sm font-medium text-gray-800 cursor-text ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}
                        onClick={() => setEditing(true)}>{task.title}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button onClick={cyclePriority} className={`priority-${task.priority} cursor-pointer hover:opacity-80 transition-opacity`}>
                        {task.priority}
                    </button>
                    {task.due_date && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={10} /> {task.due_date}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-xl hover:bg-gold-50 text-gray-400 hover:text-gold-600">
                    <Edit3 size={14} />
                </button>
                <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )
}

function AddTaskModal({ onAdd, onClose }) {
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', status: 'todo' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    async function submit(e) {
        e.preventDefault()
        if (!form.title.trim()) return toast.error('Task title is required')
        await onAdd(form)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">New Task</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                </div>
                <form onSubmit={submit} className="space-y-3">
                    <input className="input-field" placeholder="Task title..." value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
                    <textarea className="input-field resize-none" placeholder="Description (optional)" rows={2}
                        value={form.description} onChange={e => set('description', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Priority</label>
                            <select className="input-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Due Date</label>
                            <input type="date" className="input-field" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="ghost-btn flex-1">Cancel</button>
                        <button type="submit" className="gold-btn flex-1">Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function Planner() {
    const [tasks, setTasks] = useState([])
    const [view, setView] = useState('Daily')
    const [showAdd, setShowAdd] = useState(false)
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => { load() }, [])

    async function load() {
        try {
            setLoading(true)
            setTasks(await getTasks())
        } catch { toast.error('Failed to load tasks') }
        finally { setLoading(false) }
    }

    async function handleAdd(data) {
        try {
            const t = await createTask(data)
            setTasks(prev => [t, ...prev])
            toast.success('Task added!')
        } catch { toast.error('Failed to add task') }
    }

    async function handleUpdate(id, data) {
        try {
            const updated = await updateTask(id, data)
            setTasks(prev => prev.map(t => t.id === id ? updated : t))
        } catch { toast.error('Failed to update task') }
    }

    async function handleDelete(id) {
        try {
            await deleteTask(id)
            setTasks(prev => prev.filter(t => t.id !== id))
            toast.success('Task removed')
        } catch { toast.error('Failed to delete task') }
    }

    const filtered = tasks.filter(t => filter === 'all' ? true : t.priority === filter || t.status === filter)
    const todo = filtered.filter(t => t.status === 'todo')
    const inProgress = filtered.filter(t => t.status === 'in_progress')
    const done = filtered.filter(t => t.status === 'done')

    const COLS = [
        { label: 'To Do', tasks: todo, color: 'text-gray-600', bg: 'bg-gray-50', status: 'todo' },
        { label: 'In Progress', tasks: inProgress, color: 'text-gold-600', bg: 'bg-gold-50', status: 'in_progress' },
        { label: 'Done', tasks: done, color: 'text-green-600', bg: 'bg-green-50', status: 'done' },
    ]

    return (
        <div className="space-y-6 page-enter">
            {showAdd && <AddTaskModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Planner</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tasks total</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="gold-btn flex items-center gap-2">
                    <Plus size={16} /> New Task
                </button>
            </div>

            {/* View Tabs */}
            <div className="flex gap-1 p-1 glass-card w-fit">
                {VIEWS.map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${view === v ? 'bg-gold-gradient text-white shadow-gold-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                        {v}
                    </button>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'high', 'medium', 'low', 'in_progress'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${filter === f ? 'border-gold-400 text-gold-700 bg-gold-50' : 'border-gray-200 text-gray-500 hover:border-gold-200'}`}>
                        {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {COLS.map(({ label, tasks: colTasks, color, bg, status }) => (
                        <div key={label} className="glass-card p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${status === 'todo' ? 'bg-gray-400' : status === 'in_progress' ? 'bg-gold-500' : 'bg-green-500'}`} />
                                    <span className={`text-sm font-bold ${color}`}>{label}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${bg} ${color}`}>{colTasks.length}</span>
                            </div>
                            <div className="space-y-2">
                                {colTasks.length === 0
                                    ? <p className="text-xs text-gray-300 text-center py-4">No tasks here</p>
                                    : colTasks.map(t => (
                                        <TaskCard key={t.id} task={t} onUpdate={handleUpdate} onDelete={handleDelete} />
                                    ))}
                            </div>
                            {status === 'todo' && (
                                <button onClick={() => setShowAdd(true)}
                                    className="w-full flex items-center justify-center gap-1 py-2 rounded-2xl border border-dashed border-gold-200 text-xs text-gold-500 hover:bg-gold-50 transition-colors">
                                    <Plus size={12} /> Add task
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
