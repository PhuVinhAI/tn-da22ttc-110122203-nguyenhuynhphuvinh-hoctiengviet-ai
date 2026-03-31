export class TestAssertions {
  /**
   * Assert response status
   */
  static assertStatus(actual: number, expected: number, message?: string): void {
    if (actual !== expected) {
      console.error(`❌ Status mismatch: Expected ${expected}, got ${actual}`);
      throw new Error(
        message || `Expected status ${expected}, got ${actual}`,
      );
    }
  }

  /**
   * Assert response has data
   */
  static assertHasData(response: any, message?: string): void {
    if (!response.data) {
      throw new Error(message || 'Response does not have data');
    }
  }

  /**
   * Assert object has property
   */
  static assertHasProperty(obj: any, property: string, message?: string): void {
    if (!(property in obj)) {
      throw new Error(
        message || `Object does not have property: ${property}`,
      );
    }
  }

  /**
   * Assert array length
   */
  static assertArrayLength(
    arr: any[],
    expectedLength: number,
    message?: string,
  ): void {
    if (arr.length !== expectedLength) {
      throw new Error(
        message ||
          `Expected array length ${expectedLength}, got ${arr.length}`,
      );
    }
  }

  /**
   * Assert array not empty
   */
  static assertArrayNotEmpty(arr: any[], message?: string): void {
    if (arr.length === 0) {
      throw new Error(message || 'Array is empty');
    }
  }

  /**
   * Assert equals
   */
  static assertEquals(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, got ${actual}`,
      );
    }
  }

  /**
   * Assert not equals
   */
  static assertNotEquals(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(
        message || `Expected value to not equal ${expected}, but it does`,
      );
    }
  }

  /**
   * Assert not null
   */
  static assertNotNull(value: any, message?: string): void {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value is null or undefined');
    }
  }

  /**
   * Assert is UUID
   */
  static assertIsUUID(value: string, message?: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(message || `Value is not a valid UUID: ${value}`);
    }
  }

  /**
   * Assert is email
   */
  static assertIsEmail(value: string, message?: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(message || `Value is not a valid email: ${value}`);
    }
  }

  /**
   * Assert date is recent (within last minute)
   */
  static assertDateIsRecent(dateString: string, message?: string): void {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = diffMs / 1000 / 60;

    if (diffMinutes > 1) {
      throw new Error(
        message || `Date is not recent: ${dateString} (${diffMinutes} minutes ago)`,
      );
    }
  }

  /**
   * Assert true
   */
  static assertTrue(value: boolean, message?: string): void {
    if (value !== true) {
      throw new Error(message || `Expected true, got ${value}`);
    }
  }

  /**
   * Assert false
   */
  static assertFalse(value: boolean, message?: string): void {
    if (value !== false) {
      throw new Error(message || `Expected false, got ${value}`);
    }
  }
}
