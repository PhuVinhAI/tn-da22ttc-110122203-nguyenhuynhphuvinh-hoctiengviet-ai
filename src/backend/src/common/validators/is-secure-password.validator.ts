import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { describePasswordFailure, isPasswordStrong } from './password-policy';

@ValidatorConstraint({ name: 'isSecurePassword', async: false })
export class IsSecurePasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isPasswordStrong(value);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = typeof args?.value === 'string' ? args.value : '';
    return describePasswordFailure(value);
  }
}

/**
 * Enforces the account password policy (see `password-policy.ts`):
 * ≥12 chars, with uppercase, lowercase, a number and a special character,
 * no whitespace, and not a common/guessable password.
 */
export function IsSecurePassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSecurePassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsSecurePasswordConstraint,
    });
  };
}
