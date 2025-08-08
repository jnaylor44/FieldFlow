const db = require('../../../config/database');

const workerController = {
  async listWorkers(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT id, name, email, phone, avatar_url, preferences 
         FROM users 
         WHERE business_id = $1 
         AND role = 'worker' 
         AND deleted_at IS NULL 
         ORDER BY name ASC`,
        [req.user.businessId]
      );
      const workersWithStatus = await Promise.all(rows.map(async (worker) => {
        const jobsResult = await db.query(
          `SELECT COUNT(*) AS jobs_in_progress 
           FROM jobs 
           WHERE assigned_user_id = $1 
           AND status = 'in_progress' 
           AND deleted_at IS NULL`,
          [worker.id]
        );
        const nextJobResult = await db.query(
          `SELECT title, scheduled_start 
           FROM jobs 
           WHERE assigned_user_id = $1 
           AND scheduled_start > NOW() 
           AND status NOT IN ('completed', 'cancelled') 
           AND deleted_at IS NULL 
           ORDER BY scheduled_start ASC 
           LIMIT 1`,
          [worker.id]
        );
        
        return {
          ...worker,
          jobsInProgress: parseInt(jobsResult.rows[0].jobs_in_progress),
          nextJob: nextJobResult.rows.length ? 
            `${nextJobResult.rows[0].title} (${new Date(nextJobResult.rows[0].scheduled_start).toLocaleDateString()})` : 
            null
        };
      }));
      
      res.json(workersWithStatus);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getWorkerSchedule(req, res) {
    try {
      const workerCheck = await db.query(
        `SELECT id FROM users
         WHERE id = $1 AND business_id = $2 AND role = 'worker' AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      
      const { rows } = await db.query(
        `SELECT j.id, j.title, j.description, j.status, 
                j.scheduled_start, j.scheduled_end, 
                j.actual_start, j.actual_end,
                j.location, j.priority,
                c.name AS customer_name, c.phone AS customer_phone
         FROM jobs j
         JOIN customers c ON j.customer_id = c.id
         WHERE j.assigned_user_id = $1
           AND j.business_id = $2
           AND j.deleted_at IS NULL
           AND j.scheduled_start >= NOW()
         ORDER BY j.scheduled_start ASC`,
        [req.params.id, req.user.businessId]
      );
      
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getWorkerJobs(req, res) {
    const { status, timeframe } = req.query;
    
    try {
      const workerCheck = await db.query(
        `SELECT id FROM users
         WHERE id = $1 AND business_id = $2 AND role = 'worker' AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      
      let query = `
        SELECT j.id, j.title, j.description, j.status, 
               j.scheduled_start, j.scheduled_end, 
               j.actual_start, j.actual_end,
               j.location, j.priority,
               c.name AS customer_name, c.phone AS customer_phone
        FROM jobs j
        JOIN customers c ON j.customer_id = c.id
        WHERE j.assigned_user_id = $1
          AND j.business_id = $2
          AND j.deleted_at IS NULL
      `;
      
      const queryParams = [req.params.id, req.user.businessId];
      let paramCount = 3;
      if (status) {
        query += ` AND j.status = $${paramCount++}`;
        queryParams.push(status);
      }
      if (timeframe === 'past') {
        query += ` AND j.scheduled_end < NOW()`;
      } else if (timeframe === 'upcoming') {
        query += ` AND j.scheduled_start >= NOW()`;
      } else if (timeframe === 'today') {
        query += ` AND DATE(j.scheduled_start) = CURRENT_DATE`;
      } else if (timeframe === 'this_week') {
        query += ` AND DATE(j.scheduled_start) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
      }
      
      query += ` ORDER BY j.scheduled_start DESC`;
      
      const { rows } = await db.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getWorkerMetrics(req, res) {
    try {
      const workerCheck = await db.query(
        `SELECT id FROM users
         WHERE id = $1 AND business_id = $2 AND role = 'worker' AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      const completionRateQuery = `
        SELECT 
          COUNT(*) AS total_jobs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_jobs
        FROM jobs
        WHERE assigned_user_id = $1
          AND business_id = $2
          AND deleted_at IS NULL
          AND scheduled_end < NOW()
      `;
      const durationQuery = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600) AS avg_hours_per_job
        FROM jobs
        WHERE assigned_user_id = $1
          AND business_id = $2
          AND deleted_at IS NULL
          AND actual_start IS NOT NULL
          AND actual_end IS NOT NULL
      `;
      const hoursQuery = `
        SELECT 
          SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) AS total_hours
        FROM time_entries
        WHERE user_id = $1
          AND job_id IN (SELECT id FROM jobs WHERE business_id = $2)
          AND entry_type = 'work'
          AND deleted_at IS NULL
          AND end_time IS NOT NULL
      `;
      const jobsPerDayQuery = `
        SELECT 
          AVG(jobs_count) AS avg_jobs_per_day
        FROM (
          SELECT 
            DATE(actual_end) AS completion_date,
            COUNT(*) AS jobs_count
          FROM jobs
          WHERE assigned_user_id = $1
            AND business_id = $2
            AND status = 'completed'
            AND deleted_at IS NULL
            AND actual_end IS NOT NULL
          GROUP BY DATE(actual_end)
        ) AS daily_completions
      `;
      
      const [completionRate, duration, hours, jobsPerDay] = await Promise.all([
        db.query(completionRateQuery, [req.params.id, req.user.businessId]),
        db.query(durationQuery, [req.params.id, req.user.businessId]),
        db.query(hoursQuery, [req.params.id, req.user.businessId]),
        db.query(jobsPerDayQuery, [req.params.id, req.user.businessId])
      ]);
      
      const metrics = {
        completion_rate: completionRate.rows[0].completed_jobs / (parseInt(completionRate.rows[0].total_jobs) || 1),
        avg_hours_per_job: parseFloat(duration.rows[0].avg_hours_per_job) || 0,
        total_hours: parseFloat(hours.rows[0].total_hours) || 0,
        avg_jobs_per_day: parseFloat(jobsPerDay.rows[0].avg_jobs_per_day) || 0,
        total_jobs: parseInt(completionRate.rows[0].total_jobs) || 0,
        completed_jobs: parseInt(completionRate.rows[0].completed_jobs) || 0
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getWorker(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT id, name, email, phone, avatar_url, preferences, role
         FROM users
         WHERE id = $1 
         AND business_id = $2 
         AND role = 'worker' 
         AND deleted_at IS NULL`,
        [req.params.id, req.user.businessId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      const jobsResult = await db.query(
        `SELECT COUNT(*) AS jobs_in_progress 
         FROM jobs 
         WHERE assigned_user_id = $1 
         AND status = 'in_progress' 
         AND deleted_at IS NULL`,
        [req.params.id]
      );
      const nextJobResult = await db.query(
        `SELECT title, scheduled_start 
         FROM jobs 
         WHERE assigned_user_id = $1 
         AND scheduled_start > NOW() 
         AND status NOT IN ('completed', 'cancelled') 
         AND deleted_at IS NULL 
         ORDER BY scheduled_start ASC 
         LIMIT 1`,
        [req.params.id]
      );
      
      const worker = {
        ...rows[0],
        jobsInProgress: parseInt(jobsResult.rows[0].jobs_in_progress),
        nextJob: nextJobResult.rows.length > 0 ? 
          `${nextJobResult.rows[0].title} (${new Date(nextJobResult.rows[0].scheduled_start).toLocaleDateString()})` : 
          null
      };
      
      res.json(worker);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async createTimeEntry(req, res) {
    const { job_id, entry_type, start_time, end_time, notes } = req.body;
    
    try {
      const workerCheck = await db.query(
        `SELECT id FROM users
         WHERE id = $1 AND business_id = $2 AND role = 'worker'`,
        [req.params.id, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      const jobCheck = await db.query(
        `SELECT id FROM jobs
         WHERE id = $1 AND business_id = $2`,
        [job_id, req.user.businessId]
      );
      
      if (jobCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      const { rows } = await db.query(
        `INSERT INTO time_entries
         (job_id, user_id, entry_type, start_time, end_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [job_id, req.params.id, entry_type, start_time, end_time, notes]
      );
      
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getTimeEntries(req, res) {
    const { start_date, end_date, job_id } = req.query;
    
    try {
      const workerCheck = await db.query(
        `SELECT id FROM users
         WHERE id = $1 AND business_id = $2 AND role = 'worker'`,
        [req.params.id, req.user.businessId]
      );
      
      if (workerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      
      let query = `
        SELECT t.*, j.title AS job_title
        FROM time_entries t
        JOIN jobs j ON t.job_id = j.id
        WHERE t.user_id = $1
          AND j.business_id = $2
          AND t.deleted_at IS NULL
      `;
      
      const queryParams = [req.params.id, req.user.businessId];
      let paramCount = 3;
      
      if (start_date) {
        query += ` AND t.start_time >= $${paramCount++}`;
        queryParams.push(start_date);
      }
      
      if (end_date) {
        query += ` AND t.start_time <= $${paramCount++}`;
        queryParams.push(end_date);
      }
      
      if (job_id) {
        query += ` AND t.job_id = $${paramCount++}`;
        queryParams.push(job_id);
      }
      
      query += ` ORDER BY t.start_time DESC`;
      
      const { rows } = await db.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = workerController;