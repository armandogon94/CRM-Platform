import { Response } from 'express';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response';

function createMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('successResponse', () => {
  it('should return correct format with data and message', () => {
    const res = createMockRes();

    successResponse(res, { id: 1, name: 'Test' }, 'Fetched successfully');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, name: 'Test' },
      message: 'Fetched successfully',
    });
  });

  it('should use custom status code', () => {
    const res = createMockRes();

    successResponse(res, { id: 1 }, 'Created', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
      message: 'Created',
    });
  });

  it('should work without data or message', () => {
    const res = createMockRes();

    successResponse(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: undefined,
      message: undefined,
    });
  });
});

describe('errorResponse', () => {
  it('should return correct format with error message', () => {
    const res = createMockRes();

    errorResponse(res, 'Something went wrong', 400);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Something went wrong',
    });
  });

  it('should default to 500 status code', () => {
    const res = createMockRes();

    errorResponse(res, 'Internal error');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal error',
    });
  });
});

describe('paginatedResponse', () => {
  it('should include pagination metadata', () => {
    const res = createMockRes();
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

    paginatedResponse(
      res,
      data,
      { page: 1, limit: 10, total: 25 },
      'Items fetched'
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Items fetched',
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('should calculate totalPages correctly', () => {
    const res = createMockRes();
    const data = [{ id: 1 }];

    paginatedResponse(res, data, { page: 2, limit: 5, total: 12 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: {
          page: 2,
          limit: 5,
          total: 12,
          totalPages: 3, // ceil(12/5) = 3
        },
      })
    );
  });

  it('should handle custom status code', () => {
    const res = createMockRes();

    paginatedResponse(res, [], { page: 1, limit: 10, total: 0 }, undefined, 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      })
    );
  });
});
