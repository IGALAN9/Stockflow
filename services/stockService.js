const Stock = require('../models/Stock');

const validStockTypes = [
  'stock_bahan_murni',
  'stock_fiber',
  'stock_recycle',
  'stock_cup'
];

/**
 * Adds the specified amount to the given stock type.
 * @param {string} stockType - The stock field to update.
 * @param {number} amount - The amount to add (must be positive).
 * @returns {Promise<Object>} - The updated Stock document.
 * @throws {Error} - If stockType is invalid or amount is not positive.
 */
async function addStock(stockType, amount) {
  if (!validStockTypes.includes(stockType)) {
    throw new Error(`Invalid stock type: ${stockType}`);
  }
  if (amount <= 0) {
    throw new Error('Amount to add must be positive');
  }

  const stock = await Stock.findOne();
  if (!stock) {
    throw new Error('Stock document not found');
  }

  stock[stockType] += amount;
  await stock.save();
  return stock;
}

/**
 * Decreases the specified amount from the given stock type.
 * Ensures stock does not go below zero.
 * @param {string} stockType - The stock field to update.
 * @param {number} amount - The amount to decrease (must be positive).
 * @returns {Promise<Object>} - The updated Stock document.
 * @throws {Error} - If stockType is invalid, amount is not positive, or insufficient stock.
 */
async function decreaseStock(stockType, amount) {
  if (!validStockTypes.includes(stockType)) {
    throw new Error(`Invalid stock type: ${stockType}`);
  }
  if (amount <= 0) {
    throw new Error('Amount to decrease must be positive');
  }

  const stock = await Stock.findOne();
  if (!stock) {
    throw new Error('Stock document not found');
  }

  if (stock[stockType] < amount) {
    throw new Error(`Insufficient stock for ${stockType}`);
  }

  stock[stockType] -= amount;
  await stock.save();
  return stock;
}

module.exports = {
  addStock,
  decreaseStock
};
