/// <reference types="vite/client" />

// Path alias fallback declarations (some tooling passes may not pick up tsconfig paths immediately)
declare module '@/utils/file' {
	export function humanFileSize(bytes?: number | null, opts?: { decimals?: number }): string
	export function triggerBrowserDownload(source: Blob | string | { href: string }, filename?: string): void
}
