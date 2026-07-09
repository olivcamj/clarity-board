import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

function getDecoratorFactory(decorator: () => ParameterDecorator) {
  class TestClass {
    test(@decorator() _value: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser decorator', () => {
  it('should return request.auth from the execution context', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const mockAuth = {
      clerkId: 'clerk-1',
      userId: 'user-1',
      sessionId: 'session-1',
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ auth: mockAuth }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockContext);

    expect(result).toEqual(mockAuth);
  });

  it('should return undefined when request.auth is not set', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ auth: undefined }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockContext);

    expect(result).toBeUndefined();
  });
});
