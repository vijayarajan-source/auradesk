import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the Render backend.
// In dev, Vite proxy handles /api → localhost:3001
const BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
})

// ✅ Interceptor: automatically attach JWT token from localStorage to EVERY request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('aura_token')
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
})

// ✅ Interceptor: if 401, clear token and reload to show login page
api.interceptors.response.use(
    res => res,
    err => {
        if (err?.response?.status === 401) {
            localStorage.removeItem('aura_token')
            window.location.reload()
        }
        return Promise.reject(err)
    }
)

// DASHBOARD
export const getDashboard = () => api.get('/dashboard').then(r => r.data)

// TASKS
export const getTasks = (params) => api.get('/tasks', { params }).then(r => r.data)
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data)
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data)
export const getTaskStats = () => api.get('/tasks/stats').then(r => r.data)

// NOTES
export const getNotes = (params) => api.get('/notes', { params }).then(r => r.data)
export const getNote = (id) => api.get(`/notes/${id}`).then(r => r.data)
export const createNote = (data) => api.post('/notes', data).then(r => r.data)
export const updateNote = (id, data) => api.put(`/notes/${id}`, data).then(r => r.data)
export const deleteNote = (id) => api.delete(`/notes/${id}`).then(r => r.data)
export const getNoteFolders = () => api.get('/notes/folders').then(r => r.data)
export const getNoteTags = () => api.get('/notes/tags').then(r => r.data)

// HABITS
export const getHabits = () => api.get('/habits').then(r => r.data)
export const createHabit = (data) => api.post('/habits', data).then(r => r.data)
export const updateHabit = (id, data) => api.put(`/habits/${id}`, data).then(r => r.data)
export const deleteHabit = (id) => api.delete(`/habits/${id}`).then(r => r.data)
export const logHabit = (id, date) => api.post(`/habits/${id}/log`, { date }).then(r => r.data)
export const getHabitHeatmap = (id) => api.get(`/habits/${id}/heatmap`).then(r => r.data)

// FILES
export const getFiles = (params) => api.get('/files', { params }).then(r => r.data)
export const getFileFolders = () => api.get('/files/folders').then(r => r.data)
export const uploadFile = (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data)
export const deleteFile = (id) => api.delete(`/files/${id}`).then(r => r.data)

export default api
