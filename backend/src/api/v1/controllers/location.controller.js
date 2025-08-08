
const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

const locationController = {
  async updateLocation(req, res) {
    const { latitude, longitude, accuracy, batteryLevel } = req.body;
    
    try {
      const point = `POINT(${longitude} ${latitude})`;
      
      const { rows } = await db.query(
        `INSERT INTO locations 
         (id, user_id, geom, accuracy, battery_level, recorded_at)
         VALUES ($1, $2, ST_SetSRID(ST_GeomFromText($3), 4326), $4, $5, NOW())
         RETURNING id`,
        [uuidv4(), req.user.id, point, accuracy, batteryLevel]
      );
      
      res.status(201).json({ success: true, id: rows[0].id });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getWorkerLocations(req, res) {
    try {
      const { workerId } = req.params;
      const workerCheck = await db.query(
        'SELECT id FROM users WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [workerId, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      const { rows } = await db.query(
        `SELECT 
          id, 
          ST_X(geom::geometry) as longitude, 
          ST_Y(geom::geometry) as latitude, 
          accuracy, 
          battery_level, 
          recorded_at
        FROM locations
        WHERE user_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1`,
        [workerId]
      );
      
      if (rows.length === 0) {
        return res.json({ message: 'No location data available' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting worker location:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getAllWorkerLocations(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT 
          u.id as user_id,
          u.name as worker_name,
          ST_X(l.geom::geometry) as longitude, 
          ST_Y(l.geom::geometry) as latitude, 
          l.accuracy, 
          l.battery_level, 
          l.recorded_at
        FROM users u
        JOIN (
          SELECT DISTINCT ON (user_id) 
            user_id, 
            geom, 
            accuracy, 
            battery_level, 
            recorded_at
          FROM locations
          ORDER BY user_id, recorded_at DESC
        ) l ON u.id = l.user_id
        WHERE u.business_id = $1 
        AND u.role = 'worker' 
        AND u.deleted_at IS NULL
        AND l.recorded_at > NOW() - INTERVAL '24 hours'`,
        [req.user.businessId]
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error getting all worker locations:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getActiveJobLocations(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT 
          j.id,
          j.title,
          j.status,
          j.location,
          j.scheduled_start,
          j.scheduled_end,
          c.name as customer_name,
          u.id as worker_id,
          u.name as worker_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN users u ON j.assigned_user_id = u.id
        WHERE j.business_id = $1 
        AND j.deleted_at IS NULL
        AND j.status IN ('scheduled', 'in_progress')
        AND j.location IS NOT NULL`,
        [req.user.businessId]
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error getting job locations:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = locationController;