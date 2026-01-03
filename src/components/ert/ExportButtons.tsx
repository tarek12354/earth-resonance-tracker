import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExportButtonsProps {
  hasMeasurements: boolean;
  onExportDAT: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
}

export function ExportButtons({
  hasMeasurements,
  onExportDAT,
  onExportCSV,
  onClearAll,
}: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onExportDAT}
        disabled={!hasMeasurements}
        variant="default"
        className="flex-1 sm:flex-none"
      >
        <Download className="mr-2 h-4 w-4" />
        Export .DAT
      </Button>

      <Button
        onClick={onExportCSV}
        disabled={!hasMeasurements}
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        <FileText className="mr-2 h-4 w-4" />
        Export CSV
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={!hasMeasurements}
            variant="destructive"
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Effacer tout
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer toutes les mesures ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les mesures enregistrées
              seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onClearAll}>
              Effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
