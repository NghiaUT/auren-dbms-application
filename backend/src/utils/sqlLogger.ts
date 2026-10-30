// ============================================================================
// File: backend/src/utils/sqlLogger.ts
// Vai trò: Trình ghi nhật ký truy vấn SQL chuyên nghiệp dành cho môn học CSDL:
//   - Tự động nhận diện 8 loại query (Insert, Delete, Update, Điều kiện đơn,
//     Điều kiện phức hợp, Join, Subquery, Aggregate)
//   - Nhận diện cơ chế Transaction ACID, Optimistic Locking, Pessimistic Locking
//   - Đo đạc chính xác thời gian thực thi (ms) và số dòng trả về/ảnh hưởng
//   - Định dạng bảng viền màu sắc ANSI chuyên nghiệp trong Terminal
// ============================================================================

export interface QueryLogContext {
  txId?: number;
  txStep?: number;
}

// Bảng mã màu ANSI
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  
  // Colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright Colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Backgrounds
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

/**
 * Tự động phân loại câu lệnh SQL vào các loại truy vấn chuẩn DBMS (a - h)
 */
export function classifyQuery(sql: string): string[] {
  const clean = sql.replace(/\s+/g, ' ').trim();
  const tags: string[] = [];

  // [a] Insert
  if (/^\s*INSERT(\s+INTO)?\b/i.test(clean)) {
    tags.push(`${C.brightGreen}[a: INSERT]${C.reset}`);
  }

  // [b] Delete
  if (/^\s*DELETE(\s+FROM)?\b/i.test(clean)) {
    tags.push(`${C.brightRed}[b: DELETE]${C.reset}`);
  }

  // [c] Update
  if (/^\s*UPDATE\b/i.test(clean)) {
    tags.push(`${C.brightYellow}[c: UPDATE]${C.reset}`);
  }

  // Khóa lạc quan (Optimistic) & Khóa bi quan (Pessimistic)
  if (/version\s*=\s*version\s*\+\s*1/i.test(clean)) {
    tags.push(`${C.brightCyan}[OPTIMISTIC LOCK: version]${C.reset}`);
  }
  if (/FOR\s+UPDATE\b/i.test(clean)) {
    tags.push(`${C.brightMagenta}[PESSIMISTIC LOCK: FOR UPDATE]${C.reset}`);
  }

  // [f] Join
  if (/\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN)\b/i.test(clean)) {
    // Đếm số lượng JOIN
    const joinMatches = clean.match(/\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN)\b/gi);
    const count = joinMatches ? joinMatches.length : 1;
    tags.push(`${C.cyan}[f: JOIN (${count} tables)]${C.reset}`);
  }

  // [g] Subquery (Truy vấn lồng con)
  if (/\(\s*SELECT\b/i.test(clean)) {
    tags.push(`${C.magenta}[g: SUBQUERY]${C.reset}`);
  }

  // [h] Aggregate (Gom nhóm & hàm gộp)
  if (/\b(GROUP\s+BY|HAVING|COUNT\(|SUM\(|AVG\(|MIN\(|MAX\()\b/i.test(clean)) {
    const hasHaving = /\bHAVING\b/i.test(clean);
    tags.push(`${C.blue}[h: AGGREGATE${hasHaving ? ' + HAVING' : ''}]${C.reset}`);
  }

  // [d] & [e] Điều kiện đơn vs Điều kiện phức hợp
  if (/\bWHERE\b/i.test(clean)) {
    if (/\b(AND|OR|IN\s*\(|BETWEEN|GREATEST|COALESCE)\b/i.test(clean)) {
      tags.push(`${C.white}[e: COMPLEX COND]${C.reset}`);
    } else {
      tags.push(`${C.dim}[d: SINGLE COND]${C.reset}`);
    }
  }

  return tags;
}

/**
 * Rút gọn và định dạng SQL để in terminal gọn gàng
 */
function formatSqlPreview(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|GROUP BY|HAVING|ORDER BY|LIMIT|UPDATE|SET|INSERT INTO|VALUES|DELETE FROM)\b/gi, (match) => {
      return `${C.bold}${match.toUpperCase()}${C.reset}`;
    });
}

/**
 * Định dạng tham số query (params)
 */
function formatParams(params?: any): string {
  if (!params || (Array.isArray(params) && params.length === 0)) {
    return `${C.dim}None${C.reset}`;
  }
  if (Array.isArray(params)) {
    return `[ ${params.map((p) => (typeof p === 'string' ? `'${p}'` : p)).join(', ')} ]`;
  }
  return JSON.stringify(params);
}

/**
 * In thông tin câu lệnh SQL đơn lẻ
 */
export function logQueryExecution(
  sql: string,
  params: any,
  durationMs: number,
  result: any,
  context?: QueryLogContext,
): void {
  // Không in câu lệnh kiểm tra ping hoặc SET TRANSACTION hệ thống
  if (sql.includes('/* ping */') || sql.startsWith('SET TRANSACTION')) {
    return;
  }

  const tags = classifyQuery(sql);
  const tagStr = tags.length > 0 ? tags.join(' ') : `${C.dim}[QUERY]${C.reset}`;
  const timeFormatted = durationMs < 5 ? `${C.green}${durationMs.toFixed(2)} ms${C.reset}` : `${C.yellow}${durationMs.toFixed(2)} ms${C.reset}`;

  let resultSummary = '';
  if (result && Array.isArray(result)) {
    resultSummary = `${C.cyan}${result.length} rows returned${C.reset}`;
  } else if (result && typeof result === 'object' && 'affectedRows' in result) {
    resultSummary = `${C.green}${result.affectedRows} affected${C.reset}${result.insertId ? ` (ID #${result.insertId})` : ''}`;
  }

  if (context?.txId) {
    // Câu lệnh nằm trong Transaction
    console.log(
      `  ${C.magenta}║${C.reset} ${C.dim}├─[TX #${context.txId} Step ${context.txStep || 1}]${C.reset} ${tagStr} ── (${timeFormatted})`,
    );
    console.log(`  ${C.magenta}║${C.reset}  ${C.dim}SQL:${C.reset} ${formatSqlPreview(sql)}`);
    if (params && Array.isArray(params) && params.length > 0) {
      console.log(`  ${C.magenta}║${C.reset}  ${C.dim}PARAMS:${C.reset} ${C.yellow}${formatParams(params)}${C.reset}`);
    }
    if (resultSummary) {
      console.log(`  ${C.magenta}║${C.reset}  ${C.dim}RESULT:${C.reset} ${resultSummary}`);
    }
  } else {
    // Câu lệnh độc lập ngoài Transaction
    console.log(`\n${C.cyan}┌─── [DBMS QUERY]${C.reset} ${tagStr} ──────────────── (${timeFormatted})`);
    console.log(`${C.cyan}│${C.reset} ${C.dim}SQL   :${C.reset} ${formatSqlPreview(sql)}`);
    if (params && Array.isArray(params) && params.length > 0) {
      console.log(`${C.cyan}│${C.reset} ${C.dim}PARAMS:${C.reset} ${C.yellow}${formatParams(params)}${C.reset}`);
    }
    if (resultSummary) {
      console.log(`${C.cyan}│${C.reset} ${C.dim}RESULT:${C.reset} ${resultSummary}`);
    }
    console.log(`${C.cyan}└─────────────────────────────────────────────────────────────${C.reset}`);
  }
}

let txCounter = 0;

/**
 * In thông báo bắt đầu một Giao dịch ACID
 */
export function logTransactionStart(isolation: string): number {
  txCounter++;
  const currentId = txCounter;
  console.log(`\n${C.magenta}╔════ [TRANSACTION ACID BEGIN #${currentId}] (Isolation: ${C.bold}${isolation}${C.reset}${C.magenta}) ══════════════════════════${C.reset}`);
  return currentId;
}

/**
 * In thông báo hoàn tất COMMIT Giao dịch ACID
 */
export function logTransactionCommit(txId: number, durationMs: number): void {
  const timeFormatted = `${C.green}${durationMs.toFixed(2)} ms${C.reset}`;
  console.log(`${C.magenta}╚════ [TRANSACTION #${txId} COMMIT] ═══════════════════════ Total: (${timeFormatted}${C.magenta}) ══════${C.reset}\n`);
}

/**
 * In thông báo ROLLBACK Giao dịch ACID khi gặp lỗi
 */
export function logTransactionRollback(txId: number, durationMs: number, errorMsg: string): void {
  const timeFormatted = `${C.red}${durationMs.toFixed(2)} ms${C.reset}`;
  console.log(`${C.red}╚════ [TRANSACTION #${txId} ROLLBACK (ABORTED)] ════════════ Total: (${timeFormatted}) ══════`);
  console.log(`  ${C.red}REASON: ${errorMsg}${C.reset}\n`);
}
