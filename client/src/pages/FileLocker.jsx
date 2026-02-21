import { useState, useEffect, useRef, useCallback } from 'react'
import { getFiles, getFileFolders, uploadFile, deleteFile } from '../api'
import { Upload, Folder, Trash2, Download, FileText, Image, Film, Music, Archive, File, X, Lock, FolderOpen, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

function fileIcon(mime) {
    if (!mime) return File
    if (mime.startsWith('image/')) return Image
    if (mime.startsWith('video/')) return Film
    if (mime.startsWith('audio/')) return Music
    if (mime.includes('pdf') || mime.includes('text')) return FileText
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) return Archive
    return File
}

function fileSize(bytes) {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePreviewModal({ file, onClose }) {
    const url = `/uploads/${file.name}`
    const isImage = file.mime_type?.startsWith('image/')
    const isPDF = file.mime_type?.includes('pdf')
    const isText = file.mime_type?.includes('text')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card w-full max-w-3xl max-h-[85vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-aura-border">
                    <p className="font-semibold text-gray-800 truncate">{file.original_name}</p>
                    <div className="flex gap-2">
                        <a href={url} download={file.original_name} className="ghost-btn !px-3 !py-2 flex items-center gap-1.5 text-xs">
                            <Download size={13} /> Download
                        </a>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                    {isImage ? (
                        <img src={url} alt={file.original_name} className="max-w-full max-h-full rounded-2xl object-contain shadow-glass" />
                    ) : isPDF ? (
                        <iframe src={url} className="w-full h-full min-h-96 rounded-2xl" title={file.original_name} />
                    ) : (
                        <div className="text-center">
                            <File size={48} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Preview not available</p>
                            <a href={url} download={file.original_name} className="gold-btn mt-4 inline-flex items-center gap-2">
                                <Download size={14} /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function FileLocker() {
    const [files, setFiles] = useState([])
    const [folders, setFolders] = useState([])
    const [activeFolder, setActiveFolder] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // grid or list
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(null)
    const [newFolder, setNewFolder] = useState('General')
    const [encrypted, setEncrypted] = useState(false)
    const fileInput = useRef(null)

    useEffect(() => { load() }, [activeFolder])

    async function load() {
        try {
            const params = activeFolder ? { folder: activeFolder } : {}
            const [f, fol] = await Promise.all([getFiles(params), getFileFolders()])
            setFiles(f)
            setFolders(fol)
        } catch { toast.error('Failed to load files') }
    }

    const handleUpload = useCallback(async (fileList) => {
        if (!fileList?.length) return
        setUploading(true)
        let success = 0
        for (const file of Array.from(fileList)) {
            try {
                const fd = new FormData()
                fd.append('file', file)
                fd.append('folder', newFolder)
                fd.append('encrypted', encrypted ? '1' : '0')
                await uploadFile(fd)
                success++
            } catch { toast.error(`Failed to upload ${file.name}`) }
        }
        if (success) toast.success(`${success} file(s) uploaded!`)
        setUploading(false)
        load()
    }, [newFolder, encrypted])

    async function handleDelete(file, e) {
        e.stopPropagation()
        if (!confirm(`Delete "${file.original_name}"?`)) return
        try {
            await deleteFile(file.id)
            setFiles(prev => prev.filter(f => f.id !== file.id))
            load()
            toast.success('File deleted')
        } catch { toast.error('Failed to delete') }
    }

    const onDrop = (e) => {
        e.preventDefault(); setDragging(false)
        handleUpload(e.dataTransfer.files)
    }

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)

    return (
        <div className="space-y-6 page-enter">
            {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">File Locker</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{files.length} files · {fileSize(totalSize)}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="ghost-btn !px-3 !py-2 text-xs">
                        {viewMode === 'grid' ? '☰ List' : '⊞ Grid'}
                    </button>
                    <button onClick={() => fileInput.current?.click()} className="gold-btn flex items-center gap-2">
                        <Upload size={16} /> Upload
                    </button>
                    <input ref={fileInput} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Sidebar: folders */}
                <div className="lg:col-span-1 space-y-3">
                    {/* Upload settings */}
                    <div className="glass-card p-4 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upload To</p>
                        <select className="input-field text-xs" value={newFolder} onChange={e => setNewFolder(e.target.value)}>
                            {['General', 'Documents', 'Images', 'Videos', 'Archives', 'Private'].map(f => (
                                <option key={f}>{f}</option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-8 h-5 rounded-full transition-all ${encrypted ? 'bg-gold-gradient' : 'bg-gray-200'} relative`}
                                onClick={() => setEncrypted(e => !e)}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${encrypted ? 'left-3.5' : 'left-0.5'}`} />
                            </div>
                            <Lock size={12} className={encrypted ? 'text-gold-600' : 'text-gray-400'} />
                            <span className="text-xs text-gray-600 font-medium">Encrypt</span>
                        </label>
                    </div>

                    {/* Folder list */}
                    <div className="glass-card p-3 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Folders</p>
                        <button onClick={() => setActiveFolder(null)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${!activeFolder ? 'bg-gold-50 text-gold-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <FolderOpen size={14} /> All Files
                            <span className="ml-auto text-xs text-gray-400">{files.length}</span>
                        </button>
                        {folders.map(f => (
                            <button key={f.folder} onClick={() => setActiveFolder(f.folder)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeFolder === f.folder ? 'bg-gold-50 text-gold-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Folder size={14} /> {f.folder}
                                <span className="ml-auto text-xs text-gray-400">{f.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main: upload zone + file grid */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInput.current?.click()}
                        className={`glass-card border-2 border-dashed p-8 text-center cursor-pointer transition-all
              ${dragging ? 'border-gold-400 bg-gold-50 scale-[1.01]' : 'border-gold-200 hover:border-gold-300 hover:bg-gold-50/50'}`}>
                        <div className={`w-12 h-12 bg-gold-soft rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform ${dragging ? 'scale-110 animate-float' : ''}`}>
                            <Upload size={22} className="text-gold-500" />
                        </div>
                        {uploading ? (
                            <><p className="text-sm font-semibold text-gold-600">Uploading...</p>
                                <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" /></>
                        ) : (
                            <><p className="text-sm font-semibold text-gray-700">Drop files here or click to browse</p>
                                <p className="text-xs text-gray-400 mt-1">Max 100MB per file</p></>
                        )}
                    </div>

                    {/* Files */}
                    {files.length === 0 ? (
                        <div className="glass-card p-10 text-center">
                            <File size={32} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No files in this folder</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                            {files.map(file => {
                                const Icon = fileIcon(file.mime_type)
                                const isImage = file.mime_type?.startsWith('image/')
                                return (
                                    <div key={file.id} className="glass-card-hover p-4 flex flex-col items-center gap-3 cursor-pointer group"
                                        onClick={() => setPreview(file)}>
                                        <div className="relative">
                                            {isImage ? (
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                                                    <img src={`/uploads/${file.name}`} alt={file.original_name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 bg-gold-soft rounded-2xl flex items-center justify-center">
                                                    <Icon size={28} className="text-gold-500" />
                                                </div>
                                            )}
                                            {file.encrypted === 1 && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold-gradient rounded-full flex items-center justify-center">
                                                    <Lock size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center w-full">
                                            <p className="text-xs font-semibold text-gray-800 truncate w-full">{file.original_name}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{fileSize(file.size)}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={e => { e.stopPropagation(); setPreview(file) }}
                                                className="p-1.5 rounded-xl hover:bg-gold-50 text-gray-400 hover:text-gold-600"><Eye size={13} /></button>
                                            <a href={`/uploads/${file.name}`} download={file.original_name} onClick={e => e.stopPropagation()}
                                                className="p-1.5 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-500"><Download size={13} /></a>
                                            <button onClick={e => handleDelete(file, e)}
                                                className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map(file => {
                                const Icon = fileIcon(file.mime_type)
                                return (
                                    <div key={file.id} className="glass-card-hover p-4 flex items-center gap-4 cursor-pointer group"
                                        onClick={() => setPreview(file)}>
                                        <div className="w-10 h-10 bg-gold-soft rounded-xl flex items-center justify-center shrink-0">
                                            <Icon size={18} className="text-gold-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{file.original_name}</p>
                                                {file.encrypted === 1 && <Lock size={12} className="text-gold-500 shrink-0" />}
                                            </div>
                                            <p className="text-xs text-gray-400">{file.folder} · {fileSize(file.size)} · {file.created_at?.slice(0, 10)}</p>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`/uploads/${file.name}`} download={file.original_name} onClick={e => e.stopPropagation()}
                                                className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-500"><Download size={14} /></a>
                                            <button onClick={e => handleDelete(file, e)}
                                                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
