import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 🔧 Detectar si es desarrollo o producción
const isProduction = process.env.NODE_ENV === 'production';

// ⚙️ Configuración de desarrollo (localhost)
const devConfig = {
  host: process.env.DB_HOST_DEV || 'localhost',
  user: process.env.DB_USER_DEV || 'root',
  password: process.env.DB_PASSWORD_DEV || 'root',
  database: process.env.DB_NAME_DEV || 'rpm_market',
  port: process.env.DB_PORT_DEV || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 🌐 Configuración de producción
const prodConfig = {
  host: process.env.DB_HOST_PROD || 'localhost',
  user: process.env.DB_USER_PROD || 'root',
  password: process.env.DB_PASSWORD_PROD || 'root',
  database: process.env.DB_NAME_PROD || 'rpm_market',
  port: process.env.DB_PORT_PROD || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 10,
  ssl: process.env.DB_SSL_PROD === 'true' ? 'require' : false,
};

// 📌 Seleccionar configuración según ambiente
const config = isProduction ? prodConfig : devConfig;

console.log(`🔧 Conectando a BD en ambiente: ${isProduction ? '🌐 PRODUCCIÓN' : '💻 DESARROLLO'}`);
console.log(`📍 Host: ${config.host}:${config.port}`);
console.log(`📦 Base de datos: ${config.database}`);

// Crear pool de conexiones
const pool = mysql.createPool(config);

// 🧪 Probar conexión
try {
  const connection = await pool.getConnection();
  console.log(`✅ Conectado a la base de datos con ID ${connection.threadId}`);
  connection.release();
} catch (err) {
  console.error('❌ Error conectando a la base de datos:', err.message);
  process.exit(1); // Detener servidor si no se puede conectar
}

export default pool;
