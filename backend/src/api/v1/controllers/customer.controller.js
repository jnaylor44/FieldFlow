const db = require('../../../config/database');

const customerController = {
  async listCustomers(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM customers 
        WHERE business_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC`,
        [req.user.businessId]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async createCustomer(req, res) {
    const { name, company_name, email, phone, address, notes } = req.body;
    
    try {
      if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      const { rows } = await db.query(
        `INSERT INTO customers 
        (business_id, name, company_name, email, phone, address, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [req.user.businessId, name, company_name, email, phone, address, notes]
      );
      
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getCustomer(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM customers 
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async updateCustomer(req, res) {
    const { id } = req.params;
    const { name, company_name, email, phone, address, notes } = req.body;
    
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (company_name !== undefined) {
        updates.push(`company_name = $${paramCount++}`);
        values.push(company_name);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      if (address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(address);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.user.businessId);
      
      const { rows } = await db.query(
        `UPDATE customers 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++} 
          AND business_id = $${paramCount++}
          AND deleted_at IS NULL
        RETURNING *`,
        values
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async deleteCustomer(req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE customers 
        SET deleted_at = NOW()
        WHERE id = $1 AND business_id = $2
        RETURNING id`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getCustomerJobs(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM jobs 
        WHERE customer_id = $1 
          AND business_id = $2
          AND deleted_at IS NULL
        ORDER BY scheduled_start DESC`,
        [req.params.id, req.user.businessId]
      );
      
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = customerController;