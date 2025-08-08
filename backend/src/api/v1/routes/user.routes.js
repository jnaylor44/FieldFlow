const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
router.use(authMiddleware);
router.get('/me', userController.getCurrentUser);
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.put('/:id/password', userController.updatePassword);
router.delete('/:id', userController.deleteUser);
router.put('/push-token', userController.updatePushToken);

module.exports = router;