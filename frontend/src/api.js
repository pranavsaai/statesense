import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export const compareStatements = (formData) =>
  axios.post(`${BASE_URL}/api/compare`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getComparisons = () => api.get('/api/comparisons')

export const createCycle = (data) => api.post('/api/cycles', data)
export const getCycles = () => api.get('/api/cycles')
export const getCycle = (id) => api.get(`/api/cycles/${id}`)

export const getTestCases = (cycleId) => api.get(`/api/cycles/${cycleId}/testcases`)
export const addBulkTestCases = (cycleId, cases) => api.post(`/api/cycles/${cycleId}/testcases/bulk`, cases)
export const updateTestCase = (id, data) => api.patch(`/api/testcases/${id}`, data)

export const createDefect = (data) => api.post('/api/defects', data)
export const getDefects = () => api.get('/api/defects')
export const updateDefect = (id, data) => api.patch(`/api/defects/${id}`, data)

export const runSQL = (sql) =>
  axios.post(`${BASE_URL}/api/sql/execute`, { query: sql })

export const getStats = () => api.get('/api/stats')
export const exportReport = (cycleId) =>
  axios.get(`${BASE_URL}/api/cycles/${cycleId}/export`, { responseType: 'blob' })