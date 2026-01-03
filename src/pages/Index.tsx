import { useCallback } from 'react';
import { Zap, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useMeasurements } from '@/hooks/useMeasurements';
import { ConnectionStatus } from '@/components/ert/ConnectionStatus';
import { SurveyConfig } from '@/components/ert/SurveyConfig';
import { LiveReading } from '@/components/ert/LiveReading';
import { MeasurementControls } from '@/components/ert/MeasurementControls';
import { MeasurementsTable } from '@/components/ert/MeasurementsTable';
import { ExportButtons } from '@/components/ert/ExportButtons';
import { useTheme } from '@/hooks/useTheme';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  
  const {
    measurements,
    currentIndex,
    pendingReading,
    config,
    handleIncomingData,
    acceptMeasurement,
    deleteMeasurement,
    clearAllMeasurements,
    updateConfig,
    exportDAT,
    exportCSV,
  } = useMeasurements();

  const {
    isConnected,
    isConnecting,
    deviceName,
    error,
    isSupported,
    connect,
    disconnect,
    sendCommand,
    liveReading,
  } = useBluetooth(handleIncomingData);

  const handleStart = useCallback(() => {
    clearAllMeasurements();
    sendCommand('START');
  }, [clearAllMeasurements, sendCommand]);

  const handleNext = useCallback(() => {
    acceptMeasurement();
  }, [acceptMeasurement]);

  const handleRepeat = useCallback(() => {
    sendCommand('REPEAT');
  }, [sendCommand]);

  const handleStop = useCallback(() => {
    sendCommand('STOP');
  }, [sendCommand]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ERT-THA</h1>
              <p className="text-xs text-muted-foreground">par Tarek Attia</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container space-y-6 px-4 py-6">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Connexion ESP32</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              deviceName={deviceName}
              error={error}
              isSupported={isSupported}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </CardContent>
        </Card>

        {/* Survey Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <SurveyConfig
              arrayType={config.arrayType}
              electrodeSpacing={config.electrodeSpacing}
              projectName={config.projectName}
              operator={config.operator}
              onArrayTypeChange={(v) => updateConfig({ arrayType: v })}
              onSpacingChange={(v) => updateConfig({ electrodeSpacing: v })}
              onProjectNameChange={(v) => updateConfig({ projectName: v })}
              onOperatorChange={(v) => updateConfig({ operator: v })}
            />
          </CardContent>
        </Card>

        {/* Live Reading */}
        <LiveReading reading={liveReading} pendingReading={pendingReading} />

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <MeasurementControls
              isConnected={isConnected}
              hasPendingReading={!!pendingReading}
              currentIndex={currentIndex}
              totalMeasurements={measurements.length}
              onStart={handleStart}
              onNext={handleNext}
              onRepeat={handleRepeat}
              onStop={handleStop}
            />
          </CardContent>
        </Card>

        {/* Measurements Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mesures enregistrées</CardTitle>
          </CardHeader>
          <CardContent>
            <MeasurementsTable
              measurements={measurements}
              onDelete={deleteMeasurement}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Export */}
        <ExportButtons
          hasMeasurements={measurements.length > 0}
          onExportDAT={exportDAT}
          onExportCSV={exportCSV}
          onClearAll={clearAllMeasurements}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <p className="text-center text-sm text-muted-foreground">
          ERT-THA v1.0 — Application de Tomographie de Résistivité Électrique
        </p>
      </footer>
    </div>
  );
};

export default Index;
