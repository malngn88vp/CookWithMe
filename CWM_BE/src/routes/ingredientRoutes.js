const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const roleCheck = require('../middlewares/roleCheck');

router.get('/', ingredientController.getAll);
router.post('/', roleCheck.isAuthenticated, ingredientController.create);
router.put('/:id', roleCheck.isAuthenticated, ingredientController.update);
router.delete('/:id', roleCheck.isAuthenticated, ingredientController.remove);

module.exports = router;
