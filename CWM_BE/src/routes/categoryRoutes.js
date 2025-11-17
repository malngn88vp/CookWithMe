const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const roleCheck = require('../middlewares/roleCheck');

router.get('/', categoryController.getAll);
router.post('/', roleCheck.isAuthenticated, categoryController.create);
router.put('/:id', roleCheck.isAuthenticated, categoryController.update);
router.delete('/:id', roleCheck.isAuthenticated, categoryController.remove);

module.exports = router;
