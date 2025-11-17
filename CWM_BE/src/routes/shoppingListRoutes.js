const express = require('express');
const router = express.Router();
const shoppingListController = require('../controllers/shoppingListController');

router.get('/:mealplan_id', shoppingListController.getShoppingList);
router.post('/', shoppingListController.addShoppingItem);
router.patch('/toggle/:item_id', shoppingListController.toggleChecked);
router.delete('/:item_id', shoppingListController.deleteShoppingItem);

// 📌 Sinh danh sách mua sắm tự động từ MealPlan
router.post("/generate/:mealplan_id", shoppingListController.generateShoppingListFromMealPlan);

module.exports = router;
