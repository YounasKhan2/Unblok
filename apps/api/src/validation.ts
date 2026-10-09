import { BadRequestException, Injectable, InternalServerErrorException, type CallHandler, type ExecutionContext, type NestInterceptor, type PipeTransform } from '@nestjs/common';
import { map } from 'rxjs';
import type { z } from 'zod';

@Injectable()
export class SchemaPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}
  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) throw new BadRequestException();
    return parsed.data;
  }
}
export class ResponseSchemaInterceptor<T> implements NestInterceptor {
  constructor(private readonly schema: z.ZodType<T>) {}
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value: unknown) => {
      const parsed = this.schema.safeParse(value);
      if (!parsed.success) throw new InternalServerErrorException();
      return parsed.data;
    }));
  }
}
