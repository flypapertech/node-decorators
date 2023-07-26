import { extractParamNames } from '../utils';
import { METHOD_METADATA, PARAM_TYPE_METADATA, PARAMS_METADATA, RETURN_TYPE_METADATA } from './constants';
import { Context } from './context';

export function paramDecoratorFactory(metadata: object) {
  return function (target: InstanceType<any>, methodName: string, index: number) {
    const params = Reflect.getMetadata(PARAMS_METADATA, target.constructor) ?? [];
    const validator = Reflect.getMetadata(PARAM_TYPE_METADATA, target, methodName)[index];
    const argName = extractParamNames(target[methodName])[index];

    params.push({ argName, index, methodName, validator, ...metadata });

    Reflect.defineMetadata(PARAMS_METADATA, params, target.constructor);
  };
}

export function methodDecoratorFactory(metadata: object) {
  return (target: object, methodName: string, descriptor: TypedPropertyDescriptor<any>) => {
    const methods = Reflect.getMetadata(METHOD_METADATA, target.constructor) ?? [];
    const returnType = Reflect.getMetadata(RETURN_TYPE_METADATA, target, methodName);

    methods.push({ methodName, returnType: returnType === Promise ? null : returnType, ...metadata });

    Reflect.defineMetadata(METHOD_METADATA, methods, target.constructor);

    return descriptor;
  };
}

/**
 * Creates a custom parameter decorator
 *
 * Example:
 *
 * ...
 * export function AccessParam() {
 *   return createParamDecorator((context: HttpContext) => {
 *     const req = context.getRequest<Request>();
 *
 *     return req.query.access;
 *  });
 * }
 *
 * ...
 * authorize(@AccessParam() access: string)
 * ...
 */
export function createParamDecorator(factory: (context: Context) => unknown) {
  return paramDecoratorFactory({ factory });
}

/**
 * Creates a custom method or class decorator
 *
 * Example:
 *
 * ...
 * export function Access(access: string) {
 *   return Decorate('access', access);
 * }
 * ...
 *
 * @Access('granted')
 * create()
 * ...
 *
 * Also can be used without a wrapper:
 *
 * ...
 * @Decorate('access', granted)
 * create()
 * ...
 */
export function Decorate(key: string, value: unknown) {
  return (target: object, propertyKey?: any, descriptor?: any) => {
    const metaTarget = descriptor?.value ?? target;

    Reflect.defineMetadata(key, value, metaTarget, descriptor ? undefined : propertyKey);

    return descriptor ?? target;
  };
}
