import { useState, useCallback, useRef } from 'react';

export interface Measurement {
  id: number;
  a: number;
  b: number;
  m: number;
  n: number;
  ra: number;
  timestamp: Date;
}

interface BluetoothState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
}

interface UseBluetoothReturn extends BluetoothState {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (command: string) => Promise<void>;
  liveReading: string;
  isSupported: boolean;
}

const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_NAME = 'ESP32_ERT';

export function useBluetooth(onMeasurement: (data: string) => void): UseBluetoothReturn {
  const [state, setState] = useState<BluetoothState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    error: null,
  });
  const [liveReading, setLiveReading] = useState('');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characteristicRef = useRef<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleNotification = useCallback((event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = event.target as any;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(value).trim();
    
    if (data) {
      setLiveReading(data);
      onMeasurement(data);
    }
  }, [onMeasurement]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setState(s => ({ ...s, error: 'Web Bluetooth non supporté sur ce navigateur' }));
      return;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ name: DEVICE_NAME }],
        optionalServices: [ESP32_SERVICE_UUID],
      });

      deviceRef.current = device;

      device.addEventListener('gattserverdisconnected', () => {
        setState(s => ({ ...s, isConnected: false, deviceName: null }));
        characteristicRef.current = null;
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Impossible de se connecter au serveur GATT');

      const service = await server.getPrimaryService(ESP32_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(ESP32_CHARACTERISTIC_UUID);
      
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || 'ESP32_ERT',
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      setState(s => ({ 
        ...s, 
        isConnecting: false, 
        error: message.includes('cancelled') ? null : message 
      }));
    }
  }, [isSupported, handleNotification]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    characteristicRef.current = null;
    setLiveReading('');
    setState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
      error: null,
    });
  }, []);

  const sendCommand = useCallback(async (command: string) => {
    if (!characteristicRef.current) {
      throw new Error('Non connecté');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\n');
    await characteristicRef.current.writeValue(data);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendCommand,
    liveReading,
    isSupported,
  };
}
