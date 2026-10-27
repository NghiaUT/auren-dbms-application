import { Response } from 'express';

interface SuccessResponse<T> {
  data: T;
  message?: string;
}

export const sendSuccessRes = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
) => {
  const response: SuccessResponse<T> = {
    message,
    data,
  };

  return res.status(statusCode).json(response);
};
