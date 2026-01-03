import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ArrayType } from '@/hooks/useMeasurements';

interface SurveyConfigProps {
  arrayType: ArrayType;
  electrodeSpacing: number;
  projectName: string;
  operator: string;
  onArrayTypeChange: (value: ArrayType) => void;
  onSpacingChange: (value: number) => void;
  onProjectNameChange: (value: string) => void;
  onOperatorChange: (value: string) => void;
}

export function SurveyConfig({
  arrayType,
  electrodeSpacing,
  projectName,
  operator,
  onArrayTypeChange,
  onSpacingChange,
  onProjectNameChange,
  onOperatorChange,
}: SurveyConfigProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="arrayType">Type de dispositif</Label>
        <Select value={arrayType} onValueChange={onArrayTypeChange}>
          <SelectTrigger id="arrayType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Dipole-Dipole">Dipôle-Dipôle</SelectItem>
            <SelectItem value="Wenner">Wenner</SelectItem>
            <SelectItem value="Schlumberger">Schlumberger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spacing">Espacement (a) en mètres</Label>
        <Input
          id="spacing"
          type="number"
          step="0.1"
          min="0.1"
          value={electrodeSpacing}
          onChange={(e) => onSpacingChange(parseFloat(e.target.value) || 1)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectName">Nom du projet</Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="ERT Survey"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="operator">Opérateur</Label>
        <Input
          id="operator"
          value={operator}
          onChange={(e) => onOperatorChange(e.target.value)}
          placeholder="Nom de l'opérateur"
        />
      </div>
    </div>
  );
}
