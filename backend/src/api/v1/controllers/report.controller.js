const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');
const pdfService = require('../../../services/pdf.service');
const emailService = require('../../../services/email.service');
const fs = require('fs');

const reportController = {
  async listReports(req, res) {
    try {
      const { customer_id, job_id, template_id, status, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT r.*, rt.name as template_name, c.name as customer_name, 
        u.name as created_by_name, j.title as job_title
        FROM reports r
        JOIN report_templates rt ON r.template_id = rt.id
        JOIN customers c ON r.customer_id = c.id
        JOIN users u ON r.created_by = u.id
        LEFT JOIN jobs j ON r.job_id = j.id
        WHERE r.business_id = $1 AND r.deleted_at IS NULL
      `;
      
      const queryParams = [req.user.businessId];
      let paramIndex = 2;
      
      if (customer_id) {
        query += ` AND r.customer_id = $${paramIndex++}`;
        queryParams.push(customer_id);
      }
      
      if (job_id) {
        query += ` AND r.job_id = $${paramIndex++}`;
        queryParams.push(job_id);
      }
      
      if (template_id) {
        query += ` AND r.template_id = $${paramIndex++}`;
        queryParams.push(template_id);
      }
      
      if (status) {
        query += ` AND r.status = $${paramIndex++}`;
        queryParams.push(status);
      }
      
      query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const { rows } = await db.query(query, queryParams);
      const countQuery = `
        SELECT COUNT(*) FROM reports
        WHERE business_id = $1 AND deleted_at IS NULL
      `;
      const countResult = await db.query(countQuery, [req.user.businessId]);
      const totalCount = parseInt(countResult.rows[0].count);
      
      res.json({
        reports: rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getReport(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT r.*, rt.name as template_name, rt.template_content, 
        c.name as customer_name, c.email as customer_email,
        u.name as created_by_name, j.title as job_title
        FROM reports r
        JOIN report_templates rt ON r.template_id = rt.id
        JOIN customers c ON r.customer_id = c.id
        JOIN users u ON r.created_by = u.id
        LEFT JOIN jobs j ON r.job_id = j.id
        WHERE r.id = $1 AND r.business_id = $2 AND r.deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({ error: error.message });
    }
  },
async createReport(req, res) {
  const { template_id, job_id, customer_id, report_content } = req.body;
  
  try {
    if (!template_id || !customer_id || !report_content) {
      return res.status(400).json({ error: 'Template ID, customer ID, and report content are required' });
    }
    const templateCheck = await db.query(
      `SELECT * FROM report_templates
       WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
      [template_id, req.user.businessId]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const customerCheck = await db.query(
      `SELECT * FROM customers
       WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
      [customer_id, req.user.businessId]
    );
    
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (job_id) {
      const jobCheck = await db.query(
        `SELECT * FROM jobs
         WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [job_id, req.user.businessId]
      );
      
      if (jobCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
    }
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const reportCountQuery = `
      SELECT COUNT(*) FROM reports
      WHERE business_id = $1 AND report_number LIKE $2
    `;
    
    const reportCountResult = await db.query(
      reportCountQuery,
      [req.user.businessId, `REP-${dateStr}-%`]
    );
    
    const count = parseInt(reportCountResult.rows[0].count) + 1;
    const reportNumber = `REP-${dateStr}-${count.toString().padStart(3, '0')}`;
    let sanitizedReportContent;
    try {
      sanitizedReportContent = JSON.parse(JSON.stringify(report_content));
    } catch (err) {
      console.error('Invalid report_content JSON:', err);
      return res.status(400).json({ error: 'Invalid report content format' });
    }
    const { rows } = await db.query(
      `INSERT INTO reports
       (id, business_id, template_id, job_id, customer_id, created_by, 
        report_number, report_content, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
       RETURNING *`,
      [
        uuidv4(),
        req.user.businessId,
        template_id,
        job_id || null,
        customer_id,
        req.user.id,
        reportNumber,
        sanitizedReportContent
      ]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: error.message || 'Failed to create report' });
  }
},
  async generatePDF(req, res) {
    try {
      const { id } = req.params;
      const reportResult = await db.query(
        `SELECT r.*, rt.name as template_name, c.name as customer_name, c.email as customer_email
         FROM reports r
         JOIN report_templates rt ON r.template_id = rt.id
         JOIN customers c ON r.customer_id = c.id
         WHERE r.id = $1 AND r.business_id = $2 AND r.deleted_at IS NULL`,
        [id, req.user.businessId]
      );
      
      if (reportResult.rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      const report = reportResult.rows[0];
      const pdfBuffer = await pdfService.generateReportPDF(report);
      const pdfInfo = await pdfService.savePDF(pdfBuffer, id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': `attachment; filename="Report_${report.report_number}.pdf"`,
        'Cache-Control': 'no-cache',
      });
      return res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
    }
  },
  async sendReport(req, res) {
    const { id } = req.params;
    const { email, subject, message } = req.body;
    
    try {
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      const reportResult = await db.query(
        `SELECT r.*, rt.name as template_name, c.name as customer_name, c.email as customer_email
         FROM reports r
         JOIN report_templates rt ON r.template_id = rt.id
         JOIN customers c ON r.customer_id = c.id
         WHERE r.id = $1 AND r.business_id = $2 AND r.deleted_at IS NULL`,
        [id, req.user.businessId]
      );
      
      if (reportResult.rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      const report = reportResult.rows[0];
      const pdfBuffer = await pdfService.generateReportPDF(report);
      const pdfInfo = await pdfService.savePDF(pdfBuffer, id);
      await emailService.sendReportEmail({
        to: email,
        subject: subject || `Report: ${report.report_number}`,
        text: message || null,
        pdfPath: pdfInfo.filePath,
        pdfFilename: `Report_${report.report_number}.pdf`,
        reportData: report
      });
      await db.query(
        `UPDATE reports
         SET status = 'sent', 
             sent_at = NOW(),
             metadata = jsonb_set(
               COALESCE(metadata, '{}')::jsonb, 
               '{email_info}', 
               $1::jsonb
             )
         WHERE id = $2
         RETURNING *`,
        [
          JSON.stringify({
            to: email,
            subject: subject || `Report: ${report.report_number}`,
            sent_at: new Date()
          }),
          id
        ]
      );
      
      res.json({ 
        success: true, 
        message: `Report sent to ${email}` 
      });
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).json({ error: 'Failed to send report' });
    }
  },
  async updateReport(req, res) {
    const { id } = req.params;
    const { report_content, status } = req.body;
    
    try {
      const checkResult = await db.query(
        `SELECT * FROM reports
         WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [id, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      const report = checkResult.rows[0];
      if (report_content && report.status !== 'draft') {
        return res.status(400).json({ error: 'Cannot modify content of a report that has been sent' });
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (report_content) {
        updates.push(`report_content = $${paramCount++}`);
        values.push(report_content);
      }
      
      if (status) {
        if (status === 'sent' && report.status === 'draft') {
          updates.push(`status = $${paramCount++}, sent_at = NOW()`);
          values.push(status);
        } else if (status !== report.status) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      values.push(id, req.user.businessId);
      
      const { rows } = await db.query(
        `UPDATE reports
         SET ${updates.join(', ')}
         WHERE id = $${paramCount++} AND business_id = $${paramCount++}
         RETURNING *`,
        values
      );
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteReport(req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE reports
         SET deleted_at = NOW()
         WHERE id = $1 AND business_id = $2
         RETURNING id`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportController;