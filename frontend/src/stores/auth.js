import { defineStore } from 'pinia';
import api from '../api';

const safeParseJSON = (str) => {
    try {
        return str && str !== 'undefined' ? JSON.parse(str) : null;
    } catch (e) {
        return null;
    }
};

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: safeParseJSON(localStorage.getItem('user')),
        token: localStorage.getItem('token') || null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'admin',
        isFirstLogin: (state) => state.user?.isFirstLogin,
    },
    actions: {
        async login(username, password) {
            try {
                const { data } = await api.post('/auth/login', { username, password });
                this.setAuth(data.user, data.access_token);
                return true;
            } catch (err) {
                throw new Error(err.response?.data?.message || 'Login failed');
            }
        },
        async changePassword(oldPassword, newPassword) {
            try {
                const { data } = await api.post('/auth/change-password', { oldPassword, newPassword });
                this.setAuth(data.user, data.access_token);
                return true;
            } catch (err) {
                throw new Error(err.response?.data?.message || 'Failed to change password');
            }
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            // A full page reload ensures all state is cleared
            window.location.href = '/login';
        },
        setAuth(user, token) {
            this.user = user;
            this.token = token;
            localStorage.setItem('user', JSON.stringify(user));
            if (token) {
                localStorage.setItem('token', token);
            }
        }
    }
});
