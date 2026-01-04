import { Activity, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveReadingProps {
  liveReading: {
    a: number;
    b: number;
    m: number;
    n: number;
    ra: number;
  } | null;
  isAutoRequesting: boolean;
}

export function LiveReading({ liveReading, isAutoRequesting }: LiveReadingProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-6 transition-all',
        liveReading
          ? 'border-primary bg-primary/5'
          : isAutoRequesting
            ? 'border-yellow-500 bg-yellow-500/5'
            : 'border-border bg-muted/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            liveReading 
              ? 'bg-primary text-primary-foreground' 
              : isAutoRequesting
                ? 'bg-yellow-500 text-white'
                : 'bg-muted'
          )}
        >
          {isAutoRequesting ? (
            <Radio className="h-5 w-5 animate-pulse" />
          ) : (
            <Activity className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Lecture en direct
            </p>
            {isAutoRequesting && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Auto (1.5s)
              </span>
            )}
          </div>
          
          {liveReading ? (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-lg font-semibold">
              <span>A={liveReading.a}</span>
              <span>B={liveReading.b}</span>
              <span>M={liveReading.m}</span>
              <span>N={liveReading.n}</span>
              <span className="text-primary">
                ρa={liveReading.ra.toFixed(2)} Ω·m
              </span>
            </div>
          ) : isAutoRequesting ? (
            <p className="mt-1 text-lg text-yellow-600 dark:text-yellow-400">
              Interrogation ESP32...
            </p>
          ) : (
            <p className="mt-1 text-lg text-muted-foreground">
              Cliquez START pour commencer
            </p>
          )}
        </div>
      </div>

      {(liveReading || isAutoRequesting) && (
        <div className="absolute bottom-0 left-0 h-1 w-full">
          <div className={cn(
            "h-full animate-pulse",
            liveReading ? "bg-primary" : "bg-yellow-500"
          )} />
        </div>
      )}
    </div>
  );
}
