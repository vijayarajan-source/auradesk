import { useState } from 'react';
import { Sparkles, Server, ArrowRight, Loader } from 'lucide-react';
import { setCustomApiUrl, checkHealth } from '../api';
import toast from 'react-hot-toast';

export default function SetupConnection() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleConnect(e) {
        e.preventDefault();
        if (!url.startsWith('http')) {
            return toast.error('URL must start with http:// or https://');
        }
        setLoading(true);
        try {
            await checkHealth(url);
            toast.success('Connected to backend! Loading AuraDesk...');

            // Artificial delay so the success animation finishes
            setTimeout(() => {
                setCustomApiUrl(url);
            }, 1000);
        } catch (err) {
            toast.error('Could not connect. Is your Render backend running?');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'linear-gradient(135deg, #FAFAFA 0%, #FFF8EC 50%, #FFFCF0 100%)' }}>
            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-3xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold animate-float">
                        <Server size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Backend</h1>
                    <p className="text-sm text-gold-600 font-medium mt-0.5">Missing API Connection</p>
                </div>

                <div className="glass-card p-8 shadow-glass-lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Almost there! ✨</h2>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Your shiny frontend is securely deployed on Vercel, but it doesn't know where the backend API is.
                        Please paste your <b>Render web service URL</b> below.
                    </p>

                    <form onSubmit={handleConnect} className="space-y-4">
                        <input
                            type="url"
                            className="input-field"
                            placeholder="e.g. https://auradesk-api.onrender.com"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            disabled={loading}
                            required
                        />

                        <button type="submit" disabled={loading} className="gold-btn w-full flex justify-center items-center gap-2">
                            {loading ? <Loader size={16} className="animate-spin" /> : 'Connect API'}
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-aura-border text-xs text-gray-400 text-center">
                        Or, add <code>VITE_API_URL</code> to your Vercel project settings and redeploy.
                    </div>
                </div>
            </div>
        </div>
    );
}
