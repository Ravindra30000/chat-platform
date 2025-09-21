import NodeCache from "node-cache";
import { config } from "../config/env";
import { CacheEntry, CacheStats } from "../types";

export class CacheService {
  private static instance: CacheService;
  private memoryCache: NodeCache;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  private constructor() {
    // Initialize memory cache as fallback
    this.memoryCache = new NodeCache({
      stdTTL: config.cacheTtlSeconds || 3600,
      maxKeys: config.memoryCacheMaxItems || 1000,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
    });

    // Setup memory cache event listeners
    this.memoryCache.on("set", (key: string) => {
      this.stats.sets++;
      this.stats.size = this.memoryCache.keys().length;
    });

    this.memoryCache.on("del", (key: string) => {
      this.stats.deletes++;
      this.stats.size = this.memoryCache.keys().length;
    });

    this.memoryCache.on("expired", (key: string) => {
      this.stats.size = this.memoryCache.keys().length;
    });
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get value from cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const result = this.memoryCache.get<T>(key) || null;
      if (result) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }

      this.updateHitRate();
      return result;
    } catch (error) {
      console.error("Cache get error:", error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  // Set value in cache
  async set<T = any>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      const ttl = ttlSeconds || config.cacheTtlSeconds || 3600;
      this.memoryCache.set(key, value, ttl);
      this.stats.sets++;
      this.stats.size = this.memoryCache.keys().length;

      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  // Delete from cache
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.memoryCache.del(key);
      this.stats.deletes++;
      this.stats.size = this.memoryCache.keys().length;

      return deleted > 0;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // Clear all cache
  async clear(): Promise<boolean> {
    try {
      this.memoryCache.flushAll();
      this.stats.size = 0;
      return true;
    } catch (error) {
      console.error("Cache clear error:", error);
      return false;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      return this.memoryCache.has(key);
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: this.memoryCache.keys().length,
      hitRate: 0,
    };
  }

  // Check connection status
  async isConnected(): Promise<{ redis: boolean; memory: boolean }> {
    return {
      redis: false, // Not using Redis in this simplified version
      memory: true, // Memory cache is always available
    };
  }

  // Create cache key with prefix
  createKey(prefix: string, ...parts: string[]): string {
    return `techsurf:${prefix}:${parts.join(":")}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Graceful shutdown
  async close(): Promise<void> {
    try {
      this.memoryCache.close();
    } catch (error) {
      console.error("Error closing cache connections:", error);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
