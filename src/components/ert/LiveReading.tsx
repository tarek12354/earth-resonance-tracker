import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveReadingProps {
  reading: string;
  pendingReading: {
    a: number;
    b: number;
    m: number;
    n: number;
    ra: number;
  } | null;
}

export function LiveReading({ reading, pendingReading }: LiveReadingProps) {
  const hasReading = reading || pendingReading;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-6 transition-all',
        hasReading
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            hasReading ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          <Activity className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            Lecture en direct
          </p>
          {pendingReading ? (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-lg font-semibold">
              <span>A={pendingReading.a}</span>
              <span>B={pendingReading.b}</span>
              <span>M={pendingReading.m}</span>
              <span>N={pendingReading.n}</span>
              <span className="text-primary">
                ρa={pendingReading.ra.toFixed(2)} Ω·m
              </span>
            </div>
          ) : reading ? (
            <p className="mt-1 text-lg font-semibold">{reading}</p>
          ) : (
            <p className="mt-1 text-lg text-muted-foreground">
              En attente de données...
            </p>
          )}
        </div>
      </div>

      {hasReading && (
        <div className="absolute bottom-0 left-0 h-1 w-full">
          <div className="h-full animate-pulse bg-primary" />
        </div>
      )}
    </div>
  );
}
