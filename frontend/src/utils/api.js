import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};
export const users = {
  getCurrentUser: () => api.get('/users/me'),
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  updatePassword: (id, passwordData) => api.put(`/users/${id}/password`, passwordData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updatePushToken: (token) => api.put('/users/push-token', { pushToken: token }),
};
export const workers = {
  getWorkers: () => api.get('/workers'),
  getWorker: (id) => api.get(`/workers/${id}`), // Add this line
  getWorkerSchedule: (workerId) => api.get(`/workers/${workerId}/schedule`),
  getWorkerJobs: (workerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    return api.get(`/workers/${workerId}/jobs?${params.toString()}`);
  },
  getWorkerMetrics: (workerId) => api.get(`/workers/${workerId}/metrics`),
  createTimeEntry: (workerId, timeEntryData) => 
    api.post(`/workers/${workerId}/time-entries`, timeEntryData),
  getTimeEntries: (workerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.job_id) params.append('job_id', filters.job_id);
    return api.get(`/workers/${workerId}/time-entries?${params.toString()}`);
  },
};
export const customers = {
  getCustomers: () => api.get('/customers'),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  getCustomerJobs: (id) => api.get(`/customers/${id}/jobs`),
};
export const jobs = {
  getJobs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    return api.get(`/jobs?${params.toString()}`);
  },
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  addJobPhoto: (id, photoData) => {
    const formData = new FormData();
    formData.append('photo', photoData.file);
    if (photoData.caption) formData.append('caption', photoData.caption);
    return api.post(`/jobs/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  addJobNote: (id, note) => api.post(`/jobs/${id}/notes`, { note }),
  updateJobStatus: (id, status) => api.put(`/jobs/${id}/status`, { status }),
};
export const reports = {
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.job_id) params.append('job_id', filters.job_id);
    if (filters.template_id) params.append('template_id', filters.template_id);
    if (filters.status) params.append('status', filters.status);
    
    return api.get(`/reports?${params.toString()}`);
  },
  
  getReport: (id) => api.get(`/reports/${id}`),
  
  createReport: (reportData) => api.post('/reports', reportData),
  
  updateReport: (id, reportData) => api.put(`/reports/${id}`, reportData),
  
  deleteReport: (id) => api.delete(`/reports/${id}`),
  generatePDF: (id) => api.get(`/reports/${id}/pdf`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    } 
  }),
  sendReport: (id, emailData) => api.post(`/reports/${id}/send`, emailData),
};
export const reportTemplates = {
  getTemplates: () => api.get('/report-templates'),
  
  getTemplate: (id) => api.get(`/report-templates/${id}`),
  
  createTemplate: (templateData) => api.post('/report-templates', templateData),
  
  updateTemplate: (id, templateData) => api.put(`/report-templates/${id}`, templateData),
  
  deleteTemplate: (id) => api.delete(`/report-templates/${id}`),
};

export default api;