const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

const reportTemplateController = {
  async listTemplates(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT id, name, description, is_active, created_at, updated_at
         FROM report_templates
         WHERE business_id = $1 AND deleted_at IS NULL
         ORDER BY name ASC`,
        [req.user.businessId]
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error listing report templates:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getTemplate(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT *
         FROM report_templates
         WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting report template:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async createTemplate(req, res) {
    const { name, description, template_content, is_active } = req.body;
    
    try {
      if (!name || !template_content) {
        return res.status(400).json({ error: 'Name and template content are required' });
      }
      
      const { rows } = await db.query(
        `INSERT INTO report_templates
         (id, business_id, name, description, template_content, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          uuidv4(),
          req.user.businessId,
          name,
          description || null,
          template_content,
          is_active !== undefined ? is_active : true
        ]
      );
      
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error creating report template:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateTemplate(req, res) {
    const { id } = req.params;
    const { name, description, template_content, is_active } = req.body;
    
    try {
      const checkResult = await db.query(
        `SELECT id FROM report_templates
         WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [id, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      
      if (template_content) {
        updates.push(`template_content = $${paramCount++}`);
        values.push(template_content);
      }
      
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      values.push(id, req.user.businessId);
      
      const { rows } = await db.query(
        `UPDATE report_templates
         SET ${updates.join(', ')}
         WHERE id = $${paramCount++} AND business_id = $${paramCount++}
         RETURNING *`,
        values
      );
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error updating report template:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteTemplate(req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE report_templates
         SET deleted_at = NOW()
         WHERE id = $1 AND business_id = $2
         RETURNING id`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting report template:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportTemplateController;