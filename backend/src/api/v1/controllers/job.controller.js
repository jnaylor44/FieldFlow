
const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');


const jobController = {
  async listJobs(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT j.*, c.name as customer_name, u.name as assigned_user_name 
         FROM jobs j
         LEFT JOIN customers c ON j.customer_id = c.id
         LEFT JOIN users u ON j.assigned_user_id = u.id
         WHERE j.business_id = $1 AND j.deleted_at IS NULL
         ORDER BY j.scheduled_start DESC`,
        [req.user.businessId]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
async createJob(req, res) {
  const { 
    title, 
    description, 
    customerId, 
    scheduledStart, 
    scheduledEnd,
    priority = 'medium',
    assignedUserId,
    locations = [] // New field for multiple locations
  } = req.body;
  
  try {
    const jobId = uuidv4();
    const finalAssignedUserId = assignedUserId || null;
    const parsedScheduledStart = new Date(scheduledStart);
    const parsedScheduledEnd = new Date(scheduledEnd);
    const locationsJson = locations && locations.length ? JSON.stringify(locations) : null;
    console.log('Original dates:', { scheduledStart, scheduledEnd });
    console.log('Parsed dates:', { parsedScheduledStart, parsedScheduledEnd });
    console.log('Locations:', locations);

    const { rows } = await db.query(
      `INSERT INTO jobs 
      (id, title, description, customer_id, scheduled_start, scheduled_end, 
       business_id, assigned_user_id, priority, status, location) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        jobId,
        title, 
        description, 
        customerId, 
        parsedScheduledStart, 
        parsedScheduledEnd, 
        req.user.businessId, 
        finalAssignedUserId,
        priority,
        'scheduled',
        locationsJson // Store locations as JSON
      ]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
},
  async getJob(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT j.*, c.name as customer_name, u.name as assigned_user_name 
         FROM jobs j
         LEFT JOIN customers c ON j.customer_id = c.id
         LEFT JOIN users u ON j.assigned_user_id = u.id
         WHERE j.id = $1 AND j.business_id = $2 AND j.deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const notesResult = await db.query(
        `SELECT n.*, u.name as user_name
         FROM job_notes n
         JOIN users u ON n.user_id = u.id
         WHERE n.job_id = $1 AND n.deleted_at IS NULL
         ORDER BY n.created_at DESC`,
        [req.params.id]
      );
      const photosResult = await db.query(
        `SELECT p.*, u.name as user_name
         FROM job_photos p
         JOIN users u ON p.user_id = u.id
         WHERE p.job_id = $1 AND p.deleted_at IS NULL
         ORDER BY p.created_at DESC`,
        [req.params.id]
      );
      const timeEntriesResult = await db.query(
        `SELECT t.*, u.name as user_name
         FROM time_entries t
         JOIN users u ON t.user_id = u.id
         WHERE t.job_id = $1 AND t.deleted_at IS NULL
         ORDER BY t.start_time DESC`,
        [req.params.id]
      );
      
      const job = {
        ...rows[0],
        notes: notesResult.rows,
        photos: photosResult.rows,
        timeEntries: timeEntriesResult.rows
      };
      if (job.location) {
        try {
          job.locations = typeof job.location === 'string' 
            ? JSON.parse(job.location) 
            : job.location;
        } catch (e) {
          console.error('Error parsing job locations:', e);
          job.locations = [];
        }
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error getting job:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async updateJob(req, res) {
    const { 
      title, 
      description, 
      status, 
      scheduledStart, 
      scheduledEnd,
      priority,
      locations, // Changed from location to locations array
      requirements,
      assignedUserId
    } = req.body;
    
    try {
      const locationsJson = locations ? JSON.stringify(locations) : undefined;
      
      const { rows } = await db.query(
        `UPDATE jobs 
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            status = COALESCE($3, status),
            scheduled_start = COALESCE($4, scheduled_start),
            scheduled_end = COALESCE($5, scheduled_end),
            priority = COALESCE($6, priority),
            location = COALESCE($7, location),
            requirements = COALESCE($8, requirements),
            assigned_user_id = $9,
            updated_at = NOW()
        WHERE id = $10 AND business_id = $11 AND deleted_at IS NULL 
        RETURNING *`,
        [
          title, 
          description, 
          status, 
          scheduledStart, 
          scheduledEnd,
          priority,
          locationsJson, // Store as JSON
          requirements,
          assignedUserId,
          req.params.id, 
          req.user.businessId
        ]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async deleteJob(req, res) {
    try {
      const { rows } = await db.query(
        'UPDATE jobs SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 RETURNING id',
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async assignJob(req, res) {
    const { userId } = req.body;
    
    try {
      const userCheck = await db.query(
        'SELECT id FROM users WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [userId, req.user.businessId]
      );
      
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { rows } = await db.query(
        `UPDATE jobs 
        SET assigned_user_id = $1, updated_at = NOW() 
        WHERE id = $2 AND business_id = $3 AND deleted_at IS NULL 
        RETURNING *`,
        [userId, req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error assigning job:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async startJob(req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE jobs 
        SET status = 'in_progress', actual_start = NOW(), updated_at = NOW() 
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL 
        RETURNING *`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      await db.query(
        `INSERT INTO time_entries (id, job_id, user_id, entry_type, start_time)
         VALUES($1, $2, $3, 'work', NOW())`,
        [uuidv4(), req.params.id, req.user.id]
      );
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error starting job:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async completeJob(req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE jobs 
        SET status = 'completed', actual_end = NOW(), updated_at = NOW() 
        WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL 
        RETURNING *`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      await db.query(
        `UPDATE time_entries 
         SET end_time = NOW(), updated_at = NOW()
         WHERE job_id = $1 AND user_id = $2 AND end_time IS NULL`,
        [req.params.id, req.user.id]
      );
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error completing job:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = jobController;