import { useState, useEffect } from 'react'
import { getDashboard, updateTask } from '../api'
import { CheckCircle2, Circle, Flame, FileText, FolderOpen, TrendingUp, Star, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function ProgressRing({ value, size = 80, stroke = 7, color = '#C9A84C', label, sublabel }) {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (value / 100) * circ
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5E6B8" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="text-center -mt-1">
                <p className="text-xl font-bold text-gray-900">{value}%</p>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                {sublabel && <p className="text-[10px] text-gray-400">{sublabel}</p>}
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color = 'gold' }) {
    const colors = {
        gold: 'bg-gold-50 text-gold-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
    }
    return (
        <div className="glass-card-hover p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [focus, setFocus] = useState(() => localStorage.getItem('aura-focus') || '')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const d = await getDashboard()
            setData(d)
        } catch {
            toast.error('Cannot connect to AuraDesk server. Make sure the backend is running.')
        } finally {
            setLoading(false)
        }
    }

    function saveFocus(val) {
        setFocus(val)
        localStorage.setItem('aura-focus', val)
    }

    async function toggleTask(task) {
        try {
            await updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
            loadData()
        } catch { toast.error('Failed to update task') }
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gold-600 font-semibold tracking-wide uppercase">{today}</p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-0.5">Good day ✨</h1>
                </div>
                <button onClick={loadData} className="ghost-btn !px-3 !py-2">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Daily Focus */}
            <div className="glass-card p-6">
                <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star size={12} /> Daily Focus
                </p>
                <textarea
                    value={focus}
                    onChange={e => saveFocus(e.target.value)}
                    placeholder="What's your most important goal today? Write it here..."
                    className="w-full bg-transparent text-lg font-medium text-gray-800 resize-none outline-none placeholder-gray-300 leading-relaxed"
                    rows={2}
                />
            </div>

            {/* Stats Cards */}
            {data && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={CheckCircle2} label="Tasks Done" value={`${data.tasks.done}/${data.tasks.total}`} color="gold" />
                    <StatCard icon={Flame} label="Habits Today" value={`${data.habits.completedToday}/${data.habits.total}`} color="red" />
                    <StatCard icon={FileText} label="Notes" value={data.notes.total} color="blue" />
                    <StatCard icon={FolderOpen} label="Files" value={data.files.total} color="green" />
                </div>
            )}

            {/* Progress Rings + Quote */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Progress */}
                {data && (
                    <div className="glass-card p-6">
                        <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={12} /> Progress Overview
                        </p>
                        <div className="flex justify-around">
                            <ProgressRing value={data.tasks.completion} label="Tasks" sublabel="completion" />
                            <ProgressRing value={data.habits.completion} label="Habits" sublabel="today" color="#E86C6C" />
                        </div>
                    </div>
                )}

                {/* Motivational Quote */}
                {data?.quote && (
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="absolute top-3 right-4 text-7xl text-gold-100 font-serif leading-none select-none">"</div>
                        <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-4">Quote of the Day</p>
                        <p className="text-base font-medium text-gray-800 leading-relaxed italic relative z-10">
                            "{data.quote.text}"
                        </p>
                        <p className="text-sm text-gold-600 font-semibold mt-3">— {data.quote.author}</p>
                    </div>
                )}
            </div>

            {/* Recent Tasks */}
            {data?.recentTasks?.length > 0 && (
                <div className="glass-card p-6">
                    <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 size={12} /> Pending Tasks
                    </p>
                    <div className="space-y-2">
                        {data.recentTasks.map(task => (
                            <div key={task.id} onClick={() => toggleTask(task)}
                                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gold-50 cursor-pointer transition-colors group">
                                <Circle size={18} className="text-gray-300 group-hover:text-gold-400 transition-colors shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                    {task.due_date && <p className="text-xs text-gray-400">{task.due_date}</p>}
                                </div>
                                <span className={`priority-${task.priority}`}>{task.priority}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!data && (
                <div className="glass-card p-8 text-center">
                    <p className="text-gray-500">Start the AuraDesk server to see your data.</p>
                    <code className="block mt-2 text-sm bg-gray-50 rounded-xl p-3 text-gray-600">node server/index.js</code>
                </div>
            )}
        </div>
    )
}
