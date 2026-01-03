import { Play, SkipForward, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeasurementControlsProps {
  isConnected: boolean;
  hasPendingReading: boolean;
  currentIndex: number;
  totalMeasurements: number;
  onStart: () => void;
  onNext: () => void;
  onRepeat: () => void;
  onStop: () => void;
}

export function MeasurementControls({
  isConnected,
  hasPendingReading,
  currentIndex,
  totalMeasurements,
  onStart,
  onNext,
  onRepeat,
  onStop,
}: MeasurementControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Contrôles de mesure
        </p>
        <p className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
          {currentIndex} / {totalMeasurements}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          onClick={onStart}
          disabled={!isConnected}
          className="h-14 text-base font-semibold"
          variant="default"
        >
          <Play className="mr-2 h-5 w-5" />
          START
        </Button>

        <Button
          onClick={onNext}
          disabled={!hasPendingReading}
          className="h-14 text-base font-semibold"
          variant="secondary"
        >
          <SkipForward className="mr-2 h-5 w-5" />
          NEXT
        </Button>

        <Button
          onClick={onRepeat}
          disabled={!isConnected}
          className="h-14 text-base font-semibold"
          variant="outline"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          REPEAT
        </Button>

        <Button
          onClick={onStop}
          disabled={!isConnected}
          className="h-14 text-base font-semibold"
          variant="destructive"
        >
          <Square className="mr-2 h-5 w-5" />
          STOP
        </Button>
      </div>
    </div>
  );
}
