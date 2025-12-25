import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService, AuditAction } from './audit.service';

export const Audit = (action: AuditAction, resource?: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('audit:action', action, descriptor.value);
    Reflect.defineMetadata('audit:resource', resource, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<AuditAction>(
      'audit:action',
      context.getHandler(),
    );

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const resource = this.reflector.get<string>(
      'audit:resource',
      context.getHandler(),
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        this.auditService.log({
          userId: request.user?.id,
          action,
          resource,
          resourceId: request.params?.id || response?.id,
          details: {
            method: request.method,
            path: request.path,
            duration: Date.now() - startTime,
            responseStatus: 'success',
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          success: true,
        });
      }),
      catchError((error) => {
        this.auditService.log({
          userId: request.user?.id,
          action,
          resource,
          resourceId: request.params?.id,
          details: {
            method: request.method,
            path: request.path,
            duration: Date.now() - startTime,
            responseStatus: 'error',
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          success: false,
          errorMessage: error.message,
        });
        throw error;
      }),
    );
  }
}
