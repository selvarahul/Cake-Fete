// backend/models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerPhone: { type: DataTypes.STRING, allowNull: false },
  customerAddress: { type: DataTypes.TEXT, allowNull: false },
  deliveryDate: { type: DataTypes.STRING, allowNull: false },
  deliveryTime: { type: DataTypes.STRING, allowNull: true },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  // Use TEXT for MySQL compatibility; we will stringify/parse in code
  items: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;
