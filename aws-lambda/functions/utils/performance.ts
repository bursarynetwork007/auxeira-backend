/**
 * Performance Monitoring Utilities
 * Provides timing and performance measurement capabilities
 */

import { logger } from './logger';

export interface PerformanceTimer {
  start: number;
  end: () => number;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

/**
 * Create a performance timer for measuring operation duration
 */
export const createPerformanceTimer = (operation: string): PerformanceTimer => {
  const start = Date.now();
  
  return {
    start,
    end: () => {
      const duration = Date.now() - start;
      logger.info(`Performance: ${operation} completed in ${duration}ms`);
      return duration;
    }
  };
};

/**
 * Alias for createPerformanceTimer for backward compatibility
 */
export const performanceTimer = createPerformanceTimer;

/**
 * Advanced performance monitoring with metadata
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeTimers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operation: string, metadata?: any): void {
    this.activeTimers.set(operation, Date.now());
    logger.debug(`Performance timer started: ${operation}`, metadata);
  }

  /**
   * End timing an operation and record metrics
   */
  endTimer(operation: string, metadata?: any): number {
    const start = this.activeTimers.get(operation);
    if (!start) {
      logger.warn(`Performance timer not found: ${operation}`);
      return 0;
    }

    const duration = Date.now() - start;
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);
    this.activeTimers.delete(operation);

    logger.info(`Performance: ${operation} completed in ${duration}ms`, metadata);
    return duration;
  }

  /**
   * Get performance metrics for analysis
   */
  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): any {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    
    return operations.map(operation => {
      const operationMetrics = this.getMetrics(operation);
      const durations = operationMetrics.map(m => m.duration);
      
      return {
        operation,
        count: operationMetrics.length,
        averageDuration: this.getAverageDuration(operation),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        totalDuration: durations.reduce((sum, d) => sum + d, 0)
      };
    });
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Decorator for automatic performance monitoring
 */
export function measurePerformance(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const timer = createPerformanceTimer(operationName);
      try {
        const result = await method.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };
  };
}

/**
 * Async function wrapper for performance monitoring
 */
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const timer = createPerformanceTimer(operation);
  try {
    const result = await fn();
    const duration = timer.end();
    
    if (metadata) {
      logger.info(`Performance: ${operation} metadata`, { duration, ...metadata });
    }
    
    return result;
  } catch (error) {
    timer.end();
    logger.error(`Performance: ${operation} failed`, { error: (error as Error).message, metadata });
    throw error;
  }
}

export default {
  createPerformanceTimer,
  performanceTimer,
  PerformanceMonitor,
  globalPerformanceMonitor,
  measurePerformance,
  withPerformanceMonitoring
};
