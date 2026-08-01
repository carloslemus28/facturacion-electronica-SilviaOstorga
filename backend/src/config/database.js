const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
  process.env.MYSQLUSER || process.env.MYSQL_USER,
  process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'mysql',
    port: Number(process.env.MYSQLPORT || process.env.MYSQL_INTERNAL_PORT || process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '-06:00',
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testConnection = async () => {
  const maxRetries = Number(process.env.DB_CONNECTION_RETRIES || 10);
  const retryDelayMs = Number(process.env.DB_CONNECTION_RETRY_DELAY_MS || 3000);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente');
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      console.error(
        `❌ Error al conectar con MySQL (intento ${attempt}/${maxRetries}):`,
        error.message
      );

      if (isLastAttempt) {
        process.exit(1);
      }

      await sleep(retryDelayMs);
    }
  }
};

module.exports = {
  sequelize,
  testConnection
};
