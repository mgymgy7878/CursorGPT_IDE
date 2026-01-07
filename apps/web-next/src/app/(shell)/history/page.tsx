import { redirect } from 'next/navigation';

/**
 * History page - Redirect to /audit
 *
 * PATCH T: /history route fix (404 → redirect to /audit)
 */
export default function HistoryPage() {
  redirect('/audit');
}

