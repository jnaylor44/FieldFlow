const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const customerController = require('../controllers/customer.controller');
router.use(authMiddleware);
router.get('/', customerController.listCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/:id/jobs', customerController.getCustomerJobs);

module.exports = router;