/**
 * 공유 링크 서비스 (클라이언트 사이드)
 * - 보관함 레코드에 share_token을 생성/조회하여 공유 URL 반환
 */

export type ShareRecordType = 'saju' | 'tarot';

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  token?: string;
  error?: string;
}

const BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export function getShareUrl(token: string): string {
  return `${BASE_URL}/share/${token}`;
}

export async function createShareLink(
  recordId: string,
  type: ShareRecordType = 'saju',
): Promise<ShareResult> {
  try {
    const res = await fetch('/api/share/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, type }),
    });

    const json = await res.json();

    if (!res.ok || !json?.success) {
      return {
        success: false,
        error: json?.error || '공유 링크 생성에 실패했습니다.',
      };
    }

    return {
      success: true,
      shareUrl: json.shareUrl,
      token: json.token,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || '공유 링크 생성 중 오류가 발생했습니다.',
    };
  }
}

export async function triggerShare(
  url: string,
  title: string,
  text: string,
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
