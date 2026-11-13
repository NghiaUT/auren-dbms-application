// // ============================================================================
// // File: backend/src/utils/sqlLogger.ts
// // Vai trò: Trình ghi nhật ký truy vấn SQL chuyên nghiệp dành cho môn học CSDL:
// //   - Tự động nhận diện 8 loại query (Insert, Delete, Update, Điều kiện đơn,
// //     Điều kiện phức hợp, Join, Subquery, Aggregate)
// //   - Nhận diện cơ chế Transaction ACID, Optimistic Locking, Pessimistic Locking
// //   - Đo đạc chính xác thời gian thực thi (ms) và số dòng trả về/ảnh hưởng
// //   - Định dạng bảng viền màu sắc ANSI chuyên nghiệp trong Terminal
// // ============================================================================

// export interface QueryLogContext {
//   txId?: number;
//   txStep?: number;
// }

// // Bảng mã màu ANSI
// const C = {
//   reset: '\x1b[0m',
//   bold: '\x1b[1m',
//   dim: '\x1b[2m',
//   italic: '\x1b[3m',

//   // Colors
//   red: '\x1b[31m',
//   green: '\x1b[32m',
//   yellow: '\x1b[33m',
//   blue: '\x1b[34m',
//   magenta: '\x1b[35m',
//   cyan: '\x1b[36m',
//   white: '\x1b[37m',

//   // Bright Colors
//   brightRed: '\x1b[91m',
//   brightGreen: '\x1b[92m',
//   brightYellow: '\x1b[93m',
//   brightBlue: '\x1b[94m',
//   brightMagenta: '\x1b[95m',
//   brightCyan: '\x1b[96m',
//   brightWhite: '\x1b[97m',

//   // Backgrounds
//   bgBlue: '\x1b[44m',
//   bgMagenta: '\x1b[45m',
// };

// /**
//  * Tự động phân loại câu lệnh SQL vào các loại truy vấn chuẩn DBMS (a - h)
//  */
// export function classifyQuery(sql: string): string[] {
//   const clean = sql.replace(/\s+/g, ' ').trim();
//   const tags: string[] = [];

//   // [a] Insert
//   if (/^\s*INSERT(\s+INTO)?\b/i.test(clean)) {
//     tags.push(`${C.brightGreen}[a: INSERT]${C.reset}`);
//   }

//   // [b] Delete
//   if (/^\s*DELETE(\s+FROM)?\b/i.test(clean)) {
//     tags.push(`${C.brightRed}[b: DELETE]${C.reset}`);
//   }

//   // [c] Update
//   if (/^\s*UPDATE\b/i.test(clean)) {
//     tags.push(`${C.brightYellow}[c: UPDATE]${C.reset}`);
//   }

//   // Khóa lạc quan (Optimistic) & Khóa bi quan (Pessimistic)
//   if (/version\s*=\s*version\s*\+\s*1/i.test(clean)) {
//     tags.push(`${C.brightCyan}[OPTIMISTIC LOCK: version]${C.reset}`);
//   }
//   if (/FOR\s+UPDATE\b/i.test(clean)) {
//     tags.push(`${C.brightMagenta}[PESSIMISTIC LOCK: FOR UPDATE]${C.reset}`);
//   }

//   // [f] Join
//   if (/\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN)\b/i.test(clean)) {
//     // Đếm số lượng JOIN
//     const joinMatches = clean.match(/\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN)\b/gi);
//     const count = joinMatches ? joinMatches.length : 1;
//     tags.push(`${C.cyan}[f: JOIN (${count} tables)]${C.reset}`);
//   }

//   // [g] Subquery (Truy vấn lồng con)
//   if (/\(\s*SELECT\b/i.test(clean)) {
//     tags.push(`${C.magenta}[g: SUBQUERY]${C.reset}`);
//   }

//   // [h] Aggregate (Gom nhóm & hàm gộp)
//   if (/\b(GROUP\s+BY|HAVING|COUNT\(|SUM\(|AVG\(|MIN\(|MAX\()\b/i.test(clean)) {
//     const hasHaving = /\bHAVING\b/i.test(clean);
//     tags.push(`${C.blue}[h: AGGREGATE${hasHaving ? ' + HAVING' : ''}]${C.reset}`);
//   }

//   // [d] & [e] Điều kiện đơn vs Điều kiện phức hợp
//   if (/\bWHERE\b/i.test(clean)) {
//     if (/\b(AND|OR|IN\s*\(|BETWEEN|GREATEST|COALESCE)\b/i.test(clean)) {
//       tags.push(`${C.white}[e: COMPLEX COND]${C.reset}`);
//     } else {
//       tags.push(`${C.dim}[d: SINGLE COND]${C.reset}`);
//     }
//   }

//   return tags;
// }

// /**
//  * Rút gọn và định dạng SQL để in terminal gọn gàng
//  */
// function formatSqlPreview(sql: string): string {
//   return sql
//     .replace(/\s+/g, ' ')
//     .trim()
//     .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|GROUP BY|HAVING|ORDER BY|LIMIT|UPDATE|SET|INSERT INTO|VALUES|DELETE FROM)\b/gi, (match) => {
//       return `${C.bold}${match.toUpperCase()}${C.reset}`;
//     });
// }

// /**
//  * Định dạng tham số query (params)
//  */
// function formatParams(params?: any): string {
//   if (!params || (Array.isArray(params) && params.length === 0)) {
//     return `${C.dim}None${C.reset}`;
//   }
//   if (Array.isArray(params)) {
//     return `[ ${params.map((p) => (typeof p === 'string' ? `'${p}'` : p)).join(', ')} ]`;
//   }
//   return JSON.stringify(params);
// }

// /**
//  * In thông tin câu lệnh SQL đơn lẻ
//  */
// export function logQueryExecution(
//   sql: string,
//   params: any,
//   durationMs: number,
//   result: any,
//   context?: QueryLogContext,
// ): void {
//   // Không in câu lệnh kiểm tra ping hoặc SET TRANSACTION hệ thống
//   if (sql.includes('/* ping */') || sql.startsWith('SET TRANSACTION')) {
//     return;
//   }

//   const tags = classifyQuery(sql);
//   const tagStr = tags.length > 0 ? tags.join(' ') : `${C.dim}[QUERY]${C.reset}`;
//   const timeFormatted = durationMs < 5 ? `${C.green}${durationMs.toFixed(2)} ms${C.reset}` : `${C.yellow}${durationMs.toFixed(2)} ms${C.reset}`;

//   let resultSummary = '';
//   if (result && Array.isArray(result)) {
//     resultSummary = `${C.cyan}${result.length} rows returned${C.reset}`;
//   } else if (result && typeof result === 'object' && 'affectedRows' in result) {
//     resultSummary = `${C.green}${result.affectedRows} affected${C.reset}${result.insertId ? ` (ID #${result.insertId})` : ''}`;
//   }

//   if (context?.txId) {
//     // Câu lệnh nằm trong Transaction
//     console.log(
//       `  ${C.magenta}║${C.reset} ${C.dim}├─[TX #${context.txId} Step ${context.txStep || 1}]${C.reset} ${tagStr} ── (${timeFormatted})`,
//     );
//     console.log(`  ${C.magenta}║${C.reset}  ${C.dim}SQL:${C.reset} ${formatSqlPreview(sql)}`);
//     if (params && Array.isArray(params) && params.length > 0) {
//       console.log(`  ${C.magenta}║${C.reset}  ${C.dim}PARAMS:${C.reset} ${C.yellow}${formatParams(params)}${C.reset}`);
//     }
//     if (resultSummary) {
//       console.log(`  ${C.magenta}║${C.reset}  ${C.dim}RESULT:${C.reset} ${resultSummary}`);
//     }
//   } else {
//     // Câu lệnh độc lập ngoài Transaction
//     console.log(`\n${C.cyan}┌─── [DBMS QUERY]${C.reset} ${tagStr} ──────────────── (${timeFormatted})`);
//     console.log(`${C.cyan}│${C.reset} ${C.dim}SQL   :${C.reset} ${formatSqlPreview(sql)}`);
//     if (params && Array.isArray(params) && params.length > 0) {
//       console.log(`${C.cyan}│${C.reset} ${C.dim}PARAMS:${C.reset} ${C.yellow}${formatParams(params)}${C.reset}`);
//     }
//     if (resultSummary) {
//       console.log(`${C.cyan}│${C.reset} ${C.dim}RESULT:${C.reset} ${resultSummary}`);
//     }
//     console.log(`${C.cyan}└─────────────────────────────────────────────────────────────${C.reset}`);
//   }
// }

// let txCounter = 0;

// /**
//  * In thông báo bắt đầu một Giao dịch ACID
//  */
// export function logTransactionStart(isolation: string): number {
//   txCounter++;
//   const currentId = txCounter;
//   console.log(`\n${C.magenta}╔════ [TRANSACTION ACID BEGIN #${currentId}] (Isolation: ${C.bold}${isolation}${C.reset}${C.magenta}) ══════════════════════════${C.reset}`);
//   return currentId;
// }

// /**
//  * In thông báo hoàn tất COMMIT Giao dịch ACID
//  */
// export function logTransactionCommit(txId: number, durationMs: number): void {
//   const timeFormatted = `${C.green}${durationMs.toFixed(2)} ms${C.reset}`;
//   console.log(`${C.magenta}╚════ [TRANSACTION #${txId} COMMIT] ═══════════════════════ Total: (${timeFormatted}${C.magenta}) ══════${C.reset}\n`);
// }

// /**
//  * In thông báo ROLLBACK Giao dịch ACID khi gặp lỗi
//  */
// export function logTransactionRollback(txId: number, durationMs: number, errorMsg: string): void {
//   const timeFormatted = `${C.red}${durationMs.toFixed(2)} ms${C.reset}`;
//   console.log(`${C.red}╚════ [TRANSACTION #${txId} ROLLBACK (ABORTED)] ════════════ Total: (${timeFormatted}) ══════`);
//   console.log(`  ${C.red}REASON: ${errorMsg}${C.reset}\n`);
// }

// ============================================================================
// File: backend/src/utils/sqlLogger.ts  (v2 - chi tiết hơn)
// Vai trò: Trình ghi nhật ký truy vấn SQL cho môn học CSDL
//   - Nhận diện 8 loại query (a-h) + SELECT/UPSERT/DDL/TCL, đếm số predicate,
//     loại JOIN, loại subquery, hàm gộp
//   - Nhận diện ACID Transaction, Optimistic Lock (kể cả phát hiện XUNG ĐỘT),
//     Pessimistic Lock (FOR UPDATE / SHARE / NOWAIT / SKIP LOCKED)
//   - Đo thời gian (mức FAST / SLOW / VERY SLOW), số dòng, xem trước dữ liệu
//   - Cảnh báo: UPDATE/DELETE thiếu WHERE, SELECT *, LIKE '%x', FOR UPDATE
//     ngoài transaction, kết quả quá lớn...
//   - Giải thích lỗi MySQL (deadlock, duplicate, khóa ngoại...)
//   - Tổng kết phiên (printSqlSummary) + ghi file JSONL (tùy chọn)
//
// Biến môi trường (tất cả tùy chọn):
//   SQL_LOG=off              tắt toàn bộ log
//   SQL_LOG_COLOR=false      tắt màu (hoặc đặt NO_COLOR)
//   SQL_LOG_SLOW_MS=50       ngưỡng "chậm" (ms)
//   SQL_LOG_PREVIEW_ROWS=3   số dòng xem trước của SELECT (0 = tắt)
//   SQL_LOG_BOUND=true       in thêm câu SQL đã thay tham số (copy chạy thẳng)
//   SQL_LOG_FILE=./sql.jsonl ghi thêm mỗi query 1 dòng JSON
// ============================================================================

import { appendFile } from 'fs';

export interface QueryLogContext {
  txId?: number;
  txStep?: number;
}

// ----------------------------------------------------------------------------
// Cấu hình
// ----------------------------------------------------------------------------
const env = process.env;
const num = (v: string | undefined, d: number): number => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isFinite(n) ? n : d;
};

export const SQL_LOG_CONFIG = {
  enabled: env.SQL_LOG !== 'off',
  color: env.SQL_LOG_COLOR !== 'false' && env.NO_COLOR === undefined,
  slowMs: num(env.SQL_LOG_SLOW_MS, 50),
  previewRows: num(env.SQL_LOG_PREVIEW_ROWS, 3),
  maxParamLen: num(env.SQL_LOG_MAX_PARAM_LEN, 60),
  showBound: env.SQL_LOG_BOUND === 'true',
  file: env.SQL_LOG_FILE || '',
};

// ----------------------------------------------------------------------------
// Bảng mã màu ANSI (tự rỗng khi tắt màu)
// ----------------------------------------------------------------------------
const RAW = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};
const C = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, SQL_LOG_CONFIG.color ? v : '']),
) as typeof RAW;

// ----------------------------------------------------------------------------
// Phân tích câu SQL
// ----------------------------------------------------------------------------
interface Tag {
  text: string;
  color: string;
}

export interface QueryAnalysis {
  kind: string; // SELECT | INSERT | UPDATE | DELETE | REPLACE | DDL | TCL | OTHER
  tags: Tag[];
  warnings: string[];
  tables: string[];
  isWrite: boolean;
  isOptimistic: boolean;
  lockKinds: string[];
}

const DDL = new Set(['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME']);
const TCL = new Set(['START', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'RELEASE', 'SET']);
const NOT_TABLE = new Set(['SELECT', 'SET', 'WHERE', 'VALUES', 'DUAL', 'LATERAL']);

/** Bỏ comment, thay chuỗi literal bằng '' để regex không bị nhiễu */
function normalizeSql(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(s: string, re: RegExp): number {
  return (s.match(re) || []).length;
}

function extractTables(clean: string): string[] {
  const noLock = clean
    .replace(/\bON DUPLICATE KEY UPDATE\b/gi, ' ')
    .replace(/\bFOR UPDATE\b/gi, ' ');
  const re =
    /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+`?([A-Za-z_][\w$]*)`?(?:\s*\.\s*`?([A-Za-z_][\w$]*)`?)?/gi;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(noLock))) {
    const name = (m[2] || m[1]).toLowerCase();
    if (!NOT_TABLE.has(name.toUpperCase())) set.add(name);
  }
  return [...set];
}

export function analyzeQuery(sql: string, params?: any): QueryAnalysis {
  const clean = normalizeSql(sql);
  const tags: Tag[] = [];
  const warnings: string[] = [];
  const first = (clean.match(/^\(?\s*([A-Za-z]+)/)?.[1] || '').toUpperCase();
  const paramArr: any[] = Array.isArray(params) ? params : [];

  let kind = 'OTHER';
  if (first === 'WITH' || first === 'SELECT') kind = 'SELECT';
  else if (['INSERT', 'UPDATE', 'DELETE', 'REPLACE'].includes(first)) kind = first;
  else if (DDL.has(first)) kind = 'DDL';
  else if (TCL.has(first)) kind = 'TCL';

  const isWrite = ['INSERT', 'UPDATE', 'DELETE', 'REPLACE'].includes(kind);
  const tables = extractTables(clean);

  // [a] INSERT
  if (kind === 'INSERT' || kind === 'REPLACE') {
    const rowsN = /\bVALUES?\b/i.test(clean) ? countMatches(clean, /\)\s*,\s*\(/g) + 1 : 0;
    const insSel = /\bINSERT\b.*\bSELECT\b/i.test(clean);
    const extra = insSel ? ' … SELECT' : rowsN > 1 ? ` ×${rowsN} rows` : '';
    tags.push({ text: `a: ${kind}${extra}`, color: C.brightGreen });
    if (/\bON DUPLICATE KEY UPDATE\b/i.test(clean))
      tags.push({ text: 'UPSERT', color: C.brightGreen });
  }
  // [b] DELETE
  if (kind === 'DELETE') tags.push({ text: 'b: DELETE', color: C.brightRed });
  // [c] UPDATE
  if (kind === 'UPDATE') tags.push({ text: 'c: UPDATE', color: C.brightYellow });
  if (kind === 'SELECT') tags.push({ text: 'SELECT', color: C.white });
  if (kind === 'DDL') tags.push({ text: `DDL: ${first}`, color: C.brightRed });
  if (kind === 'TCL') tags.push({ text: `TCL: ${first}`, color: C.magenta });
  if (first === 'WITH') tags.push({ text: 'CTE', color: C.brightBlue });

  // Khóa lạc quan
  const bump = /\bversion\s*=\s*version\s*\+\s*1\b/i.test(clean);
  const check = /\bWHERE\b.*\bversion\s*=\s*\?/i.test(clean);
  const isOptimistic = bump && check;
  if (isOptimistic) {
    tags.push({
      text: 'OPTIMISTIC LOCK: version check+bump',
      color: C.brightCyan,
    });
  } else if (bump) {
    tags.push({ text: 'VERSION CHANGE TOKEN', color: C.brightCyan });
  }

  // Khóa bi quan
  const lockKinds: string[] = [];
  const lockM = clean.match(
    /\bFOR\s+(UPDATE|SHARE)\b(?:\s+(NOWAIT|SKIP LOCKED))?|\bLOCK IN SHARE MODE\b/i,
  );
  if (lockM) {
    const mode = lockM[1] ? `FOR ${lockM[1].toUpperCase()}` : 'LOCK IN SHARE MODE';
    const mod = lockM[2] ? ` ${lockM[2].toUpperCase()}` : '';
    lockKinds.push(`${mode}${mod}`);
    const exclusive = mode === 'FOR UPDATE';
    tags.push({
      text: `PESSIMISTIC LOCK: ${mode}${mod} (${exclusive ? 'X-lock' : 'S-lock'})`,
      color: C.brightMagenta,
    });
  }

  // [f] JOIN
  const joins = [
    ...clean.matchAll(/\b(?:(INNER|LEFT|RIGHT|CROSS|NATURAL)\s+(?:OUTER\s+)?)?JOIN\b/gi),
  ].map((m) => (m[1] || 'INNER').toUpperCase());
  if (joins.length) {
    const by: Record<string, number> = {};
    joins.forEach((j) => (by[j] = (by[j] || 0) + 1));
    const detail = Object.entries(by)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ');
    tags.push({
      text: `f: JOIN ${joins.length} (${detail}) → ${joins.length + 1} bảng`,
      color: C.cyan,
    });
    if (joins.includes('CROSS'))
      warnings.push('CROSS JOIN tạo tích Descartes — kiểm tra lại số dòng kết quả');
  }

  // [g] Subquery
  const subN = countMatches(clean, /\(\s*SELECT\b/gi);
  if (subN) {
    const kinds: string[] = [];
    if (/\bNOT\s+IN\s*\(\s*SELECT\b/i.test(clean)) kinds.push('NOT IN');
    else if (/\bIN\s*\(\s*SELECT\b/i.test(clean)) kinds.push('IN');
    if (/\bEXISTS\s*\(\s*SELECT\b/i.test(clean)) kinds.push('EXISTS');
    if (/\bFROM\s*\(\s*SELECT\b/i.test(clean)) kinds.push('derived table');
    if (/[=<>]\s*\(\s*SELECT\b/i.test(clean)) kinds.push('scalar');
    if (/\bSELECT\b[^()]*\(\s*SELECT\b/i.test(clean) && !kinds.length)
      kinds.push('trong SELECT list');
    tags.push({
      text: `g: SUBQUERY ×${subN}${kinds.length ? ` (${kinds.join(', ')})` : ''}`,
      color: C.magenta,
    });
  }

  // [h] Aggregate
  const funcs = [
    ...new Set(
      [...clean.matchAll(/\b(COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT)\s*\(/gi)].map((m) =>
        m[1].toUpperCase(),
      ),
    ),
  ];
  const hasGroup = /\bGROUP BY\b/i.test(clean);
  const hasHaving = /\bHAVING\b/i.test(clean);
  if (funcs.length || hasGroup || hasHaving) {
    const parts = [...funcs];
    if (hasGroup) parts.push('GROUP BY');
    if (hasHaving) parts.push('HAVING');
    tags.push({ text: `h: AGGREGATE ${parts.join(' + ')}`, color: C.blue });
  }

  // [d] / [e] Điều kiện
  const whereM = clean.match(
    /\bWHERE\b(.*?)(?=\b(?:GROUP BY|ORDER BY|HAVING|LIMIT|FOR UPDATE|FOR SHARE|LOCK IN SHARE MODE|UNION)\b|$)/i,
  );
  if (whereM) {
    const w = whereM[1];
    const predicates = Math.max(
      1,
      countMatches(w, /\b(?:AND|OR)\b/gi) - countMatches(w, /\bBETWEEN\b/gi) + 1,
    );
    const special = /\bIN\s*\(|\bBETWEEN\b|\bEXISTS\b|\bCASE\b|\bGREATEST\b|\bCOALESCE\b/i.test(w);
    if (predicates > 1 || special) {
      tags.push({
        text: `e: COMPLEX COND (${predicates} predicate${predicates > 1 ? 's' : ''})`,
        color: C.white,
      });
    } else {
      tags.push({ text: 'd: SINGLE COND', color: C.gray });
    }
  }

  // Thành phần phụ
  const extras: string[] = [];
  if (/\bSELECT\s+DISTINCT\b/i.test(clean)) extras.push('DISTINCT');
  if (/\bORDER BY\b/i.test(clean)) extras.push('ORDER BY');
  if (/\bLIMIT\b/i.test(clean)) extras.push('LIMIT');
  if (/\bUNION(\s+ALL)?\b/i.test(clean)) extras.push('UNION');
  if (extras.length) tags.push({ text: `+${extras.join(' +')}`, color: C.gray });

  // ---- Cảnh báo ----
  if ((kind === 'UPDATE' || kind === 'DELETE') && !/\bWHERE\b/i.test(clean)) {
    warnings.push(`${kind} KHÔNG có WHERE → tác động TOÀN BỘ bảng!`);
  }
  if (/\bSELECT\s+(DISTINCT\s+)?(?:\w+\.)?\*/i.test(clean)) {
    warnings.push('SELECT * — nên liệt kê cột cần dùng (giảm I/O, tránh phụ thuộc thứ tự cột)');
  }
  const likeLiteral = /\bLIKE\s+'%/i.test(sql);
  const likeParam =
    /\bLIKE\s*\?/i.test(clean) && paramArr.some((p) => typeof p === 'string' && p.startsWith('%'));
  if (likeLiteral || likeParam)
    warnings.push("LIKE bắt đầu bằng '%' → không dùng được index (full scan)");
  if (kind === 'SELECT' && /\bORDER BY\b/i.test(clean) && !/\bLIMIT\b/i.test(clean) && !hasGroup) {
    warnings.push('ORDER BY không có LIMIT — có thể phải sắp xếp cả bảng');
  }

  return { kind, tags, warnings, tables, isWrite, isOptimistic, lockKinds };
}

const renderTag = (t: Tag): string => `${t.color}[${t.text}]${C.reset}`;

/** Giữ API cũ: trả về danh sách tag đã tô màu */
export function classifyQuery(sql: string): string[] {
  return analyzeQuery(sql).tags.map(renderTag);
}

// ----------------------------------------------------------------------------
// Định dạng SQL (xuống dòng theo mệnh đề + tô màu từ khóa)
// ----------------------------------------------------------------------------
const KEYWORDS =
  'SELECT|DISTINCT|FROM|WHERE|(?:(?:INNER|LEFT|RIGHT|CROSS|NATURAL)\\s+(?:OUTER\\s+)?)?JOIN|ON|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|' +
  'UPDATE|SET|INSERT INTO|INSERT|REPLACE INTO|VALUES|DELETE FROM|DELETE|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS NULL|IS NOT NULL|AS|' +
  'UNION ALL|UNION|ON DUPLICATE KEY UPDATE|FOR UPDATE|FOR SHARE|NOWAIT|SKIP LOCKED|LOCK IN SHARE MODE|WITH|CASE|WHEN|THEN|ELSE|END';

function prettySql(sql: string): string[] {
  const lits: string[] = [];
  let s = sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^'\\]|\\.|'')*'/g, (m) => `\u0000${lits.push(m) - 1}\u0000`)
    .replace(/\s+/g, ' ')
    .trim();

  s = s.replace(/\bBETWEEN\s+(\S+)\s+AND\s+/gi, 'BETWEEN $1 \u0001 '); // bảo vệ AND của BETWEEN
  s = s
    .replace(/(?<!\bDELETE)\s+(FROM)\b/gi, '\n$1')
    .replace(
      /\s+(WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|SET|VALUES|UNION(?: ALL)?|ON DUPLICATE KEY UPDATE|FOR UPDATE|FOR SHARE|LOCK IN SHARE MODE)\b/gi,
      '\n$1',
    )
    .replace(/\s+((?:(?:INNER|LEFT|RIGHT|CROSS|NATURAL)\s+(?:OUTER\s+)?)?JOIN)\b/gi, '\n$1')
    .replace(/\s+ON\b(?!\s+DUPLICATE)/gi, '\n    ON')
    .replace(/\s+(AND|OR)\b/gi, '\n    $1');

  s = s.replace(/\?/g, `${C.brightYellow}?${C.reset}`);
  s = s.replace(
    new RegExp(`\\b(${KEYWORDS})\\b`, 'gi'),
    (m) => `${C.bold}${C.brightBlue}${m.toUpperCase()}${C.reset}`,
  );
  s = s.replace(/\u0001/g, `${C.bold}${C.brightBlue}AND${C.reset}`);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `${C.green}${lits[Number(i)]}${C.reset}`);
  return s.split('\n');
}

// ----------------------------------------------------------------------------
// Tham số
// ----------------------------------------------------------------------------
const cut = (s: string, n: number): string =>
  s.length > n ? `${s.slice(0, n)}…(+${s.length - n})` : s;

function paramToText(p: any): string {
  const max = SQL_LOG_CONFIG.maxParamLen;
  if (p === null || p === undefined) return 'NULL';
  if (typeof p === 'string') {
    if (/^\$2[aby]\$/.test(p)) return "'***bcrypt hash***'";
    return `'${cut(p, max)}'`;
  }
  if (p instanceof Date) return Number.isNaN(p.getTime()) ? 'Invalid Date' : `'${p.toISOString()}'`;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(p)) return `<Buffer ${p.length}B>`;
  if (typeof p === 'bigint') return `${p}n`;
  if (typeof p === 'object') {
    try {
      return cut(JSON.stringify(p), max);
    } catch {
      return '[object]';
    }
  }
  return String(p);
}

function formatParams(params: any): string {
  if (!Array.isArray(params) || params.length === 0) return `${C.dim}None${C.reset}`;
  return params
    .map((p, i) => `${C.dim}$${i + 1}=${C.reset}${C.yellow}${paramToText(p)}${C.reset}`)
    .join('  ');
}

/** Thay ? bằng giá trị thật để copy chạy trực tiếp trong MySQL client */
function interpolate(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/'(?:[^'\\]|\\.|'')*'|\?/g, (m) => {
    if (m !== '?') return m;
    if (i >= params.length) return '?';
    const p = params[i++];
    if (p === null || p === undefined) return 'NULL';
    if (typeof p === 'number' || typeof p === 'bigint' || typeof p === 'boolean') return String(p);
    if (p instanceof Date) return `'${p.toISOString().slice(0, 19).replace('T', ' ')}'`;
    if (typeof p === 'string' && /^\$2[aby]\$/.test(p)) return "'***'";
    const str = typeof p === 'object' ? JSON.stringify(p) : String(p);
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  });
}

// ----------------------------------------------------------------------------
// Kết quả
// ----------------------------------------------------------------------------
interface ResultInfo {
  rows?: any[];
  affected?: number;
  changed?: number;
  insertId?: number;
  info?: string;
}

function parseResult(result: any): ResultInfo {
  let r = result;
  // mysql2 trả [rows|header, fields]
  if (
    Array.isArray(r) &&
    r.length === 2 &&
    (Array.isArray(r[0]) || (r[0] && typeof r[0] === 'object' && 'affectedRows' in r[0])) &&
    (r[1] === undefined || Array.isArray(r[1]))
  ) {
    r = r[0];
  }
  if (Array.isArray(r)) return { rows: r };
  if (r && typeof r === 'object' && 'affectedRows' in r) {
    return {
      affected: r.affectedRows,
      changed: r.changedRows,
      insertId: r.insertId || undefined,
      info: r.info || undefined,
    };
  }
  return {};
}

const SENSITIVE_COL = /pass|token|secret|hash|otp|pin/i;

function previewRows(rows: any[]): string[] {
  const n = SQL_LOG_CONFIG.previewRows;
  if (n <= 0 || rows.length === 0 || typeof rows[0] !== 'object' || rows[0] === null) return [];
  const out: string[] = [`${C.dim}cột: ${Object.keys(rows[0]).join(', ')}${C.reset}`];
  rows.slice(0, n).forEach((row, i) => {
    const body = Object.entries(row)
      .map(([k, v]) => `${k}: ${SENSITIVE_COL.test(k) ? '***' : paramToText(v)}`)
      .join(', ');
    out.push(`${C.dim}#${i + 1}${C.reset} ${cut(`{ ${body} }`, 110)}`);
  });
  if (rows.length > n) out.push(`${C.dim}… còn ${rows.length - n} dòng${C.reset}`);
  return out;
}

// ----------------------------------------------------------------------------
// Thời gian
// ----------------------------------------------------------------------------
function timeBadge(ms: number): string {
  const t = `${ms.toFixed(2)} ms`;
  const slow = SQL_LOG_CONFIG.slowMs;
  if (ms < 5) return `${C.green}${t}${C.reset}`;
  if (ms < slow) return `${C.yellow}${t}${C.reset}`;
  if (ms < slow * 4) return `${C.brightYellow}${C.bold}${t} SLOW${C.reset}`;
  return `${C.brightRed}${C.bold}${t} VERY SLOW${C.reset}`;
}

// ----------------------------------------------------------------------------
// Thống kê toàn phiên
// ----------------------------------------------------------------------------
interface KindStat {
  count: number;
  ms: number;
  rows: number;
}

const stats = {
  total: 0,
  totalMs: 0,
  errors: 0,
  slow: 0,
  byKind: {} as Record<string, KindStat>,
  txCommitted: 0,
  txRolledBack: 0,
  deadlocks: 0,
  optimisticConflicts: 0,
  top: [] as { sql: string; ms: number }[],
};

export function resetSqlStats(): void {
  stats.total = stats.totalMs = stats.errors = stats.slow = 0;
  stats.byKind = {};
  stats.txCommitted = stats.txRolledBack = stats.deadlocks = stats.optimisticConflicts = 0;
  stats.top = [];
}

function recordStat(kind: string, ms: number, rows: number, sql: string): void {
  stats.total++;
  stats.totalMs += ms;
  if (ms >= SQL_LOG_CONFIG.slowMs) stats.slow++;
  const k = (stats.byKind[kind] ||= { count: 0, ms: 0, rows: 0 });
  k.count++;
  k.ms += ms;
  k.rows += rows;
  stats.top.push({ sql: normalizeSql(sql).slice(0, 90), ms });
  stats.top.sort((a, b) => b.ms - a.ms);
  if (stats.top.length > 5) stats.top.length = 5;
}

export function printSqlSummary(): void {
  const avg = stats.total ? stats.totalMs / stats.total : 0;
  console.log(
    `\n${C.brightCyan}╔════ [SQL SUMMARY] ════════════════════════════════════════${C.reset}`,
  );
  console.log(
    `  Tổng: ${C.bold}${stats.total}${C.reset} query │ ${stats.totalMs.toFixed(2)} ms │ TB ${avg.toFixed(2)} ms │ chậm: ${stats.slow} │ lỗi: ${stats.errors}`,
  );
  console.log(
    `  ${C.dim}${'LOẠI'.padEnd(8)} ${'SỐ LẦN'.padStart(7)} ${'TỔNG ms'.padStart(10)} ${'TB ms'.padStart(8)} ${'DÒNG'.padStart(7)}${C.reset}`,
  );
  for (const [kind, s] of Object.entries(stats.byKind)) {
    console.log(
      `  ${kind.padEnd(8)} ${String(s.count).padStart(7)} ${s.ms.toFixed(2).padStart(10)} ${(s.ms / s.count).toFixed(2).padStart(8)} ${String(s.rows).padStart(7)}`,
    );
  }
  console.log(
    `  TX: commit ${C.green}${stats.txCommitted}${C.reset} │ rollback ${C.red}${stats.txRolledBack}${C.reset} │ deadlock ${stats.deadlocks} │ xung đột optimistic ${stats.optimisticConflicts}`,
  );
  if (stats.top.length) {
    console.log(`  ${C.dim}Top chậm nhất:${C.reset}`);
    stats.top.forEach((t, i) =>
      console.log(`   ${i + 1}. ${t.ms.toFixed(2)} ms  ${C.dim}${t.sql}${C.reset}`),
    );
  }
  console.log(
    `${C.brightCyan}╚════════════════════════════════════════════════════════════${C.reset}\n`,
  );
}

// ----------------------------------------------------------------------------
// Giải thích lỗi MySQL
// ----------------------------------------------------------------------------
const ERR_HINTS: Record<string, string> = {
  ER_DUP_ENTRY: 'Vi phạm UNIQUE/PRIMARY KEY (trùng giá trị khóa)',
  ER_NO_REFERENCED_ROW_2: 'Vi phạm khóa ngoại: dòng cha không tồn tại (INSERT/UPDATE bảng con)',
  ER_ROW_IS_REFERENCED_2: 'Vi phạm khóa ngoại: còn dòng con tham chiếu (DELETE/UPDATE bảng cha)',
  ER_LOCK_DEADLOCK: 'DEADLOCK: DBMS chọn giao dịch này làm nạn nhân và ROLLBACK → nên retry',
  ER_LOCK_WAIT_TIMEOUT: 'Lock wait timeout: giao dịch khác giữ khóa quá lâu',
  ER_LOCK_NOWAIT: 'NOWAIT: dòng đang bị khóa bởi giao dịch khác',
  ER_BAD_NULL_ERROR: 'Vi phạm NOT NULL',
  ER_DATA_TOO_LONG: 'Dữ liệu vượt độ dài cột',
  ER_PARSE_ERROR: 'Lỗi cú pháp SQL',
  ER_BAD_FIELD_ERROR: 'Tên cột không tồn tại',
  ER_NO_SUCH_TABLE: 'Bảng không tồn tại',
  ER_CHECK_CONSTRAINT_VIOLATED: 'Vi phạm ràng buộc CHECK',
  ER_TRUNCATED_WRONG_VALUE: 'Giá trị sai kiểu dữ liệu',
  ER_WARN_DATA_OUT_OF_RANGE: 'Giá trị vượt miền cho phép của cột',
};

function describeError(err: any): { code: string; hint: string; msg: string } {
  const code = err?.code || (err?.errno ? `errno ${err.errno}` : 'UNKNOWN');
  return {
    code,
    hint: ERR_HINTS[err?.code] || '',
    msg: err?.sqlMessage || err?.message || String(err),
  };
}

// ----------------------------------------------------------------------------
// Trạng thái Transaction
// ----------------------------------------------------------------------------
interface TxState {
  start: number;
  isolation: string;
  steps: number;
  byKind: Record<string, number>;
  affected: number;
  locks: Set<string>;
}
const txStates = new Map<number, TxState>();
let txCounter = 0;
let queryCounter = 0;

function getTx(txId: number): TxState {
  let s = txStates.get(txId);
  if (!s) {
    s = {
      start: performance.now(),
      isolation: '?',
      steps: 0,
      byKind: {},
      affected: 0,
      locks: new Set(),
    };
    txStates.set(txId, s);
  }
  return s;
}

// ----------------------------------------------------------------------------
// In ra terminal
// ----------------------------------------------------------------------------
const LABEL_W = 7;

function printEntry(header: string, body: Array<[string, string | string[]]>, inTx: boolean): void {
  const bar = inTx ? `  ${C.magenta}║${C.reset}  ${C.dim}│${C.reset} ` : `${C.cyan}│${C.reset} `;
  if (inTx) console.log(`  ${C.magenta}║${C.reset} ${C.dim}├─${C.reset}${header}`);
  else console.log(`\n${C.cyan}┌───${C.reset} ${header}`);
  for (const [label, val] of body) {
    const lines = Array.isArray(val) ? val : [val];
    lines.forEach((l, i) =>
      console.log(
        `${bar}${C.dim}${(i === 0 ? label : '').padEnd(LABEL_W)}${C.reset}${i === 0 ? ': ' : '  '}${l}`,
      ),
    );
  }
  if (!inTx) console.log(`${C.cyan}└${'─'.repeat(62)}${C.reset}`);
}

function writeFileLog(entry: Record<string, unknown>): void {
  if (!SQL_LOG_CONFIG.file) return;
  appendFile(
    SQL_LOG_CONFIG.file,
    `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`,
    () => undefined,
  );
}

const isNoise = (sql: string): boolean => {
  const t = sql.trim();
  return t.includes('/* ping */') || /^SET TRANSACTION/i.test(t);
};

/**
 * In thông tin một câu lệnh SQL thành công
 */
export function logQueryExecution(
  sql: string,
  params: any,
  durationMs: number,
  result: any,
  context?: QueryLogContext,
): void {
  if (!SQL_LOG_CONFIG.enabled || isNoise(sql)) return;

  const a = analyzeQuery(sql, params);
  const r = parseResult(result);
  const warnings = [...a.warnings];
  const inTx = !!context?.txId;
  const qid = ++queryCounter;

  // ---- cập nhật transaction ----
  let step = context?.txStep || 0;
  if (inTx) {
    const tx = getTx(context!.txId!);
    tx.steps++;
    step = step || tx.steps;
    tx.byKind[a.kind] = (tx.byKind[a.kind] || 0) + 1;
    tx.affected += r.affected || 0;
    a.lockKinds.forEach((l) => tx.locks.add(l));
    if (a.isOptimistic) tx.locks.add('OPTIMISTIC(version)');
  } else if (a.lockKinds.length) {
    warnings.push(
      'Khóa hàng ngoài Transaction: autocommit sẽ nhả khóa ngay sau câu lệnh → không có tác dụng',
    );
  }

  // ---- xung đột optimistic ----
  if (a.isOptimistic && a.kind === 'UPDATE' && r.affected === 0) {
    stats.optimisticConflicts++;
    warnings.push(
      'XUNG ĐỘT OPTIMISTIC LOCK: 0 dòng cập nhật → version đã bị giao dịch khác thay đổi (cần retry/báo lỗi)',
    );
  } else if ((a.kind === 'UPDATE' || a.kind === 'DELETE') && r.affected === 0) {
    warnings.push('Không có dòng nào bị ảnh hưởng — kiểm tra điều kiện WHERE');
  }
  if (r.rows && r.rows.length >= 1000)
    warnings.push(`Trả về ${r.rows.length} dòng — nên thêm LIMIT/phân trang`);

  const rowCount = r.rows ? r.rows.length : r.affected || 0;
  recordStat(a.kind, durationMs, rowCount, sql);

  // ---- dựng nội dung ----
  const tagStr = a.tags.length ? a.tags.map(renderTag).join(' ') : `${C.dim}[QUERY]${C.reset}`;
  const header = inTx
    ? `[TX #${context!.txId} Step ${step}] ${tagStr} ── (${timeBadge(durationMs)})`
    : `${C.cyan}[DBMS QUERY #${qid}]${C.reset} ${tagStr} ── (${timeBadge(durationMs)})`;

  const body: Array<[string, string | string[]]> = [];
  if (a.tables.length) body.push(['TABLES', `${C.brightWhite}${a.tables.join(', ')}${C.reset}`]);
  body.push(['SQL', prettySql(sql)]);
  if (Array.isArray(params) && params.length) {
    body.push(['PARAMS', formatParams(params)]);
    if (SQL_LOG_CONFIG.showBound)
      body.push(['BOUND', `${C.gray}${normalizeBound(interpolate(sql, params))}${C.reset}`]);
  }

  if (r.rows) {
    body.push(['RESULT', `${C.cyan}${r.rows.length} rows returned${C.reset}`]);
    const pv = previewRows(r.rows);
    if (pv.length) body.push(['PREVIEW', pv]);
  } else if (r.affected !== undefined) {
    const parts = [`${C.green}${r.affected} affected${C.reset}`];
    if (r.changed !== undefined && a.kind === 'UPDATE') parts.push(`${r.changed} changed`);
    if (r.insertId) parts.push(`ID #${r.insertId}`);
    if (r.info) parts.push(r.info.trim());
    body.push(['RESULT', parts.join(' │ ')]);
  }
  if (warnings.length)
    body.push(['WARN', warnings.map((w) => `${C.brightYellow}⚠ ${w}${C.reset}`)]);

  printEntry(header, body, inTx);

  writeFileLog({
    qid,
    txId: context?.txId,
    step: inTx ? step : undefined,
    kind: a.kind,
    tags: a.tags.map((t) => t.text),
    tables: a.tables,
    sql: normalizeSql(sql),
    params: Array.isArray(params) ? params.map(paramToText) : [],
    durationMs: Number(durationMs.toFixed(3)),
    rows: r.rows?.length,
    affected: r.affected,
    insertId: r.insertId,
    warnings,
  });
}

function normalizeBound(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * In thông tin câu lệnh SQL THẤT BẠI (kèm giải thích lỗi)
 */
export function logQueryError(
  sql: string,
  params: any,
  durationMs: number,
  error: any,
  context?: QueryLogContext,
): void {
  if (!SQL_LOG_CONFIG.enabled || isNoise(sql)) return;
  const a = analyzeQuery(sql, params);
  const e = describeError(error);
  const inTx = !!context?.txId;
  stats.errors++;
  if (error?.code === 'ER_LOCK_DEADLOCK') stats.deadlocks++;
  if (inTx) {
    const tx = getTx(context!.txId!);
    tx.steps++;
  }

  const tagStr = a.tags.map(renderTag).join(' ');
  const header = inTx
    ? `${C.brightRed}[TX #${context!.txId} FAILED]${C.reset} ${tagStr} ── (${timeBadge(durationMs)})`
    : `${C.brightRed}[DBMS QUERY ERROR]${C.reset} ${tagStr} ── (${timeBadge(durationMs)})`;

  const body: Array<[string, string | string[]]> = [['SQL', prettySql(sql)]];
  if (Array.isArray(params) && params.length) body.push(['PARAMS', formatParams(params)]);
  body.push(['ERROR', `${C.brightRed}${e.code}${C.reset} ${e.msg}`]);
  if (error?.sqlState) body.push(['STATE', String(error.sqlState)]);
  if (e.hint) body.push(['HINT', `${C.brightYellow}${e.hint}${C.reset}`]);

  printEntry(header, body, inTx);

  writeFileLog({
    txId: context?.txId,
    kind: a.kind,
    sql: normalizeSql(sql),
    params: Array.isArray(params) ? params.map(paramToText) : [],
    durationMs: Number(durationMs.toFixed(3)),
    error: { code: e.code, message: e.msg, hint: e.hint },
  });
}

// ----------------------------------------------------------------------------
// Transaction ACID
// ----------------------------------------------------------------------------
export function logTransactionStart(isolation: string, label?: string): number {
  txCounter++;
  const id = txCounter;
  txStates.set(id, {
    start: performance.now(),
    isolation,
    steps: 0,
    byKind: {},
    affected: 0,
    locks: new Set(),
  });
  if (!SQL_LOG_CONFIG.enabled) return id;
  console.log(
    `\n${C.magenta}╔════ [TRANSACTION ACID BEGIN #${id}] (Isolation: ${C.bold}${isolation}${C.reset}${C.magenta})${label ? ` « ${label} »` : ''} ═════════${C.reset}`,
  );
  return id;
}

export function logSavepoint(
  txId: number,
  action: 'SET' | 'ROLLBACK TO' | 'RELEASE',
  name: string,
): void {
  if (!SQL_LOG_CONFIG.enabled) return;
  console.log(
    `  ${C.magenta}║${C.reset} ${C.dim}├─[TX #${txId}]${C.reset} ${C.magenta}[SAVEPOINT ${action} ${name}]${C.reset}`,
  );
}

function txSummaryLine(s: TxState): string {
  const kinds =
    Object.entries(s.byKind)
      .map(([k, v]) => `${k}×${v}`)
      .join(' ') || '—';
  const locks = s.locks.size ? ` │ locks: ${[...s.locks].join(', ')}` : '';
  return `${s.steps} query │ ${kinds} │ ${s.affected} dòng bị ghi${locks}`;
}

export function logTransactionCommit(txId: number, durationMs?: number): void {
  const s = getTx(txId);
  const ms = durationMs ?? performance.now() - s.start;
  stats.txCommitted++;
  txStates.delete(txId);
  if (!SQL_LOG_CONFIG.enabled) return;
  console.log(`  ${C.magenta}║${C.reset} ${C.dim}TÓM TẮT: ${txSummaryLine(s)}${C.reset}`);
  console.log(
    `${C.magenta}╚════ [TRANSACTION #${txId} COMMIT] ═══════════════════ Total: (${C.green}${ms.toFixed(2)} ms${C.magenta}) ══════${C.reset}\n`,
  );
}

export function logTransactionRollback(
  txId: number,
  durationMs: number | undefined,
  errorMsg: string,
  error?: any,
): void {
  const s = getTx(txId);
  const ms = durationMs ?? performance.now() - s.start;
  stats.txRolledBack++;
  if (error?.code === 'ER_LOCK_DEADLOCK') stats.deadlocks++;
  txStates.delete(txId);
  if (!SQL_LOG_CONFIG.enabled) return;
  const e = error ? describeError(error) : null;
  console.log(
    `  ${C.red}║${C.reset} ${C.dim}TÓM TẮT: ${txSummaryLine(s)} (các thay đổi bị hủy)${C.reset}`,
  );
  console.log(
    `${C.red}╚════ [TRANSACTION #${txId} ROLLBACK (ABORTED)] ═══════ Total: (${ms.toFixed(2)} ms) ══════`,
  );
  console.log(`  ${C.red}REASON: ${errorMsg}${C.reset}`);
  if (e?.code) console.log(`  ${C.red}CODE  : ${e.code}${C.reset}`);
  if (e?.hint) console.log(`  ${C.brightYellow}HINT  : ${e.hint}${C.reset}`);
  console.log('');
}
