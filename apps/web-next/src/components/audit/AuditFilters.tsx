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
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-2">
      <input
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Actor"
        {...register('actor')}
      />
      <input
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Action"
        {...register('action')}
      />
      <input
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search (q)"
        {...register('q')}
      />
      <input
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        type="datetime-local"
        {...register('from')}
      />
      <input
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        type="datetime-local"
        {...register('to')}
      />
    </form>
  );
}
