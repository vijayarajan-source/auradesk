import { useState, useEffect, useRef } from 'react'
import { getNotes, createNote, updateNote, deleteNote, getNoteFolders, getNoteTags } from '../api'
import { Plus, Search, X, Folder, Tag, Trash2, FileText, Save, Eye, EyeOff, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

function MarkdownPreview({ content }) {
    // Simple markdown rendering
    const html = content
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-gray-800 mt-3 mb-1">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gold-50 text-gold-700 px-1.5 py-0.5 rounded-lg text-sm font-mono">$1</code>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
        .replace(/\n/g, '<br/>')
    return <div className="prose max-w-none text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
}

export default function NotesVault() {
    const [notes, setNotes] = useState([])
    const [folders, setFolders] = useState([])
    const [tags, setTags] = useState([])
    const [selectedNote, setSelectedNote] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [editTitle, setEditTitle] = useState('')
    const [preview, setPreview] = useState(false)
    const [search, setSearch] = useState('')
    const [activeFolder, setActiveFolder] = useState(null)
    const [activeTag, setActiveTag] = useState(null)
    const [showNewNote, setShowNewNote] = useState(false)
    const [newNoteTitle, setNewNoteTitle] = useState('')
    const [newFolder, setNewFolder] = useState('General')
    const [dirty, setDirty] = useState(false)
    const saveTimer = useRef(null)

    useEffect(() => { loadAll() }, [])
    useEffect(() => { loadNotes() }, [search, activeFolder, activeTag])

    async function loadAll() {
        await Promise.all([loadNotes(), loadMeta()])
    }
    async function loadNotes() {
        try {
            const params = {}
            if (search) params.search = search
            if (activeFolder) params.folder = activeFolder
            if (activeTag) params.tag = activeTag
            setNotes(await getNotes(params))
        } catch { toast.error('Failed to load notes') }
    }
    async function loadMeta() {
        try {
            const [f, t] = await Promise.all([getNoteFolders(), getNoteTags()])
            setFolders(f)
            setTags(t)
        } catch { }
    }

    function selectNote(note) {
        setSelectedNote(note)
        setEditTitle(note.title)
        setEditContent(note.content)
        setDirty(false)
        setPreview(false)
    }

    function onContentChange(val) {
        setEditContent(val)
        setDirty(true)
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => autoSave(val, editTitle), 2000)
    }

    async function autoSave(content, title) {
        if (!selectedNote) return
        try {
            await updateNote(selectedNote.id, { content, title })
            setDirty(false)
            await loadMeta()
        } catch { }
    }

    async function saveNote() {
        if (!selectedNote) return
        try {
            await updateNote(selectedNote.id, { content: editContent, title: editTitle })
            setDirty(false)
            toast.success('Saved!')
            loadNotes()
            loadMeta()
        } catch { toast.error('Failed to save') }
    }

    async function createNewNote() {
        if (!newNoteTitle.trim()) return toast.error('Title required')
        try {
            const n = await createNote({ title: newNoteTitle, folder: newFolder, content: '', tags: [] })
            setNotes(prev => [n, ...prev])
            selectNote(n)
            setShowNewNote(false)
            setNewNoteTitle('')
            loadMeta()
            toast.success('Note created!')
        } catch { toast.error('Failed to create note') }
    }

    async function handleDelete(id, e) {
        e.stopPropagation()
        if (!confirm('Delete this note?')) return
        try {
            await deleteNote(id)
            setNotes(prev => prev.filter(n => n.id !== id))
            if (selectedNote?.id === id) { setSelectedNote(null); setEditContent(''); setEditTitle('') }
            loadMeta()
            toast.success('Note deleted')
        } catch { toast.error('Failed to delete') }
    }

    return (
        <div className="space-y-4 page-enter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notes Vault</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{notes.length} notes</p>
                </div>
                <button onClick={() => setShowNewNote(true)} className="gold-btn flex items-center gap-2">
                    <Plus size={16} /> New Note
                </button>
            </div>

            {/* New Note Modal */}
            {showNewNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowNewNote(false)}>
                    <div className="glass-card w-full max-w-sm p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">New Note</h3>
                        <input className="input-field mb-3" placeholder="Note title..." value={newNoteTitle}
                            onChange={e => setNewNoteTitle(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && createNewNote()} />
                        <select className="input-field mb-4" value={newFolder} onChange={e => setNewFolder(e.target.value)}>
                            {['General', 'Work', 'Personal', 'Ideas', 'Journal', ...folders.map(f => f.folder).filter(f => !['General', 'Work', 'Personal', 'Ideas', 'Journal'].includes(f))].map(f => (
                                <option key={f}>{f}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setShowNewNote(false)} className="ghost-btn flex-1">Cancel</button>
                            <button onClick={createNewNote} className="gold-btn flex-1">Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '70vh' }}>
                {/* Left panel: folders + note list */}
                <div className="lg:col-span-1 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="input-field pl-9" placeholder="Search notes..." value={search}
                            onChange={e => { setSearch(e.target.value); setActiveFolder(null); setActiveTag(null) }} />
                    </div>

                    {/* Folders */}
                    <div className="glass-card p-3 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Folders</p>
                        <button onClick={() => { setActiveFolder(null); setActiveTag(null); setSearch('') }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${!activeFolder && !activeTag && !search ? 'bg-gold-50 text-gold-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <FileText size={14} /> All Notes <span className="ml-auto text-xs text-gray-400">{notes.length}</span>
                        </button>
                        {folders.map(f => (
                            <button key={f.folder} onClick={() => { setActiveFolder(f.folder); setActiveTag(null); setSearch('') }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeFolder === f.folder ? 'bg-gold-50 text-gold-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Folder size={14} /> {f.folder} <span className="ml-auto text-xs text-gray-400">{f.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="glass-card p-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(t => (
                                    <button key={t} onClick={() => { setActiveTag(t); setActiveFolder(null); setSearch('') }}
                                        className={`tag-chip ${activeTag === t ? 'bg-gold-200 border-gold-400' : ''}`}>
                                        <Tag size={10} /> {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note list */}
                    <div className="space-y-2 max-h-72 lg:max-h-none overflow-y-auto">
                        {notes.map(note => (
                            <div key={note.id} onClick={() => selectNote(note)}
                                className={`glass-card p-3 cursor-pointer transition-all group ${selectedNote?.id === note.id ? 'border-gold-300 shadow-gold-sm' : ''}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{note.title}</p>
                                    <button onClick={e => handleDelete(note.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{note.content?.slice(0, 80) || 'Empty note...'}</p>
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    <span className="text-[10px] text-gold-600 bg-gold-50 px-2 py-0.5 rounded-lg font-medium">{note.folder}</span>
                                    {(Array.isArray(note.tags) ? note.tags : []).slice(0, 2).map(t => (
                                        <span key={t} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {notes.length === 0 && (
                            <div className="glass-card p-6 text-center">
                                <FileText size={24} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No notes yet</p>
                                <button onClick={() => setShowNewNote(true)} className="gold-btn mt-3 text-xs !py-2 !px-4">Create one</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel: editor */}
                <div className="lg:col-span-2">
                    {selectedNote ? (
                        <div className="glass-card p-5 h-full flex flex-col gap-3" style={{ minHeight: '60vh' }}>
                            {/* Editor header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-aura-border">
                                <input value={editTitle} onChange={e => { setEditTitle(e.target.value); setDirty(true) }}
                                    className="flex-1 text-xl font-bold text-gray-900 bg-transparent outline-none border-none"
                                    placeholder="Note title..." />
                                <div className="flex gap-2">
                                    <button onClick={() => setPreview(!preview)}
                                        className="ghost-btn !px-3 !py-2 flex items-center gap-1.5 text-xs">
                                        {preview ? <><EyeOff size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                    </button>
                                    <button onClick={saveNote} className={`gold-btn !px-3 !py-2 flex items-center gap-1.5 text-xs ${dirty ? 'animate-pulse-gold' : ''}`}>
                                        <Save size={14} /> Save
                                    </button>
                                </div>
                            </div>

                            {/* Editor or preview */}
                            {preview ? (
                                <div className="flex-1 overflow-y-auto p-1">
                                    <MarkdownPreview content={editContent} />
                                </div>
                            ) : (
                                <textarea value={editContent} onChange={e => onContentChange(e.target.value)}
                                    className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-700 font-mono leading-relaxed placeholder-gray-300"
                                    placeholder="Start writing... (Markdown supported)&#10;&#10;# Heading&#10;**bold** *italic* `code`&#10;- list item" />
                            )}

                            {dirty && <p className="text-xs text-gray-400 text-right">Auto-saves in 2s...</p>}
                        </div>
                    ) : (
                        <div className="glass-card h-full flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ minHeight: '60vh' }}>
                            <div className="w-20 h-20 rounded-3xl bg-gold-soft flex items-center justify-center animate-float">
                                <FileText size={32} className="text-gold-500" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">Select a note to edit</p>
                                <p className="text-sm text-gray-400 mt-1">Or create a new one</p>
                            </div>
                            <button onClick={() => setShowNewNote(true)} className="gold-btn">New Note</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
