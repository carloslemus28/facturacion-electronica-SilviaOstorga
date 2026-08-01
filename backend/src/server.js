require('dotenv').config();

const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const loadModels = require('./config/models');
const seedSecurityData = require('./config/seed');

const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
const HOST = '0.0.0.0';

const startServer = async () => {
  await testConnection();

  loadModels();

  await sequelize.sync();

  await seedSecurityData();

  app.listen(PORT, HOST, () => {
    console.log(`Backend ejecutándose en el puerto ${PORT}`);
  });
};

startServer();