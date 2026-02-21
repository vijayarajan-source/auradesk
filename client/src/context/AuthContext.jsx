import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [hasUsers, setHasUsers] = useState(null)

    // Set axios auth header globally
    function setToken(token) {
        if (token) {
            localStorage.setItem('aura_token', token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            localStorage.removeItem('aura_token')
            delete axios.defaults.headers.common['Authorization']
        }
    }

    useEffect(() => {
        async function init() {
            // Check if any users exist (first-run detection)
            try {
                const { data } = await axios.get(`${BASE_URL}/auth/hasUsers`)
                setHasUsers(data.hasUsers)
            } catch { setHasUsers(false) }

            // Restore session from localStorage
            const token = localStorage.getItem('aura_token')
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                    const { data } = await axios.get(`${BASE_URL}/auth/me`)
                    setUser(data.user)
                } catch {
                    setToken(null)
                }
            }
            setLoading(false)
        }
        init()
    }, [])

    async function login(email, password) {
        const { data } = await axios.post(`${BASE_URL}/auth/login`, { email, password })
        setToken(data.token)
        setUser(data.user)
        setHasUsers(true)
        return data.user
    }

    async function register(name, email, password) {
        const { data } = await axios.post(`${BASE_URL}/auth/register`, { name, email, password })
        setToken(data.token)
        setUser(data.user)
        setHasUsers(true)
        return data.user
    }

    function logout() {
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, hasUsers, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
