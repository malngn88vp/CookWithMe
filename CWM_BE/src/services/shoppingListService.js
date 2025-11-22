"use strict";

const {
  MealPlanRecipe,
  Recipe,
  Ingredient,
  RecipeIngredient,
  ShoppingListItem,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

/* =======================
    CHUẨN HOÁ ĐƠN VỊ
======================= */

const UNIT_BASE = {
  g: { base: "g", mul: 1 },
  kg: { base: "g", mul: 1000 },
  mg: { base: "g", mul: 0.001 },

  ml: { base: "ml", mul: 1 },
  l: { base: "ml", mul: 1000 },

  qua: { base: "qua", mul: 1 },
  tep: { base: "tep", mul: 1 },
  goi: { base: "goi", mul: 1 },
  la: { base: "la", mul: 1 },
  cay: { base: "cay", mul: 1 },
};

const UNIT_ALIASES = {
  g: ["g", "gram", "grams", "gr", "gam"],
  kg: ["kg", "kilogram"],
  mg: ["mg", "milligram"],
  ml: ["ml", "milliliter"],
  l: ["l", "liter", "litre"],
  qua: ["quả", "quả", "trái", "trái", "qa"],
  tep: ["tép", "tép", "tep"],
  goi: ["gói", "gói", "goi"],
  la: ["lá", "lá"],
  cay: ["cây", "cay"],
};

function canonicalUnit(unit) {
  if (!unit) return null;

  const u = String(unit).trim().toLowerCase();

  // match alias
  for (const [canon, list] of Object.entries(UNIT_ALIASES)) {
    if (list.includes(u)) return canon;
  }

  // if already canonical
  if (UNIT_BASE[u]) return u;

  return null;
}

function normalizeQty(qty, unit) {
  const canon = canonicalUnit(unit);
  if (!canon) return null;

  const base = UNIT_BASE[canon];
  return {
    qty: Number(qty) * base.mul,
    unit: base.base,
  };
}

/* =======================
    TẠO DANH SÁCH MUA SẮM
======================= */

exports.generateShoppingList = async (mealplan_id) => {
  return await sequelize.transaction(async (t) => {
    // XÓA DANH SÁCH CŨ
    await ShoppingListItem.destroy({ where: { mealplan_id }, transaction: t });

    // LẤY TOÀN BỘ RECIPE TRONG MEAL PLAN
    const mealRecipes = await MealPlanRecipe.findAll({
      where: { mealplan_id },
      attributes: ["recipe_id"],
      raw: true,
      transaction: t,
    });

    if (!mealRecipes.length) {
      throw new Error("Meal plan không có món ăn");
    }

    // LẤY NGUYÊN LIỆU CHO TỪNG MÓN (THEO ĐÚNG SỐ LẦN)
    let rawIngredients = [];

    for (const mp of mealRecipes) {
      const recipe = await Recipe.findByPk(mp.recipe_id, {
        include: [
          {
            model: Ingredient,
            as: "ingredients",
            through: { model: RecipeIngredient },
          },
        ],
        transaction: t,
      });

      if (!recipe) continue;

      for (const ing of recipe.ingredients) {
        rawIngredients.push({
          ingredient_id: ing.ingredient_id,
          quantity: Number(ing.RecipeIngredient.quantity),
          unit: ing.RecipeIngredient.unit,
        });
      }
    }

    // ==============================
    // GỘP THEO ingredient_id (CHUẨN)
    // ==============================
    const merged = {};

    for (const ing of rawIngredients) {
      const normalized = normalizeQty(ing.quantity, ing.unit);

      // nếu chuẩn hoá được → dùng đơn vị chuẩn
      const qty = normalized?.qty || Number(ing.quantity);
      const unit = normalized?.unit || ing.unit.toLowerCase();

      const key = `${ing.ingredient_id}`; // 🔥 GỘP THEO ID NGUYÊN LIỆU

      if (!merged[key]) {
        merged[key] = {
          ingredient_id: ing.ingredient_id,
          quantity: 0,
          unit: unit, // giữ unit đầu tiên nếu không chuẩn hoá
        };
      }

      merged[key].quantity += qty;

      // ưu tiên dùng đơn vị chuẩn nếu có
      if (normalized?.unit) {
        merged[key].unit = normalized.unit;
      }
    }

    // LƯU VÀO DB
    const shoppingItems = Object.values(merged).map((m) => ({
      mealplan_id,
      ingredient_id: m.ingredient_id,
      quantity: m.quantity,
      unit: m.unit,
      is_checked: false,
    }));

    await ShoppingListItem.bulkCreate(shoppingItems, { transaction: t });

    // TRẢ VỀ KÈM TÊN NGUYÊN LIỆU
    return await ShoppingListItem.findAll({
      where: { mealplan_id },
      include: [{ model: Ingredient, attributes: ["name"] }],
      order: [["is_checked", "ASC"]],
      transaction: t,
    });
  });
};
