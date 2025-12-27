'use client';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
type Form = { actor?: string; action?: string; q?: string; from?: string; to?: string };

export default function AuditFilters({ onChange }:{ onChange:(v:Form)=>void }) {
  const { register, handleSubmit, watch } = useForm<Form>({ mode:'onChange' });
  const submit = handleSubmit(v => onChange(v));
  // live update
  const sub = watch(()=>submit());
  useEffect(()=>()=>sub.unsubscribe(), [sub, submit]);

  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-1.5">
      <input
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: 'var(--control-h, 36px)' }}
        placeholder="Actor"
        {...register('actor')}
      />
      <input
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: 'var(--control-h, 36px)' }}
        placeholder="Action"
        {...register('action')}
      />
      <input
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: 'var(--control-h, 36px)' }}
        placeholder="Search (q)"
        {...register('q')}
      />
      <input
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: 'var(--control-h, 36px)' }}
        type="datetime-local"
        {...register('from')}
      />
      <input
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: 'var(--control-h, 36px)' }}
        type="datetime-local"
        {...register('to')}
      />
    </form>
  );
}
