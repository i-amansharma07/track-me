export type HttpResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

export const createSuccessResponse = <T>(data: T): HttpResponse<T> => ({
  success: true,
  data,
});

export const createErrorResponse = (message: string, code?: string): HttpResponse<never> => ({
  success: false,
  error: { message, code },
});
