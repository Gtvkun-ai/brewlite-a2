import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('Auth Roles Matrix RBAC Test (Lecturer Audit 2026-11-15)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { id: string; role: Role }) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('Ma trận phân quyền giữa CUSTOMER vs BARISTA vs ADMIN (Yêu cầu B của Giảng viên)', () => {
    it('chặn 401 Unauthorized khi người dùng chưa đăng nhập gọi endpoint có bảo vệ quyền', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BARISTA, Role.ADMIN]);
      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    describe('Endpoint cập nhật trạng thái chế biến đơn hàng (PATCH /orders/:id/status - Staff Roles)', () => {
      const staffRoles = [Role.BARISTA, Role.ADMIN, Role.MANAGER];

      it('chặn 403 Forbidden khi khách hàng (CUSTOMER) cố tình can thiệp trạng thái đơn hàng', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(staffRoles);
        const context = createMockContext({ id: 'cust-1', role: Role.CUSTOMER });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('cho phép nhân viên pha chế (BARISTA) cập nhật trạng thái đơn hàng', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(staffRoles);
        const context = createMockContext({ id: 'barista-1', role: Role.BARISTA });

        expect(guard.canActivate(context)).toBe(true);
      });

      it('cho phép quản trị viên (ADMIN) cập nhật trạng thái đơn hàng', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(staffRoles);
        const context = createMockContext({ id: 'admin-1', role: Role.ADMIN });

        expect(guard.canActivate(context)).toBe(true);
      });
    });

    describe('Endpoint quản trị danh mục sản phẩm (POST /products, PUT /products - Admin Only)', () => {
      const adminRoles = [Role.ADMIN, Role.MANAGER];

      it('chặn 403 Forbidden khi khách hàng (CUSTOMER) cố tình tạo/sửa sản phẩm', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(adminRoles);
        const context = createMockContext({ id: 'cust-1', role: Role.CUSTOMER });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('chặn 403 Forbidden khi nhân viên pha chế (BARISTA) cố tình tạo/sửa sản phẩm', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(adminRoles);
        const context = createMockContext({ id: 'barista-1', role: Role.BARISTA });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('cho phép quản trị viên (ADMIN) toàn quyền quản trị sản phẩm', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(adminRoles);
        const context = createMockContext({ id: 'admin-1', role: Role.ADMIN });

        expect(guard.canActivate(context)).toBe(true);
      });
    });

    describe('Endpoint công khai / khách hàng chung (GET /products, POST /orders)', () => {
      it('cho phép mọi vai trò đã xác thực (CUSTOMER, BARISTA, ADMIN) truy cập khi không có role decorator', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        const customerContext = createMockContext({ id: 'cust-1', role: Role.CUSTOMER });
        const baristaContext = createMockContext({ id: 'barista-1', role: Role.BARISTA });
        const adminContext = createMockContext({ id: 'admin-1', role: Role.ADMIN });

        expect(guard.canActivate(customerContext)).toBe(true);
        expect(guard.canActivate(baristaContext)).toBe(true);
        expect(guard.canActivate(adminContext)).toBe(true);
      });
    });
  });
});
