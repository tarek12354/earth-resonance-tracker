import { useState, useCallback, useRef, useEffect } from 'react';
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

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
  deviceId: string | null;
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
    deviceId: null,
    error: null,
  });
  const [liveReading, setLiveReading] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const dataBufferRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Initialize BLE on mount
  useEffect(() => {
    const initBle = async () => {
      try {
        await BleClient.initialize();
        isInitializedRef.current = true;
        console.log('BLE initialized successfully');
      } catch (error) {
        console.error('BLE initialization error:', error);
        setIsSupported(false);
        setState(s => ({ ...s, error: 'Bluetooth LE non disponible sur cet appareil' }));
      }
    };

    initBle();

    return () => {
      // Cleanup on unmount
      if (state.deviceId && state.isConnected) {
        BleClient.disconnect(state.deviceId).catch(console.error);
      }
    };
  }, []);

  // Simulate incoming data for testing without hardware
  const simulateData = useCallback((data: string) => {
    setLiveReading(data);
    onMeasurement(data);
  }, [onMeasurement]);

  // Process incoming BLE data
  const processData = useCallback((chunk: string) => {
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

  const requestPermissions = async (): Promise<boolean> => {
    // Only request permissions on native platforms
    if (Capacitor.getPlatform() === 'web') {
      return true;
    }

    try {
      // For Android 12+ (API 31+), we need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      // The BleClient.initialize() should handle permission requests
      // But we can also try to trigger the scan which will prompt for permissions
      console.log('Requesting BLE permissions...');
      
      // Check if Bluetooth is enabled
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        // Try to request enabling Bluetooth
        try {
          await BleClient.requestEnable();
        } catch (e) {
          console.log('User declined to enable Bluetooth');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const connect = useCallback(async () => {
    if (!isInitializedRef.current) {
      setState(s => ({ ...s, error: 'BLE non initialisé. Veuillez réessayer.' }));
      return;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));
    dataBufferRef.current = '';

    try {
      // Request permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setState(s => ({ 
          ...s, 
          isConnecting: false, 
          error: 'Permissions Bluetooth refusées. Activez-les dans les paramètres.' 
        }));
        return;
      }

      console.log('Scanning for ESP32 devices...');

      // Request device with name filter
      const device = await BleClient.requestDevice({
        namePrefix: DEVICE_NAME_PREFIX,
        optionalServices: [ESP32_SERVICE_UUID],
      });

      console.log('Device found:', device.name, device.deviceId);

      // Connect to the device
      await BleClient.connect(device.deviceId, (deviceId) => {
        console.log('Device disconnected:', deviceId);
        setState(s => ({ 
          ...s, 
          isConnected: false, 
          deviceName: null,
          deviceId: null 
        }));
        dataBufferRef.current = '';
      });

      console.log('Connected to device');

      // Start notifications
      await BleClient.startNotifications(
        device.deviceId,
        ESP32_SERVICE_UUID,
        ESP32_CHARACTERISTIC_UUID,
        (value) => {
          // Convert DataView to string
          const decoder = new TextDecoder('utf-8');
          const chunk = decoder.decode(value);
          processData(chunk);
        }
      );

      console.log('Notifications started');

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || 'ESP32',
        deviceId: device.deviceId,
        error: null,
      });

    } catch (error) {
      console.error('BLE Connection error:', error);
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      
      // Don't show error if user cancelled
      const isCancelled = message.includes('cancel') || 
                          message.includes('Cancel') ||
                          message.includes('User denied');
      
      setState(s => ({ 
        ...s, 
        isConnecting: false, 
        error: isCancelled ? null : `Erreur: ${message}` 
      }));
    }
  }, [processData]);

  const disconnect = useCallback(async () => {
    if (state.deviceId) {
      try {
        await BleClient.stopNotifications(
          state.deviceId,
          ESP32_SERVICE_UUID,
          ESP32_CHARACTERISTIC_UUID
        );
        await BleClient.disconnect(state.deviceId);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setLiveReading('');
    dataBufferRef.current = '';
    setState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
      deviceId: null,
      error: null,
    });
  }, [state.deviceId]);

  const sendCommand = useCallback(async (command: string) => {
    if (!state.deviceId || !state.isConnected) {
      throw new Error('Non connecté');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\n');
    
    await BleClient.write(
      state.deviceId,
      ESP32_SERVICE_UUID,
      ESP32_CHARACTERISTIC_UUID,
      new DataView(data.buffer)
    );
  }, [state.deviceId, state.isConnected]);

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
