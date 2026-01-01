/**
 * PATCH J: Header Unification
 *
 * Bu dosya artık common/PageHeader.tsx'den re-export yapıyor.
 * Tek kaynak: apps/web-next/src/components/common/PageHeader.tsx
 */

// Re-export from common (source of truth)
export { PageHeader as default, type PageHeaderProps } from '@/components/common/PageHeader';

