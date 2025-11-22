"use strict";

const { ShoppingListItem } = require("../models");
const shoppingListService = require("../services/shoppingListService");

/* ==============================
   GET SHOPPING LIST
============================== */

exports.getShoppingList = async (req, res) => {
  try {
    const { mealplan_id } = req.params;

    const data = await shoppingListService.generateShoppingList(mealplan_id);

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách mua sắm:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ==============================
   ADD
============================== */

exports.addShoppingItem = async (req, res) => {
  try {
    const { mealplan_id, ingredient_id, quantity, unit } = req.body;

    const newItem = await ShoppingListItem.create({
      mealplan_id,
      ingredient_id,
      quantity,
      unit,
    });

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   TOGGLE
============================== */

exports.toggleChecked = async (req, res) => {
  try {
    const item = await ShoppingListItem.findByPk(req.params.item_id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });

    item.is_checked = !item.is_checked;
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   DELETE
============================== */

exports.deleteShoppingItem = async (req, res) => {
  try {
    const item = await ShoppingListItem.findByPk(req.params.item_id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });

    await item.destroy();

    res.json({ message: "Đã xoá" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GENERATE
============================== */

exports.generateShoppingListFromMealPlan = async (req, res) => {
  try {
    const data = await shoppingListService.generateShoppingList(
      req.params.mealplan_id
    );

    res.json({
      message: "Đã tạo danh sách mua sắm",
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
