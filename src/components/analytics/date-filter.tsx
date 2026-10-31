'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import styles from './date-filter.module.css';

type DateFilterProps = {
  onChange: (start?: string, end?: string) => void;
};

export function DateFilter({ onChange }: DateFilterProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  return (
    <form
      className={styles.form}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        onChange(start || undefined, end || undefined);
      }}
    >
      <Input type="date" value={start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)} label="Start" />
      <Input type="date" value={end} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)} label="End" />
      <Button type="submit" size="sm">Filter</Button>
    </form>
  );
}
