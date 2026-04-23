/**
 * 어드민 서버 캐시 — 과한 복잡도 없이 2가지를 해결
 *
 *  (1) TTL 메모리 캐시
 *      같은 요청이 30초 내 반복될 때 Supabase 왕복을 제거.
 *  (2) in-flight dedup (request collapsing)
 *      /api/admin/users 와 /api/admin/users/summary 가 동시에 진입해도
 *      loadAdminBundle 은 promise 1개로 공유됨.
 *
 *  ── Upstash Redis 로 바꾸려면 `defaultBackend` 를 redisBackend 로 교체하기만 하면 됨.
 *     (현재 MVP 스케일에서는 인스턴스당 메모리로 충분)
 *
 *  ── Vercel serverless 특성상 인스턴스별로 캐시가 분리됨. TTL 을 30초로 짧게 두어
 *     인스턴스 간 불일치 창을 최소화.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface KVBackend {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** 프로세스 로컬 메모리 백엔드 (Vercel serverless 인스턴스 수명 내 유효) */
class MemoryBackend implements KVBackend {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return e as CacheEntry<T>;
  }
  async set<T>(key: string, value: CacheEntry<T>): Promise<void> {
    this.store.set(key, value as CacheEntry<unknown>);
  }
  async delete(key: string): Promise<void> { this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}

const defaultBackend: KVBackend = new MemoryBackend();

// ── in-flight dedup ────────────────────────────────────────
// 같은 key 로 동시에 들어온 fetcher 호출은 promise 를 공유.
const inflight = new Map<string, Promise<unknown>>();

export interface CachedOptions {
  /** 기본 TTL(초) */
  ttl?: number;
  /** true 면 캐시 무시하고 새로 로드 후 저장 */
  force?: boolean;
}

/**
 * TTL 캐시 + in-flight dedup.
 *
 * @example
 *   const bundle = await cached('admin:bundle', loadAdminBundle, { ttl: 30 });
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CachedOptions = {},
): Promise<T> {
  const ttl = opts.ttl ?? 30;

  if (!opts.force) {
    const hit = await defaultBackend.get<T>(key);
    if (hit) return hit.data;
  }

  // in-flight dedup
  const existing = inflight.get(key);
  if (existing && !opts.force) return existing as Promise<T>;

  const p = (async () => {
    try {
      const data = await fetcher();
      await defaultBackend.set<T>(key, {
        data,
        expiresAt: Date.now() + ttl * 1000,
      });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

export async function invalidate(key: string): Promise<void> {
  await defaultBackend.delete(key);
  inflight.delete(key);
}

export async function invalidateAll(): Promise<void> {
  await defaultBackend.clear();
  inflight.clear();
}

/** Request 에서 force=1 / nocache=1 파라미터로 캐시 무시 여부 판단 */
export function shouldForce(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get('force') === '1' || url.searchParams.get('nocache') === '1';
}
