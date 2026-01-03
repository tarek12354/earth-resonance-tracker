import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Measurement } from '@/hooks/useMeasurements';

interface MeasurementsTableProps {
  measurements: Measurement[];
  onDelete: (id: number) => void;
}

export function MeasurementsTable({
  measurements,
  onDelete,
}: MeasurementsTableProps) {
  if (measurements.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground">
          Aucune mesure enregistrée
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>A</TableHead>
              <TableHead>B</TableHead>
              <TableHead>M</TableHead>
              <TableHead>N</TableHead>
              <TableHead>ρa (Ω·m)</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.map((m, idx) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{idx + 1}</TableCell>
                <TableCell>{m.a}</TableCell>
                <TableCell>{m.b}</TableCell>
                <TableCell>{m.m}</TableCell>
                <TableCell>{m.n}</TableCell>
                <TableCell className="font-semibold text-primary">
                  {m.ra.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(m.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
