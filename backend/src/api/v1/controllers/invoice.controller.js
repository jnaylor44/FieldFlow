const db = require('../../../config/database');

const invoiceController = {
  async listInvoices(req, res) {
    try {
      const { status, customer_id, from_date, to_date, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT i.*, c.name as customer_name
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.business_id = $1 AND i.deleted_at IS NULL
      `;
      
      const queryParams = [req.user.businessId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND i.payment_status = $${paramIndex++}`;
        queryParams.push(status);
      }
      
      if (customer_id) {
        query += ` AND i.customer_id = $${paramIndex++}`;
        queryParams.push(customer_id);
      }
      
      if (from_date) {
        query += ` AND i.created_at >= $${paramIndex++}`;
        queryParams.push(new Date(from_date));
      }
      
      if (to_date) {
        query += ` AND i.created_at <= $${paramIndex++}`;
        queryParams.push(new Date(to_date));
      }
      
      query += ` ORDER BY i.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const { rows } = await db.query(query, queryParams);
      const countQuery = `
        SELECT COUNT(*) FROM invoices 
        WHERE business_id = $1 AND deleted_at IS NULL
      `;
      const countResult = await db.query(countQuery, [req.user.businessId]);
      const totalCount = parseInt(countResult.rows[0].count);
      
      res.json({
        invoices: rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error listing invoices:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getInvoice(req, res) {
    try {
      const invoiceQuery = `
        SELECT i.*, c.name as customer_name, c.email as customer_email
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.id = $1 AND i.business_id = $2 AND i.deleted_at IS NULL
      `;
      
      const invoiceResult = await db.query(invoiceQuery, [req.params.id, req.user.businessId]);
      
      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const invoice = invoiceResult.rows[0];
      const itemsQuery = `
        SELECT * FROM invoice_items
        WHERE invoice_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
      `;
      
      const itemsResult = await db.query(itemsQuery, [req.params.id]);
      invoice.items = itemsResult.rows;
      const paymentsQuery = `
        SELECT * FROM payments
        WHERE invoice_id = $1 AND deleted_at IS NULL
        ORDER BY payment_date DESC
      `;
      
      const paymentsResult = await db.query(paymentsQuery, [req.params.id]);
      invoice.payments = paymentsResult.rows;
      if (invoice.job_id) {
        const jobQuery = `
          SELECT id, title, status, scheduled_start, scheduled_end
          FROM jobs
          WHERE id = $1
        `;
        
        const jobResult = await db.query(jobQuery, [invoice.job_id]);
        
        if (jobResult.rows.length > 0) {
          invoice.job = jobResult.rows[0];
        }
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Error getting invoice:', error);
      res.status(500).json({ error: error.message });
    }
  },


async createInvoice(req, res) {
    try {
      const { 
        customer_id, 
        job_id, 
        due_date, 
        items, 
        notes 
      } = req.body;
      
      if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      if (!due_date) {
        return res.status(400).json({ error: 'Due date is required' });
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one invoice item is required' });
      }
      await db.query('BEGIN');
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const invoiceCountQuery = `
        SELECT COUNT(*) FROM invoices 
        WHERE business_id = $1 AND invoice_number LIKE $2
      `;
      
      const invoiceCountResult = await db.query(
        invoiceCountQuery, 
        [req.user.businessId, `INV-${dateStr}-%`]
      );
      
      const count = parseInt(invoiceCountResult.rows[0].count) + 1;
      const invoiceNumber = `INV-${dateStr}-${count.toString().padStart(3, '0')}`;
      let subtotal = 0;
      for (const item of items) {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
        subtotal += itemTotal;
      }
      
      const taxRate = 0.15; // 15% GST for NZ
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;
      const invoiceInsertQuery = `
        INSERT INTO invoices (
          business_id, 
          customer_id, 
          job_id, 
          invoice_number, 
          amount, 
          tax_amount, 
          total_amount, 
          due_date, 
          payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const invoiceParams = [
        req.user.businessId,
        customer_id,
        job_id || null,
        invoiceNumber,
        subtotal,
        taxAmount,
        totalAmount,
        new Date(due_date),
        'pending'
      ];
      
      const invoiceResult = await db.query(invoiceInsertQuery, invoiceParams);
      const newInvoice = invoiceResult.rows[0];
      if (notes) {
        await db.query(
          `UPDATE invoices SET metadata = $1::jsonb WHERE id = $2`,
          [JSON.stringify({ notes }), newInvoice.id]
        );
      } else {
        await db.query(
          `UPDATE invoices SET metadata = '{}'::jsonb WHERE id = $2`,
          [newInvoice.id]
        );
      }
      for (const item of items) {
        const itemAmount = parseFloat(item.quantity) * parseFloat(item.unit_price);
        
        const itemInsertQuery = `
          INSERT INTO invoice_items (
            invoice_id, 
            description, 
            quantity, 
            unit_price, 
            amount
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const itemParams = [
          newInvoice.id,
          item.description,
          item.quantity,
          item.unit_price,
          itemAmount
        ];
        
        await db.query(itemInsertQuery, itemParams);
      }
      await db.query('COMMIT');
      const completeInvoiceResult = await db.query(
        'SELECT * FROM invoices WHERE id = $1', 
        [newInvoice.id]
      );
      
      const invoiceItemsResult = await db.query(
        'SELECT * FROM invoice_items WHERE invoice_id = $1', 
        [newInvoice.id]
      );
      
      const createdInvoice = completeInvoiceResult.rows[0];
      createdInvoice.items = invoiceItemsResult.rows;
      
      res.status(201).json(createdInvoice);
      
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateInvoice(req, res) {
    try {
      const { id } = req.params;
      const { due_date, payment_status, notes } = req.body;
      const checkQuery = `
        SELECT * FROM invoices
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (due_date) {
        updates.push(`due_date = $${paramCount++}`);
        values.push(new Date(due_date));
      }
      
      if (payment_status) {
        updates.push(`payment_status = $${paramCount++}`);
        values.push(payment_status);
      }
      
      if (notes !== undefined) {
        updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}')::jsonb, '{notes}', $${paramCount++}::jsonb)`);
        values.push(JSON.stringify(notes));
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      values.push(id, req.user.businessId);
      
      const updateQuery = `
        UPDATE invoices
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++} AND business_id = $${paramCount++}
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, values);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;
      const checkQuery = `
        SELECT * FROM invoices
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      const paymentsQuery = `
        SELECT COUNT(*) FROM payments
        WHERE invoice_id = $1 AND deleted_at IS NULL
      `;
      
      const paymentsResult = await db.query(paymentsQuery, [id]);
      
      if (parseInt(paymentsResult.rows[0].count) > 0) {
        return res.status(400).json({
          error: 'Cannot delete invoice with payments. Delete the payments first.'
        });
      }
      await db.query('BEGIN');
      await db.query(
        `UPDATE invoice_items SET deleted_at = NOW() WHERE invoice_id = $1`,
        [id]
      );
      await db.query(
        `UPDATE invoices SET deleted_at = NOW() WHERE id = $1 AND business_id = $2`,
        [id, req.user.businessId]
      );
      
      await db.query('COMMIT');
      
      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async addInvoiceItem(req, res) {
    try {
      const { invoiceId } = req.params;
      const { description, quantity, unit_price } = req.body;
      
      if (!description || !quantity || !unit_price) {
        return res.status(400).json({
          error: 'Description, quantity, and unit price are required'
        });
      }
      const checkQuery = `
        SELECT * FROM invoices
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [invoiceId, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      const amount = parseFloat(quantity) * parseFloat(unit_price);
      const insertQuery = `
        INSERT INTO invoice_items (
          invoice_id, 
          description, 
          quantity, 
          unit_price, 
          amount
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const insertResult = await db.query(
        insertQuery, 
        [invoiceId, description, quantity, unit_price, amount]
      );
      
      const newItem = insertResult.rows[0];
      const updateTotalsQuery = `
        UPDATE invoices
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          tax_amount = (SELECT COALESCE(SUM(amount), 0) * 0.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          total_amount = (SELECT COALESCE(SUM(amount), 0) * 1.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount, tax_amount, total_amount
      `;
      
      const updateResult = await db.query(updateTotalsQuery, [invoiceId]);
      
      res.status(201).json({
        item: newItem,
        invoice_totals: updateResult.rows[0]
      });
    } catch (error) {
      console.error('Error adding invoice item:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateInvoiceItem(req, res) {
    try {
      const { invoiceId, itemId } = req.params;
      const { description, quantity, unit_price } = req.body;
      const checkQuery = `
        SELECT i.* FROM invoice_items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE i.id = $1 AND i.invoice_id = $2 AND inv.business_id = $3
          AND i.deleted_at IS NULL AND inv.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(
        checkQuery, 
        [itemId, invoiceId, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice item not found' });
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (description) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      
      if (quantity) {
        updates.push(`quantity = $${paramCount++}`);
        values.push(quantity);
      }
      
      if (unit_price) {
        updates.push(`unit_price = $${paramCount++}`);
        values.push(unit_price);
      }
      
      if (quantity || unit_price) {
        let newQuantity = quantity || checkResult.rows[0].quantity;
        let newUnitPrice = unit_price || checkResult.rows[0].unit_price;
        let newAmount = parseFloat(newQuantity) * parseFloat(newUnitPrice);
        
        updates.push(`amount = $${paramCount++}`);
        values.push(newAmount);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      values.push(itemId, invoiceId);
      
      const updateQuery = `
        UPDATE invoice_items
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++} AND invoice_id = $${paramCount++}
        RETURNING *
      `;
      
      const updateResult = await db.query(updateQuery, values);
      const updateTotalsQuery = `
        UPDATE invoices
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          tax_amount = (SELECT COALESCE(SUM(amount), 0) * 0.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          total_amount = (SELECT COALESCE(SUM(amount), 0) * 1.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount, tax_amount, total_amount
      `;
      
      const totalsResult = await db.query(updateTotalsQuery, [invoiceId]);
      
      res.json({
        item: updateResult.rows[0],
        invoice_totals: totalsResult.rows[0]
      });
    } catch (error) {
      console.error('Error updating invoice item:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteInvoiceItem(req, res) {
    try {
      const { invoiceId, itemId } = req.params;
      const checkQuery = `
        SELECT i.* FROM invoice_items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE i.id = $1 AND i.invoice_id = $2 AND inv.business_id = $3
          AND i.deleted_at IS NULL AND inv.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(
        checkQuery, 
        [itemId, invoiceId, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice item not found' });
      }
      await db.query(
        `UPDATE invoice_items SET deleted_at = NOW() WHERE id = $1`,
        [itemId]
      );
      const updateTotalsQuery = `
        UPDATE invoices
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          tax_amount = (SELECT COALESCE(SUM(amount), 0) * 0.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          total_amount = (SELECT COALESCE(SUM(amount), 0) * 1.15 FROM invoice_items WHERE invoice_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount, tax_amount, total_amount
      `;
      
      const totalsResult = await db.query(updateTotalsQuery, [invoiceId]);
      
      res.json({
        message: 'Invoice item deleted successfully',
        invoice_totals: totalsResult.rows[0]
      });
    } catch (error) {
      console.error('Error deleting invoice item:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = invoiceController;