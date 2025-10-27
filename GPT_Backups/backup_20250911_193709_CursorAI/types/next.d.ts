// types/next.d.ts
declare global {
  interface RequestInit {
    /** Next.js fetch uzantısı */
    next?: {
      revalidate?: number | false;
      tags?: string[];
    };
  }
}
export {};
