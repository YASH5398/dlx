// User data cache to reduce Firestore reads
interface CachedUser {
  name: string;
  email: string;
  cachedAt: number;
}

class UserCache {
  private cache = new Map<string, CachedUser>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get user from cache if valid, otherwise null
  get(userId: string): { name: string; email: string } | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.cachedAt > this.CACHE_TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return {
      name: cached.name,
      email: cached.email
    };
  }

  // Set user in cache
  set(userId: string, name: string, email: string): void {
    this.cache.set(userId, {
      name,
      email,
      cachedAt: Date.now()
    });
  }

  // Batch set users
  setBatch(users: Array<{ userId: string; name: string; email: string }>): void {
    users.forEach(({ userId, name, email }) => {
      this.set(userId, name, email);
    });
  }

  // Clear cache (useful for testing or memory management)
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanExpired(): void {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.cachedAt > this.CACHE_TTL) {
        this.cache.delete(userId);
      }
    }
  }
}

// Singleton instance
export const userCache = new UserCache();

// Clean expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    userCache.cleanExpired();
  }, 10 * 60 * 1000);
}

