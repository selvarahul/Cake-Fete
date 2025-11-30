require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection OK');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error(err.message || err);
    process.exit(1);
  }
})();
