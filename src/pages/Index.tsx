import { useCallback, useRef, useState, useEffect } from 'react';
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

const AUTO_REQUEST_INTERVAL = 1500; // 1.5 seconds

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAutoRequesting, setIsAutoRequesting] = useState(false);
  const autoRequestRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    measurements,
    currentIndex,
    liveReading,
    config,
    handleIncomingData,
    recordCurrentReading,
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
    simulateData,
  } = useBluetooth(handleIncomingData);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoRequestRef.current) {
        clearInterval(autoRequestRef.current);
      }
    };
  }, []);

  // Start automatic NEXT requests every 1.5s
  const startAutoRequest = useCallback(() => {
    if (autoRequestRef.current) {
      clearInterval(autoRequestRef.current);
    }

    setIsAutoRequesting(true);

    // Send first NEXT immediately
    sendCommand('NEXT');

    // Then continue every 1.5s
    autoRequestRef.current = setInterval(() => {
      sendCommand('NEXT');
    }, AUTO_REQUEST_INTERVAL);
  }, [sendCommand]);

  // Stop automatic requests
  const stopAutoRequest = useCallback(() => {
    if (autoRequestRef.current) {
      clearInterval(autoRequestRef.current);
      autoRequestRef.current = null;
    }
    setIsAutoRequesting(false);
  }, []);

  // START button: begin auto-requesting
  const handleStart = useCallback(() => {
    if (isConnected) {
      startAutoRequest();
    }
  }, [isConnected, startAutoRequest]);

  // SUIVANTE (Next) button: record current reading and continue
  const handleNext = useCallback(() => {
    if (liveReading) {
      recordCurrentReading();
      // Auto-request continues for next measurement point
    }
  }, [liveReading, recordCurrentReading]);

  // REPEAT button: restart auto-requesting if stopped
  const handleRepeat = useCallback(() => {
    if (isConnected && !isAutoRequesting) {
      startAutoRequest();
    }
  }, [isConnected, isAutoRequesting, startAutoRequest]);

  // STOP button: stop auto-requesting
  const handleStop = useCallback(() => {
    stopAutoRequest();
    sendCommand('STOP');
  }, [stopAutoRequest, sendCommand]);

  // Simulate test data for manual testing without ESP32
  const handleSimulate = useCallback(() => {
    const testA = Math.floor(Math.random() * 10) + 1;
    const testB = testA + 1;
    const testM = testB + 1;
    const testN = testM + 1;
    const testRa = (Math.random() * 100 + 10).toFixed(2);
    const testData = `${testA},${testB},${testM},${testN},${testRa}`;
    simulateData(testData);
  }, [simulateData]);

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
        <LiveReading liveReading={liveReading} isAutoRequesting={isAutoRequesting} />

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <MeasurementControls
              isConnected={isConnected}
              isAutoRequesting={isAutoRequesting}
              hasLiveReading={!!liveReading}
              currentIndex={currentIndex}
              totalMeasurements={measurements.length}
              onStart={handleStart}
              onNext={handleNext}
              onRepeat={handleRepeat}
              onStop={handleStop}
              onSimulate={handleSimulate}
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
