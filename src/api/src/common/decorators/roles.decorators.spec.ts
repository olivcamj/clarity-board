import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorators';
import { UserRole } from '../../../generated/client';

describe('Roles decorator', () => {
  it('should set the correct metadata key and single role', () => {
    class TestClass {
      @Roles(UserRole.ADMIN)
      adminMethod() {}
    }

    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>(ROLES_KEY, TestClass.prototype.adminMethod);
    expect(roles).toEqual([UserRole.ADMIN]);
  });

  it('should set multiple roles', () => {
    class TestClass {
      @Roles(UserRole.ADMIN, UserRole.EDITOR)
      editorMethod() {}
    }

    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>(ROLES_KEY, TestClass.prototype.editorMethod);
    expect(roles).toEqual([UserRole.ADMIN, UserRole.EDITOR]);
  });

  it('should set empty roles array when called with no arguments', () => {
    class TestClass {
      @Roles()
      openMethod() {}
    }

    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>(ROLES_KEY, TestClass.prototype.openMethod);
    expect(roles).toEqual([]);
  });
});
