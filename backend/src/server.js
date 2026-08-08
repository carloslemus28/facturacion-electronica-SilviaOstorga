require('dotenv').config();

const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const loadModels = require('./config/models');
const seedSecurityData = require('./config/seed');

const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
const HOST = '0.0.0.0';

let httpServer = null;

const shutdown = async (signal) => {
  console.log(`Recibida señal ${signal}. Cerrando backend de forma ordenada...`);

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await sequelize.close();
    console.log('Conexiones MySQL cerradas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error cerrando backend:', error);
    process.exit(1);
  }
};

process.once('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.once('SIGINT', () => {
  shutdown('SIGINT');
});

const startServer = async () => {
  await testConnection();

  loadModels();

  await sequelize.sync();

  await seedSecurityData();

  httpServer = app.listen(PORT, HOST, () => {
    console.log(`Backend ejecutándose en el puerto ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('❌ El backend no pudo iniciarse:', error);
  process.exit(1);
});