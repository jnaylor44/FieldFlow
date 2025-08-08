const db = require('../../../config/database');

const quoteController = {
  async listQuotes(req, res) {
    try {
      const { status, customer_id, from_date, to_date, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT q.*, c.name as customer_name
        FROM quotes q
        JOIN customers c ON q.customer_id = c.id
        WHERE q.business_id = $1 AND q.deleted_at IS NULL
      `;
      
      const queryParams = [req.user.businessId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND q.status = $${paramIndex++}`;
        queryParams.push(status);
      }
      
      if (customer_id) {
        query += ` AND q.customer_id = $${paramIndex++}`;
        queryParams.push(customer_id);
      }
      
      if (from_date) {
        query += ` AND q.created_at >= $${paramIndex++}`;
        queryParams.push(new Date(from_date));
      }
      
      if (to_date) {
        query += ` AND q.created_at <= $${paramIndex++}`;
        queryParams.push(new Date(to_date));
      }
      
      query += ` ORDER BY q.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const { rows } = await db.query(query, queryParams);
      const countQuery = `
        SELECT COUNT(*) FROM quotes 
        WHERE business_id = $1 AND deleted_at IS NULL
      `;
      const countResult = await db.query(countQuery, [req.user.businessId]);
      const totalCount = parseInt(countResult.rows[0].count);
      
      res.json({
        quotes: rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error listing quotes:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getQuote(req, res) {
    try {
      const quoteQuery = `
        SELECT q.*, c.name as customer_name, c.email as customer_email
        FROM quotes q
        JOIN customers c ON q.customer_id = c.id
        WHERE q.id = $1 AND q.business_id = $2 AND q.deleted_at IS NULL
      `;
      
      const quoteResult = await db.query(quoteQuery, [req.params.id, req.user.businessId]);
      
      if (quoteResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      const quote = quoteResult.rows[0];
      const itemsQuery = `
        SELECT * FROM quote_items
        WHERE quote_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
      `;
      
      const itemsResult = await db.query(itemsQuery, [req.params.id]);
      quote.items = itemsResult.rows;
      if (quote.job_id) {
        const jobQuery = `
          SELECT id, title, status, scheduled_start, scheduled_end
          FROM jobs
          WHERE id = $1
        `;
        
        const jobResult = await db.query(jobQuery, [quote.job_id]);
        
        if (jobResult.rows.length > 0) {
          quote.job = jobResult.rows[0];
        }
      }
      
      res.json(quote);
    } catch (error) {
      console.error('Error getting quote:', error);
      res.status(500).json({ error: error.message });
    }
  },

async createQuote(req, res) {
    try {
      const { 
        customer_id, 
        job_id, 
        valid_until, 
        items, 
        description 
      } = req.body;
      
      if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one quote item is required' });
      }
      await db.query('BEGIN');
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const quoteCountQuery = `
        SELECT COUNT(*) FROM quotes 
        WHERE business_id = $1 AND quote_number LIKE $2
      `;
      
      const quoteCountResult = await db.query(
        quoteCountQuery, 
        [req.user.businessId, `QUO-${dateStr}-%`]
      );
      
      const count = parseInt(quoteCountResult.rows[0].count) + 1;
      const quoteNumber = `QUO-${dateStr}-${count.toString().padStart(3, '0')}`;
      let quoteTotal = 0;
      for (const item of items) {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
        quoteTotal += itemTotal;
      }
      const validUntilDate = valid_until 
        ? new Date(valid_until) 
        : new Date(today.setDate(today.getDate() + 30));
      const quoteInsertQuery = `
        INSERT INTO quotes (
          business_id, 
          customer_id, 
          job_id, 
          status,
          quote_number, 
          amount, 
          description,
          valid_until
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const quoteParams = [
        req.user.businessId,
        customer_id,
        job_id || null,
        'draft',
        quoteNumber,
        quoteTotal,
        description || null,
        validUntilDate
      ];
      
      const quoteResult = await db.query(quoteInsertQuery, quoteParams);
      const newQuote = quoteResult.rows[0];
      await db.query(
        `UPDATE quotes SET metadata = '{}'::jsonb WHERE id = $1`,
        [newQuote.id]
      );
      for (const item of items) {
        const itemAmount = parseFloat(item.quantity) * parseFloat(item.unit_price);
        
        const itemInsertQuery = `
          INSERT INTO quote_items (
            quote_id, 
            description, 
            quantity, 
            unit_price, 
            amount
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const itemParams = [
          newQuote.id,
          item.description,
          item.quantity,
          item.unit_price,
          itemAmount
        ];
        
        await db.query(itemInsertQuery, itemParams);
      }
      await db.query('COMMIT');
      const completeQuoteResult = await db.query(
        'SELECT * FROM quotes WHERE id = $1', 
        [newQuote.id]
      );
      
      const quoteItemsResult = await db.query(
        'SELECT * FROM quote_items WHERE quote_id = $1', 
        [newQuote.id]
      );
      
      const createdQuote = completeQuoteResult.rows[0];
      createdQuote.items = quoteItemsResult.rows;
      
      res.status(201).json(createdQuote);
      
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error creating quote:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateQuote(req, res) {
    try {
      const { id } = req.params;
      const { status, valid_until, description } = req.body;
      const checkQuery = `
        SELECT * FROM quotes
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      let updates = [];
      let values = [];
      let paramCount = 1;
      
      if (status) {
        if (!['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status value' });
        }
        
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }
      
      if (valid_until) {
        updates.push(`valid_until = $${paramCount++}`);
        values.push(new Date(valid_until));
      }
      
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      values.push(id, req.user.businessId);
      
      const updateQuery = `
        UPDATE quotes
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++} AND business_id = $${paramCount++}
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, values);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteQuote(req, res) {
    try {
      const { id } = req.params;
      const checkQuery = `
        SELECT * FROM quotes
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      await db.query('BEGIN');
      await db.query(
        `UPDATE quote_items SET deleted_at = NOW() WHERE quote_id = $1`,
        [id]
      );
      await db.query(
        `UPDATE quotes SET deleted_at = NOW() WHERE id = $1 AND business_id = $2`,
        [id, req.user.businessId]
      );
      
      await db.query('COMMIT');
      
      res.json({ message: 'Quote deleted successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error deleting quote:', error);
      res.status(500).json({ error: error.message });
    }
  },

async convertToInvoice(req, res) {
    try {
      const { id } = req.params;
      const { due_date } = req.body;
      
      if (!due_date) {
        return res.status(400).json({ error: 'Due date is required' });
      }
      const checkQuery = `
        SELECT q.*, c.name as customer_name
        FROM quotes q
        JOIN customers c ON q.customer_id = c.id
        WHERE q.id = $1 AND q.business_id = $2 AND q.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [id, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      const quote = checkResult.rows[0];
      const itemsQuery = `
        SELECT * FROM quote_items
        WHERE quote_id = $1 AND deleted_at IS NULL
      `;
      
      const itemsResult = await db.query(itemsQuery, [id]);
      
      if (itemsResult.rows.length === 0) {
        return res.status(400).json({ error: 'Cannot convert quote with no items' });
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
      const taxRate = 0.15; // 15% GST for NZ
      const taxAmount = quote.amount * taxRate;
      const totalAmount = quote.amount + taxAmount;
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
        quote.customer_id,
        quote.job_id || null,
        invoiceNumber,
        quote.amount,
        taxAmount,
        totalAmount,
        new Date(due_date),
        'pending'
      ];
      
      const invoiceResult = await db.query(invoiceInsertQuery, invoiceParams);
      const newInvoice = invoiceResult.rows[0];
      await db.query(
        `UPDATE invoices SET metadata = $1::jsonb WHERE id = $2`,
        [JSON.stringify({
          converted_from_quote: quote.id,
          notes: quote.description
        }), newInvoice.id]
      );
      for (const item of itemsResult.rows) {
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
          item.amount
        ];
        
        await db.query(itemInsertQuery, itemParams);
      }
      await db.query(
        `UPDATE quotes SET 
          status = 'accepted', 
          metadata = jsonb_set(COALESCE(metadata, '{}')::jsonb, '{converted_to_invoice}', $1::jsonb),
          updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(newInvoice.id), id]
      );
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
      
      res.status(201).json({
        message: 'Quote successfully converted to invoice',
        invoice: createdInvoice
      });
      
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error converting quote to invoice:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async addQuoteItem(req, res) {
    try {
      const { quoteId } = req.params;
      const { description, quantity, unit_price } = req.body;
      
      if (!description || !quantity || !unit_price) {
        return res.status(400).json({
          error: 'Description, quantity, and unit price are required'
        });
      }
      const checkQuery = `
        SELECT * FROM quotes
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL
      `;
      
      const checkResult = await db.query(checkQuery, [quoteId, req.user.businessId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      const amount = parseFloat(quantity) * parseFloat(unit_price);
      const insertQuery = `
        INSERT INTO quote_items (
          quote_id, 
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
        [quoteId, description, quantity, unit_price, amount]
      );
      
      const newItem = insertResult.rows[0];
      const updateTotalQuery = `
        UPDATE quotes
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM quote_items WHERE quote_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount
      `;
      
      const updateResult = await db.query(updateTotalQuery, [quoteId]);
      
      res.status(201).json({
        item: newItem,
        quote_total: updateResult.rows[0].amount
      });
    } catch (error) {
      console.error('Error adding quote item:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateQuoteItem(req, res) {
    try {
      const { quoteId, itemId } = req.params;
      const { description, quantity, unit_price } = req.body;
      const checkQuery = `
        SELECT i.* FROM quote_items i
        JOIN quotes q ON i.quote_id = q.id
        WHERE i.id = $1 AND i.quote_id = $2 AND q.business_id = $3
          AND i.deleted_at IS NULL AND q.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(
        checkQuery, 
        [itemId, quoteId, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote item not found' });
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
      values.push(itemId, quoteId);
      
      const updateQuery = `
        UPDATE quote_items
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount++} AND quote_id = $${paramCount++}
        RETURNING *
      `;
      
      const updateResult = await db.query(updateQuery, values);
      const updateTotalQuery = `
        UPDATE quotes
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM quote_items WHERE quote_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount
      `;
      
      const totalResult = await db.query(updateTotalQuery, [quoteId]);
      
      res.json({
        item: updateResult.rows[0],
        quote_total: totalResult.rows[0].amount
      });
    } catch (error) {
      console.error('Error updating quote item:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteQuoteItem(req, res) {
    try {
      const { quoteId, itemId } = req.params;
      const checkQuery = `
        SELECT i.* FROM quote_items i
        JOIN quotes q ON i.quote_id = q.id
        WHERE i.id = $1 AND i.quote_id = $2 AND q.business_id = $3
          AND i.deleted_at IS NULL AND q.deleted_at IS NULL
      `;
      
      const checkResult = await db.query(
        checkQuery, 
        [itemId, quoteId, req.user.businessId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quote item not found' });
      }
      await db.query(
        `UPDATE quote_items SET deleted_at = NOW() WHERE id = $1`,
        [itemId]
      );
      const updateTotalQuery = `
        UPDATE quotes
        SET 
          amount = (SELECT COALESCE(SUM(amount), 0) FROM quote_items WHERE quote_id = $1 AND deleted_at IS NULL),
          updated_at = NOW()
        WHERE id = $1
        RETURNING amount
      `;
      
      const totalResult = await db.query(updateTotalQuery, [quoteId]);
      
      res.json({
        message: 'Quote item deleted successfully',
        quote_total: totalResult.rows[0].amount
      });
    } catch (error) {
      console.error('Error deleting quote item:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = quoteController;