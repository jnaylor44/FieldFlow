
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
const authRoutes = require('./api/v1/routes/auth.routes');
const jobRoutes = require('./api/v1/routes/job.routes');
const userRoutes = require('./api/v1/routes/user.routes');
const customerRoutes = require('./api/v1/routes/customer.routes');
const financialRoutes = require('./api/v1/routes/financial.routes');
const workerRoutes = require('./api/v1/routes/worker.routes');
const locationRoutes = require('./api/v1/routes/location.routes');
const placesRoutes = require('./api/v1/routes/places.routes');
const reportRoutes = require('./api/v1/routes/report.routes');
const reportTemplateRoutes = require('./api/v1/routes/report-template.routes');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/financial', financialRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/places', placesRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/report-templates', reportTemplateRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;