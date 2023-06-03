import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { Inject } from '@nestjs/common';
import * as uuid from 'uuid';
import { omit } from 'lodash';

interface Args {
  omitArgs?: boolean | Parameters<typeof omit>['1'];
  includeReturn?: boolean;
}

export const Stopwatch = ({
                            omitArgs,
                            includeReturn,
                          }: Args = {}): MethodDecorator => {
  const injectLogger = Inject(PinoLogger);

  return <T extends object>(target, propertyKey, descriptor) => {
    const contextName = `${target.constructor.name}.${String(propertyKey)}`;
    const token = getLoggerToken(contextName);

    injectLogger(target, token);

    const original = descriptor.value;

    descriptor.value = new Proxy(original, {
      apply: (target, thisArg, args) => {
        const traceId = uuid.v4();
        const traceTag = `[${traceId}] ${contextName}`;

        const logger: PinoLogger = thisArg[token];

        const logCall = (argsList) => {
          logger.info(
            `${traceTag}(${argsList.map(() => '%o').join(', ')})`,
            ...argsList.map((arg) => (arg !== undefined ? arg : 'undefined')),
          );
        };

        // TODO: reduce level to `debug`
        if (Array.isArray(omitArgs)) {
          logCall(Object.values(omit(args, omitArgs)));
        } else if (omitArgs) {
          logger.info(`${traceTag}()`);
        } else {
          logCall([...args]);
        }

        const start = Date.now();

        const handleResult = (res) => {
          logger.info(`${traceTag} took ${Date.now() - start}ms`);

          if (includeReturn && res !== undefined) {
            logger.info(`${traceTag} -> %o`, res);
          }
          return res;
        };

        const handleError = (err) => {
          logger.error(
            `${traceTag} failed after ${Date.now() - start}ms -> %s`,
            err.message,
          );
          throw err;
        };

        try {
          const result = target.apply(thisArg, args);

          if (result instanceof Promise) {
            return result.then(handleResult).catch(handleError);
          }

          handleResult(result);
          return result;
        } catch (err) {
          handleError(err);
          throw err;
        }
      },
    });

    // Copy all metadata from original descriptor.value to ensure the proper functioning of other decorators (like @Get, @Post, etc)
    Reflect.getMetadataKeys(original).forEach((key) => {
      const metadata = Reflect.getMetadata(key, original);
      Reflect.defineMetadata(key, metadata, descriptor.value);
    });

    return descriptor;
  };
};
