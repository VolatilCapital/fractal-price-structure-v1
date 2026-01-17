import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('Core Package', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('should be a valid semver version', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
