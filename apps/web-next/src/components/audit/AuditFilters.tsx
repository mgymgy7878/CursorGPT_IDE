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
      <input className="input input-bordered" placeholder="Actor" {...register('actor')} />
      <input className="input input-bordered" placeholder="Action" {...register('action')} />
      <input className="input input-bordered" placeholder="Search (q)" {...register('q')} />
      <input className="input input-bordered" type="datetime-local" {...register('from')} />
      <input className="input input-bordered" type="datetime-local" {...register('to')} />
    </form>
  );
}
