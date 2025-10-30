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
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-2 p-3 bg-neutral-900/30 rounded-lg border border-neutral-800">
      <input
        className="h-9 px-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        placeholder="Actor"
        {...register('actor')}
      />
      <input
        className="h-9 px-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        placeholder="Action"
        {...register('action')}
      />
      <input
        className="h-9 px-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        placeholder="Search (q)"
        {...register('q')}
      />
      <input
        className="h-9 px-3 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        type="datetime-local"
        aria-label="Start date"
        {...register('from')}
      />
      <input
        className="h-9 px-3 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        type="datetime-local"
        aria-label="End date"
        {...register('to')}
      />
    </form>
  );
}
