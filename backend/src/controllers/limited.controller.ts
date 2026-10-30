// ============================================================================
// File: backend/src/controllers/limited.controller.ts
// Vai trò: Xử lý yêu cầu truy vấn thông tin ấn bản giới hạn Limited Edition
//          (FR6 - Danh sách số serial, số lượng còn lại, bản số tiếp theo khả dụng)
// ============================================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import * as editionRepo from '../repository/edition.repository.js';
import { NotFoundError } from '../utils/AppError.js';

/**
 * [FR6] GET /api/limited/:variantId/units
 * Trả về thông tin biến thể và danh sách ma trận số serial khả dụng
 */
export const getVariantEditionUnits = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const variantId = parseInt(String(req.params.variantId), 10);
  if (isNaN(variantId)) {
    throw new NotFoundError('Mã biến thể tác phẩm không hợp lệ');
  }

  const result = await editionRepo.getEditionSummaryByVariantId(variantId);
  if (!result) {
    throw new NotFoundError('Không tìm thấy bản phát hành giới hạn của tác phẩm này');
  }

  sendSuccessRes(res, result, 'Lấy thông tin ấn bản giới hạn thành công', 200);
});
