const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

class AuthService {
  async validateCredentials(email, password) {
    const userResult = await db.query(
      `SELECT users.*, businesses.timezone 
       FROM users 
       JOIN businesses ON users.business_id = businesses.id
       WHERE users.email = $1 AND users.deleted_at IS NULL`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    return validPassword ? user : null;
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        businessId: user.business_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = new AuthService();