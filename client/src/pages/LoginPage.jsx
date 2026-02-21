import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const { login, register, hasUsers } = useAuth()
    const [mode, setMode] = useState(hasUsers === false ? 'register' : 'login')
    const [step, setStep] = useState(1) // Google-style: email first, then password
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    async function handleEmailStep(e) {
        e.preventDefault()
        if (!form.email.includes('@')) return toast.error('Enter a valid email')
        setStep(2)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.password) return toast.error('Enter your password')
        setLoading(true)
        try {
            if (mode === 'login') {
                await login(form.email, form.password)
            } else {
                if (!form.name.trim()) return toast.error('Enter your name')
                if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
                await register(form.name, form.email, form.password)
                toast.success('Account created! Welcome to AuraDesk ✨')
            }
        } catch (err) {
            const msg = err?.response?.data?.error || 'Something went wrong'
            toast.error(msg)
            if (msg.includes('password') || msg.includes('email')) setStep(2)
        } finally {
            setLoading(false)
        }
    }

    function switchMode() {
        setMode(m => m === 'login' ? 'register' : 'login')
        setStep(1)
        setForm({ name: '', email: '', password: '' })
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'linear-gradient(135deg, #FAFAFA 0%, #FFF8EC 50%, #FFFCF0 100%)' }}>

            {/* Background orbs */}
            <div className="fixed w-96 h-96 rounded-full bg-gold-200 opacity-30 blur-3xl top-[-80px] right-[-80px] pointer-events-none" />
            <div className="fixed w-80 h-80 rounded-full bg-cream-200 opacity-40 blur-3xl bottom-[-60px] left-[-60px] pointer-events-none" />

            <div className="w-full max-w-sm animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-3xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold animate-float">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AuraDesk</h1>
                    <p className="text-sm text-gold-600 font-medium mt-0.5">Your Private Studio</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 shadow-glass-lg">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {mode === 'login' ? 'Sign in' : 'Create account'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-7">
                        {mode === 'login'
                            ? 'to continue to AuraDesk'
                            : 'to get started with AuraDesk'}
                    </p>

                    {/* Step 1: Name (register only) + Email */}
                    {step === 1 && (
                        <form onSubmit={handleEmailStep} className="space-y-4 animate-fade-in">
                            {mode === 'register' && (
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        className="input-field pl-10"
                                        placeholder="First and last name"
                                        value={form.name}
                                        onChange={e => set('name', e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="input-field pl-10"
                                    placeholder="Email address"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    autoFocus={mode === 'login'}
                                    required
                                />
                            </div>

                            {mode === 'login' && (
                                <p className="text-xs text-gray-500">
                                    Not your device?{' '}
                                    <a href="#" className="text-gold-600 hover:underline font-medium">Use private browsing</a>
                                </p>
                            )}

                            <button type="submit" className="gold-btn w-full flex items-center justify-center gap-2">
                                Next <ArrowRight size={15} />
                            </button>
                        </form>
                    )}

                    {/* Step 2: Password */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                            {/* Email display (Google style) */}
                            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer"
                                onClick={() => setStep(1)}>
                                <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {(form.name || form.email)[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate flex-1">{form.email}</span>
                                <span className="text-xs text-gold-600 font-medium">▾</span>
                            </div>

                            <div>
                                <p className="text-base font-semibold text-gray-800 mb-4">
                                    {mode === 'login' ? 'Welcome back' : 'Create a password'}
                                </p>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="input-field pl-10 pr-10"
                                        placeholder={mode === 'login' ? 'Password' : 'Create password (min 6 chars)'}
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        autoFocus
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {mode === 'login' && (
                                <a href="#" className="block text-xs text-gold-600 hover:underline font-medium">
                                    Forgot password?
                                </a>
                            )}

                            <button type="submit" disabled={loading}
                                className="gold-btn w-full flex items-center justify-center gap-2 disabled:opacity-70">
                                {loading
                                    ? <><Loader size={15} className="animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                                    : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></>}
                            </button>
                        </form>
                    )}

                    {/* Divider + Toggle mode */}
                    <div className="mt-6 pt-5 border-t border-aura-border flex items-center justify-between">
                        <button onClick={switchMode}
                            className="text-sm font-semibold text-gold-600 hover:text-gold-700 transition-colors">
                            {mode === 'login' ? 'Create account' : 'Sign in instead'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    🔒 Your data is private and secured
                </p>
            </div>
        </div>
    )
}
