const db = require('../../../config/database');

const paymentController = {
  async listPayments(req, res) {
    try {
      const { invoiceId } = req.params;
      const checkQuery = `
        SELECT * FROM invoices
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [invoiceId, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      const paymentsQuery = `
        SELECT * FROM payments
        WHERE invoice_id = $1 AND deleted_at IS NULL
        ORDER BY payment_date DESC
      `;
      
      const paymentsResult = await db.query(paymentsQuery, [invoiceId]);
      
      res.json(paymentsResult.rows);
    } catch (error) {
      console.error('Error listing payments:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async addPayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const { amount, payment_date, payment_method, reference_number, notes } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      if (!payment_date) {
        return res.status(400).json({ error: 'Payment date is required' });
      }
      const invoiceQuery = `
        SELECT i.*, i.total_amount - COALESCE(
          (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id AND p.deleted_at IS NULL),
          0
        ) AS remaining_amount
        FROM invoices i
        WHERE i.id = $1 AND i.business_id = $2 AND i.deleted_at IS NULL
      `;
      
      const invoiceResult = await db.query(invoiceQuery, [invoiceId, req.user.businessId]);
      
      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const invoice = invoiceResult.rows[0];
      if (parseFloat(amount) > parseFloat(invoice.remaining_amount)) {
        return res.status(400).json({
          error: `Payment amount (${amount}) exceeds remaining balance (${invoice.remaining_amount})`
        });
      }
      await db.query('BEGIN');
      const paymentInsertQuery = `
        INSERT INTO payments (
          invoice_id,
          amount,
          payment_date,
          payment_method,
          reference_number,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const paymentParams = [
        invoiceId,
        amount,
        new Date(payment_date),
        payment_method || null,
        reference_number || null,
        notes || null
      ];
      
      const paymentResult = await db.query(paymentInsertQuery, paymentParams);
      const newPayment = paymentResult.rows[0];
      const updateStatusQuery = `
        UPDATE invoices
        SET 
          payment_status = CASE
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) >= total_amount THEN 'paid'
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) > 0 THEN 'partial'
            ELSE 'pending'
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING payment_status
      `;
      
      const statusResult = await db.query(updateStatusQuery, [invoiceId]);
      
      await db.query('COMMIT');
      
      res.status(201).json({
        payment: newPayment,
        invoice_status: statusResult.rows[0].payment_status
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error adding payment:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, payment_date, payment_method, reference_number, notes } = req.body;
      const checkQuery = `
        SELECT p.* FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE p.id = $1 AND i.business_id = $2 AND p.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      const payment = checkResult.rows[0];
      if (amount && amount !== payment.amount) {
        const invoiceQuery = `
          SELECT i.*, i.total_amount - (
            SELECT COALESCE(SUM(p.amount), 0) FROM payments p 
            WHERE p.invoice_id = i.id AND p.id != $1 AND p.deleted_at IS NULL
          ) AS available_amount
          FROM invoices i
          WHERE i.id = $2
        `;
        
        const invoiceResult = await db.query(invoiceQuery, [id, payment.invoice_id]);
        const invoice = invoiceResult.rows[0];
        
        if (parseFloat(amount) > parseFloat(invoice.available_amount)) {
          return res.status(400).json({
            error: `New payment amount (${amount}) exceeds available balance (${invoice.available_amount})`
          });
        }
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (amount) {
        updates.push(`amount = $${paramCount++}`);
        values.push(amount);
      }
      
      if (payment_date) {
        updates.push(`payment_date = $${paramCount++}`);
        values.push(new Date(payment_date));
      }
      
      if (payment_method !== undefined) {
        updates.push(`payment_method = $${paramCount++}`);
        values.push(payment_method);
      }
      
      if (reference_number !== undefined) {
        updates.push(`reference_number = $${paramCount++}`);
        values.push(reference_number);
      }
      
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      await db.query('BEGIN');
      values.push(id);
      
      const updateQuery = `
        UPDATE payments
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++}
        RETURNING *
      `;
      
      const updateResult = await db.query(updateQuery, values);
      const updateStatusQuery = `
        UPDATE invoices
        SET 
          payment_status = CASE
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) >= total_amount THEN 'paid'
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) > 0 THEN 'partial'
            ELSE 'pending'
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING payment_status
      `;
      
      const statusResult = await db.query(updateStatusQuery, [payment.invoice_id]);
      
      await db.query('COMMIT');
      
      res.json({
        payment: updateResult.rows[0],
        invoice_status: statusResult.rows[0].payment_status
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error updating payment:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deletePayment(req, res) {
    try {
      const { id } = req.params;
      const checkQuery = `
        SELECT p.* FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE p.id = $1 AND i.business_id = $2 AND p.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      const payment = checkResult.rows[0];
      await db.query('BEGIN');
      await db.query(
        `UPDATE payments SET deleted_at = NOW() WHERE id = $1`,
        [id]
      );
      const updateStatusQuery = `
        UPDATE invoices
        SET 
          payment_status = CASE
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) >= total_amount THEN 'paid'
            WHEN (
              SELECT COALESCE(SUM(amount), 0) FROM payments 
              WHERE invoice_id = $1 AND deleted_at IS NULL
            ) > 0 THEN 'partial'
            ELSE 'pending'
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING payment_status
      `;
      
      const statusResult = await db.query(updateStatusQuery, [payment.invoice_id]);
      
      await db.query('COMMIT');
      
      res.json({
        message: 'Payment deleted successfully',
        invoice_status: statusResult.rows[0].payment_status
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error deleting payment:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = paymentController;