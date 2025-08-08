const db = require('../../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const authController = {
  async register(req, res) {
    try {
      const { businessName, email, password, name, phone } = req.body;
      if (!businessName || !email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const emailCheck = await db.query(
        'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const businessId = uuidv4();
      await db.query(
        `INSERT INTO businesses (id, name, email, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [businessId, businessName, email]
      );
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `INSERT INTO users (id, business_id, email, password_hash, name, role, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'owner', $6, NOW(), NOW())`,
        [userId, businessId, email, hashedPassword, name, phone]
      );
      const token = jwt.sign(
        { id: userId, businessId, role: 'owner' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({ token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const userResult = await db.query(
        `SELECT users.*, businesses.timezone 
         FROM users 
         JOIN businesses ON users.business_id = businesses.id
         WHERE users.email = $1 AND users.deleted_at IS NULL`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { 
          id: user.id, 
          businessId: user.business_id, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          timezone: user.timezone
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  async forgotPassword(req, res) {
    res.status(501).json({ message: 'Password reset not implemented yet' });
  },

  async resetPassword(req, res) {
    res.status(501).json({ message: 'Password reset not implemented yet' });
  }
};

module.exports = authController;