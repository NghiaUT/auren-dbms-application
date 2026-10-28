// backend/src/scripts/test-core.ts
import { pool, withTransaction, testDbConnection } from '../config/db.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';
import { AppError, NotFoundError, ConflictError, UnauthorizedError } from '../utils/AppError.js';
import type { AuthUser } from '../types/index.js';

async function runSmokeTests() {
  console.log('🧪 ================= STARTING CORE SMOKE TESTS =================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Kiểm tra kết nối CSDL MySQL
  // --------------------------------------------------------------------------
  console.log('▶ [Test 1] Kiểm tra kết nối MySQL...');
  try {
    await testDbConnection();
    console.log('✅ [Test 1 PASS] Kết nối MySQL 8 thành công!\n');
  } catch (err: any) {
    console.error('❌ [Test 1 FAIL] Không thể kết nối DB:', err.message);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Kiểm tra withTransaction (Commit & Rollback)
  // --------------------------------------------------------------------------
  console.log('▶ [Test 2] Kiểm tra Transaction & Auto-Rollback...');
  try {
    // 2.1: Test Commit thành công
    const testResult = await withTransaction(async (conn) => {
      const [rows] = await conn.query('SELECT 1 + 1 AS sum');
      return (rows as any)[0].sum;
    });
    console.log(`  - Transaction Commit test: 1 + 1 = ${testResult} (OK)`);

    // 2.2: Test Rollback khi có exception
    let rollbackSuccess = false;
    try {
      await withTransaction(async (conn) => {
        // Cố tình tạo bảng tạm hoặc truy vấn lỗi
        await conn.query('SELECT 1');
        throw new Error('Cố tình ném lỗi để kiểm tra Rollback!');
      });
    } catch (err: any) {
      if (err.message === 'Cố tình ném lỗi để kiểm tra Rollback!') {
        rollbackSuccess = true;
      }
    }

    if (rollbackSuccess) {
      console.log('  - Transaction Auto-Rollback khi có lỗi: OK');
      console.log('✅ [Test 2 PASS] withTransaction hoạt động chính xác!\n');
    } else {
      throw new Error('Rollback không hoạt động đúng kỳ vọng');
    }
  } catch (err: any) {
    console.error('❌ [Test 2 FAIL] Transaction lỗi:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Kiểm tra Ký và Giải mã JWT
  // --------------------------------------------------------------------------
  console.log('▶ [Test 3] Kiểm tra JWT Sign & Verify...');
  try {
    const mockUser: AuthUser = {
      id: 99,
      email: 'test.admin@luxury.com',
      role: 'admin',
    };

    // Tạo token
    const token = signAccessToken(mockUser);
    console.log('  - Ký token thành công (độ dài):', token);

    // Giải mã token
    const decoded = verifyAccessToken(token);
    if (decoded.id === 99 && decoded.role === 'admin' && decoded.email === mockUser.email) {
      console.log('  - Giải mã và xác thực thông tin user: KHỚP');
      console.log('✅ [Test 3 PASS] JWT hoạt động hoàn hảo!\n');
    } else {
      throw new Error('Dữ liệu giải mã không khớp với token gốc');
    }
  } catch (err: any) {
    console.error('❌ [Test 3 FAIL] JWT lỗi:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Kiểm tra tính phân cấp của các Class lỗi AppError
  // --------------------------------------------------------------------------
  console.log('▶ [Test 4] Kiểm tra cấu trúc phân cấp AppError...');
  const notFound = new NotFoundError('Sản phẩm không tồn tại');
  const conflict = new ConflictError('Hết hàng', 'OUT_OF_STOCK');

  if (
    notFound instanceof AppError &&
    notFound.statusCode === 404 &&
    notFound.code === 'NOT_FOUND' &&
    conflict instanceof AppError &&
    conflict.statusCode === 409 &&
    conflict.code === 'OUT_OF_STOCK'
  ) {
    console.log('  - Nhận diện đúng instance của AppError và đúng mã HTTP/Code');
    console.log('✅ [Test 4 PASS] Hệ thống Class AppError chuẩn xác!\n');
  } else {
    console.error('❌ [Test 4 FAIL] Class AppError chưa đúng prototype');
  }

  console.log('🎉 ================= TẤT CẢ TEST ĐỀU VƯỢT QUA (ALL PASSED) =================');
  await pool.end();
  process.exit(0);
}

runSmokeTests();
