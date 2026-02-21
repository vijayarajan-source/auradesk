import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, CalendarDays, BookOpen, Flame, FolderLock, Sparkles, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Planner from './pages/Planner'
import NotesVault from './pages/NotesVault'
import Habits from './pages/Habits'
import FileLocker from './pages/FileLocker'

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/planner', label: 'Planner', icon: CalendarDays },
    { path: '/notes', label: 'Notes', icon: BookOpen },
    { path: '/habits', label: 'Habits', icon: Flame },
    { path: '/files', label: 'Files', icon: FolderLock },
]

function Sidebar() {
    const { user, logout } = useAuth()
    return (
        <aside className="hidden lg:flex flex-col w-64 min-h-screen glass-card m-3 mr-0 rounded-3xl p-5 gap-2 sticky top-3 self-start" style={{ height: 'calc(100vh - 24px)' }}>
            <div className="flex items-center gap-3 px-2 pb-6 pt-2">
                <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-sm animate-float">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                    <span className="font-bold text-lg text-gray-900 tracking-tight">AuraDesk</span>
                    <p className="text-xs text-gold-600 font-medium">Your Private Studio</p>
                </div>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                        <Icon size={18} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User info + logout */}
            <div className="glass-card p-4 mt-4">
                {user && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button onClick={logout}
                    className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors py-1">
                    <LogOut size={12} /> Sign out
                </button>
            </div>
        </aside>
    )
}

function BottomNav() {
    const { logout } = useAuth()
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="mx-3 mb-3 glass-card shadow-glass-lg border border-aura-border px-2 py-2 flex justify-around">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icon size={20} />
                        <span className="text-[10px]">{label}</span>
                    </NavLink>
                ))}
                <button onClick={logout} className="nav-item">
                    <LogOut size={20} />
                    <span className="text-[10px]">Out</span>
                </button>
            </div>
        </nav>
    )
}

function AppContent() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-gold animate-pulse">
                        <Sparkles size={22} className="text-white" />
                    </div>
                    <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    if (!user) return <LoginPage />

    return (
        <div className="flex min-h-screen relative">
            <div className="bg-orb w-96 h-96 bg-gold-200 top-[-100px] right-[-100px]" />
            <div className="bg-orb w-80 h-80 bg-cream-200 bottom-[-80px] left-[-80px]" />
            <Sidebar />
            <main className="flex-1 relative z-10">
                <div className="max-w-5xl mx-auto px-4 py-6 pb-28 lg:pb-8 main-scroll">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/planner" element={<Planner />} />
                        <Route path="/notes" element={<NotesVault />} />
                        <Route path="/habits" element={<Habits />} />
                        <Route path="/files" element={<FileLocker />} />
                    </Routes>
                </div>
            </main>
            <BottomNav />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(201,168,76,0.2)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(201,168,76,0.12)',
                            color: '#1a1a1a',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#C9A84C', secondary: '#FFF' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#FFF' } },
                    }}
                />
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    )
}
