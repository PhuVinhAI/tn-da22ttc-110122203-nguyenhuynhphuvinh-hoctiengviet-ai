import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Chấp nhận:
 *  - URL tuyệt đối: http://, https:// (data cũ hoặc external CDN)
 *  - Đường dẫn tương đối tới static uploads: /uploads/...
 *
 * Không cho phép URL khác (javascript:, file:, vv) vì lý do bảo mật.
 */
export function IsMediaUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMediaUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined || value === '')
            return true;
          if (typeof value !== 'string') return false;
          if (/^https?:\/\/[^\s]+$/i.test(value)) return true;
          if (/^\/uploads\/[^\s]+$/.test(value)) return true;
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} phải là URL (http/https) hoặc đường dẫn /uploads/...`;
        },
      },
    });
  };
}
