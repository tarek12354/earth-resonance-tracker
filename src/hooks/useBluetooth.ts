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
  simulateData: (data: string) => void;
}

// ESP32 BLE UUIDs - MUST match your ESP32 firmware
const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
// Device name filter - accepts any device starting with ESP32
const DEVICE_NAME_PREFIX = 'ESP32';

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
  const dataBufferRef = useRef<string>('');

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Simulate incoming data for testing without hardware
  const simulateData = useCallback((data: string) => {
    setLiveReading(data);
    onMeasurement(data);
  }, [onMeasurement]);

  const handleNotification = useCallback((event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = event.target as any;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    const chunk = decoder.decode(value);
    
    // Buffer incoming data (ESP32 may send in chunks)
    dataBufferRef.current += chunk;
    
    // Process complete lines (ending with newline)
    const lines = dataBufferRef.current.split('\n');
    
    // Keep incomplete line in buffer
    dataBufferRef.current = lines.pop() || '';
    
    // Process complete lines
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        console.log('BLE Data received:', trimmed);
        setLiveReading(trimmed);
        onMeasurement(trimmed);
      }
    });
  }, [onMeasurement]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setState(s => ({ ...s, error: 'Web Bluetooth non supporté. Utilisez Chrome sur Android ou PC.' }));
      return;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));
    dataBufferRef.current = '';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      
      // Request device with flexible filtering
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: DEVICE_NAME_PREFIX },
          { services: [ESP32_SERVICE_UUID] }
        ],
        optionalServices: [ESP32_SERVICE_UUID],
      });

      console.log('Device found:', device.name);
      deviceRef.current = device;

      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        setState(s => ({ ...s, isConnected: false, deviceName: null }));
        characteristicRef.current = null;
        dataBufferRef.current = '';
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Impossible de se connecter au serveur GATT');
      console.log('GATT server connected');

      const service = await server.getPrimaryService(ESP32_SERVICE_UUID);
      console.log('Service found');
      
      const characteristic = await service.getCharacteristic(ESP32_CHARACTERISTIC_UUID);
      console.log('Characteristic found');
      
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      console.log('Notifications started');
      
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || 'ESP32',
        error: null,
      });
    } catch (error) {
      console.error('BLE Connection error:', error);
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      setState(s => ({ 
        ...s, 
        isConnecting: false, 
        error: message.includes('cancelled') || message.includes('User cancelled') 
          ? null 
          : `Erreur: ${message}` 
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
    simulateData,
  };
}
