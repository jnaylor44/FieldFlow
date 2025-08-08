import client from './client';

const reports = {
  getTemplates: async () => {
    try {
      const response = await client.get('/report-templates');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getTemplate: async (templateId) => {
    try {
      const response = await client.get(`/report-templates/${templateId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getReportsForJob: async (jobId) => {
    try {
      const response = await client.get('/reports', { params: { job_id: jobId } });
      return response;
    } catch (error) {
      throw error;
    }
  },
  getReport: async (reportId) => {
    try {
      const response = await client.get(`/reports/${reportId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  createReport: async (reportData) => {
    try {
      const response = await client.post('/reports', reportData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateReport: async (reportId, reportData) => {
    try {
      const response = await client.put(`/reports/${reportId}`, reportData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteReport: async (reportId) => {
    try {
      const response = await client.delete(`/reports/${reportId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  sendReport: async (reportId, emailData) => {
    try {
      const response = await client.post(`/reports/${reportId}/send`, emailData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  generatePDF: async (reportId) => {
    try {
      const response = await client.get(`/reports/${reportId}/pdf`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default reports;