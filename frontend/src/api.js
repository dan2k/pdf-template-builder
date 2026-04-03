import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Add Auth Token automatically to Requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const templatesApi = {
  getAll: () => api.get('/templates'),
  getOne: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  duplicate: (id, data) => api.post(`/templates/${id}/copy`, data),
}

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const usersApi = {
  getAll: () => api.get('/users'),
  getVisible: () => api.get('/users/visible'),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
}


export const generateApi = {
  generate: (id, data) => api.post(`/templates/${id}/generate`, data, { responseType: 'blob' }),
  preview: (id, data) => api.post(`/templates/${id}/preview`, data, { responseType: 'blob' }),
}

export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const fontsApi = {
  getAll: () => api.get('/fonts'),
  getAllAdmin: () => api.get('/fonts/all'),
  toggleVisibility: (key, hidden) => api.patch(`/fonts/${key}/visibility`, { hidden }),
  deleteFont: (key) => api.delete(`/fonts/${key}`),
  reloadFonts: () => api.post('/fonts/reload'),
  uploadFont: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/fonts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const importApi = {
  importPdf: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/import/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const aiApi = {
  transform: (prompt, elements, provider, model) => api.post('/ai/transform', { prompt, elements, provider, model })
}

export const settingsApi = {
  getAi: () => api.get('/settings/ai'),
  saveAi: (data) => api.post('/settings/ai', data),
  getProviders: () => api.get('/settings/ai/providers'),
  saveProviders: (data) => api.post('/settings/ai/providers', data)
}

export default api
