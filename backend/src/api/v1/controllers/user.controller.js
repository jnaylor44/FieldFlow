const bcrypt = require('bcryptjs');
const db = require('../../../config/database');

const userController = {
  async getCurrentUser(req, res) {
    try {
      const { rows } = await db.query(
        'SELECT id, business_id, email, name, role, phone, avatar_url, preferences, created_at, updated_at FROM users WHERE id = $1 AND deleted_at IS NULL',
        [req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async listUsers(req, res) {
    try {
      const { rows } = await db.query(
        'SELECT id, business_id, email, name, role, phone, avatar_url, created_at, updated_at FROM users WHERE business_id = $1 AND deleted_at IS NULL',
        [req.user.businessId]
      );

      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getUser(req, res) {
    try {
      const { rows } = await db.query(
        'SELECT id, business_id, email, name, role, phone, avatar_url, created_at, updated_at FROM users WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [req.params.id, req.user.businessId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async createUser(req, res) {
    const { email, password, name, role, phone } = req.body;

    try {
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const { rows } = await db.query(
        `INSERT INTO users 
         (business_id, email, password_hash, name, role, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, business_id, email, name, role, phone, created_at`,
        [req.user.businessId, email, passwordHash, name, role, phone]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async updateUser(req, res) {
    const { name, role, phone, avatar_url, preferences } = req.body;
    const userId = req.params.id;

    try {
      const userCheck = await db.query(
        'SELECT id FROM users WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [userId, req.user.businessId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { rows } = await db.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             role = COALESCE($2, role),
             phone = COALESCE($3, phone),
             avatar_url = COALESCE($4, avatar_url),
             preferences = COALESCE($5, preferences)
         WHERE id = $6
         RETURNING id, business_id, email, name, role, phone, avatar_url, preferences, created_at, updated_at`,
        [name, role, phone, avatar_url, preferences, userId]
      );

      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    if (userId !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to change this user\'s password' });
    }

    try {
      const { rows } = await db.query(
        'SELECT password_hash FROM users WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [userId, req.user.businessId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (userId === req.user.id) {
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async deleteUser(req, res) {
    try {
      const { rows } = await db.query(
        'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL RETURNING id',
        [req.params.id, req.user.businessId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async updatePushToken(req, res) {
    const { pushToken } = req.body;

    try {
      await db.query(
        'UPDATE users SET push_token = $1 WHERE id = $2',
        [pushToken, req.user.id]
      );

      res.json({ message: 'Push token updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;