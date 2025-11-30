// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const DIALECT = process.env.DB_DIALECT || 'mysql';

let sequelize;

if (DIALECT === 'sqlite') {
  const storage = process.env.DB_STORAGE || path.join(__dirname, '..', 'dev.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'cake_ordering',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      dialect: DIALECT,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {}
    }
  );
}

module.exports = sequelize;
