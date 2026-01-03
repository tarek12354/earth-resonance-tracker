import { Bluetooth, BluetoothOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
  isSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  isConnecting,
  deviceName,
  error,
  isSupported,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
        <BluetoothOff className="h-5 w-5" />
        <div>
          <p className="font-medium">Bluetooth non supporté</p>
          <p className="text-sm opacity-80">
            Utilisez Chrome/Edge sur Android ou Desktop
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          variant={isConnected ? 'outline' : 'default'}
          className={cn(
            'min-w-[160px]',
            isConnected && 'border-accent text-accent'
          )}
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : isConnected ? (
            <>
              <Bluetooth className="h-4 w-4" />
              Connecté
            </>
          ) : (
            <>
              <Bluetooth className="h-4 w-4" />
              Connecter BLE
            </>
          )}
        </Button>

        {isConnected && deviceName && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {deviceName}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
