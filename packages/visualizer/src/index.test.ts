import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('Visualizer Package', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('1.0.0');
  });
});
