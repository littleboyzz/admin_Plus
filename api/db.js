// config/db.js
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

// Bật debug khi cần: MONGOOSE_DEBUG=1
if (process.env.MONGOOSE_DEBUG === '1') {
  mongoose.set('debug', true);
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billiard';
const isProd = process.env.NODE_ENV === 'production';

// Giới hạn/timeout có thể tinh chỉnh qua ENV
const options = {
  autoIndex: !isProd,                                     // tạo index tự động ở dev
  maxPoolSize: Number(process.env.DB_MAX_POOL || 10),     // kết nối tối đa trong pool
  minPoolSize: Number(process.env.DB_MIN_POOL || 0),
  serverSelectionTimeoutMS: Number(process.env.DB_SRV_TIMEOUT || 10000),
  socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT || 45000),
};

let connectPromise = null;

// Kết nối MongoDB (có retry nhẹ)
async function connect(retry = 3) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectPromise) return connectPromise;

  // Gắn listener 1 lần
  const conn = mongoose.connection;
  if (!conn._hasListeners) {
    conn._hasListeners = true;
    conn.on('connected', () => console.log('🧩 Mongoose connected'));
    conn.on('error', (e) => console.error('🔻 Mongoose error:', e.message));
    conn.on('disconnected', () => console.warn('⚠️  Mongoose disconnected'));
    conn.on('reconnected', () => console.log('🔁 Mongoose reconnected'));

    // Đóng kết nối “êm” khi nhận tín hiệu hệ điều hành
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(sig => {
      process.once(sig, async () => {
        try {
          await close();
          console.log(`👋 Closed DB on ${sig}`);
        } finally {
          process.exit(0);
        }
      });
    });
  }

  connectPromise = mongoose.connect(uri, options)
    .then((m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    })
    .catch(async (err) => {
      console.error('❌ MongoDB initial connect error:', err.message);
      connectPromise = null;
      if (retry > 0) {
        const backoff = (4 - retry) * 1000; // 1s, 2s, 3s
        console.log(`⏳ Retrying in ${backoff / 1000}s... (${retry} left)`);
        await new Promise(r => setTimeout(r, backoff));
        return connect(retry - 1);
      }
      process.exitCode = 1;
      throw err;
    });

  return connectPromise;
}

// Đóng kết nối thủ công
async function close() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

// Kiểm tra trạng thái
function isConnected() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

/**
 * Helper chạy tác vụ trong transaction.
 * - Nếu không hỗ trợ (standalone, chưa bật replica set) → chạy không transaction.
 * - Có thể tắt cưỡng bức bằng DB_TRANSACTIONS=0
 * @param {(session: import('mongoose').ClientSession|null) => any} work
 */
async function withTransaction(work) {
  if (process.env.DB_TRANSACTIONS === '0') {
    return work(null);
  }
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    // Fallback khi không hỗ trợ transaction
    if (/replica set|transactions are not supported/i.test(err?.message || '')) {
      console.warn('ℹ️ Transactions not supported; running without transaction.');
      return work(null);
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
}

module.exports = {
  mongoose,
  uri,
  connect,
  close,
  isConnected,
  withTransaction,
};
// // db.js
// const mockData = {
//   '09/11/2025': { totalRevenue: 35000, invoiceCount: 1, itemCount: 1 },
//   '08/11/2025': { totalRevenue: 120000, invoiceCount: 3, itemCount: 5 },
//   '07/11/2025': { totalRevenue: 85000, invoiceCount: 2, itemCount: 4 },
// };

// export const getRevenueByDate = (dateStr) => mockData[dateStr] || null;

// export const getRevenueByRange = (startStr, endStr) => {
//   const parseDate = (str) => {
//     const [day, month, year] = str.split('/').map(Number);
//     return new Date(year, month - 1, day);
//   };

//   const start = parseDate(startStr);
//   const end = parseDate(endStr);
//   let totalRevenue = 0, invoiceCount = 0, itemCount = 0;

//   Object.keys(mockData).forEach((key) => {
//     const d = parseDate(key);
//     if (d >= start && d <= end) {
//       totalRevenue += mockData[key].totalRevenue;
//       invoiceCount += mockData[key].invoiceCount;
//       itemCount += mockData[key].itemCount;
//     }
//   });

//   if (totalRevenue === 0) return null;
//   return {
//     totalRevenue: totalRevenue.toLocaleString('vi-VN') + ' ₫',
//     invoiceCount,
//     itemCount,
//   };
// };
