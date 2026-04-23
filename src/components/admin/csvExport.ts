/**
 * 어드민 CSV export 유틸 — 엑셀 한글 깨짐 방지를 위해 UTF-8 BOM 포함.
 * 서버 라운드트립 없이 현재 클라 상태 그대로 다운로드.
 */

/** 안전하게 CSV 필드 인용 */
function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(esc).join(',');
  const body = rows.map(r => r.map(esc).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const BOM = '﻿';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 오늘 날짜를 YYYYMMDD-HHmm 로 — 파일명용 */
export function timestampSuffix(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
