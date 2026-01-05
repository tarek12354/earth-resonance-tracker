import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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

export type ArrayType = 'Dipole-Dipole' | 'Wenner' | 'Schlumberger';

interface SurveyConfig {
  arrayType: ArrayType;
  electrodeSpacing: number;
  projectName: string;
  operator: string;
}

const STORAGE_KEY = 'ert-tha-measurements';
const CONFIG_KEY = 'ert-tha-config';

export function useMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveReading, setLiveReading] = useState<Omit<Measurement, 'id' | 'timestamp'> | null>(null);
  const [config, setConfig] = useState<SurveyConfig>({
    arrayType: 'Dipole-Dipole',
    electrodeSpacing: 1.0,
    projectName: 'ERT Survey',
    operator: 'Tarek Attia',
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedMeasurements = localStorage.getItem(STORAGE_KEY);
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      
      if (savedMeasurements) {
        const parsed = JSON.parse(savedMeasurements);
        setMeasurements(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        setCurrentIndex(parsed.length);
      }
      
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }, []);

  // Save measurements to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
  }, [measurements]);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Parse incoming data - now accepts simple resistance string like "120.5"
  const handleIncomingData = useCallback((data: string) => {
    const trimmed = data.trim();
    const resistanceValue = parseFloat(trimmed);
    
    if (!isNaN(resistanceValue)) {
      // For simple resistance-only data, use placeholder electrode positions
      // These will be updated when recording based on survey configuration
      setLiveReading({
        a: currentIndex + 1,
        b: currentIndex + 2,
        m: currentIndex + 3,
        n: currentIndex + 4,
        ra: resistanceValue,
      });
    }
  }, [currentIndex]);

  const recordCurrentReading = useCallback(() => {
    if (!liveReading) return false;

    const newMeasurement: Measurement = {
      ...liveReading,
      id: Date.now(),
      timestamp: new Date(),
    };

    setMeasurements(prev => [...prev, newMeasurement]);
    setCurrentIndex(prev => prev + 1);
    setLiveReading(null);
    return true;
  }, [liveReading]);

  const deleteMeasurement = useCallback((id: number) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const clearAllMeasurements = useCallback(() => {
    setMeasurements([]);
    setCurrentIndex(0);
    setLiveReading(null);
  }, []);

  const updateConfig = useCallback((updates: Partial<SurveyConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const getArrayTypeCode = useCallback((type: ArrayType): string => {
    switch (type) {
      case 'Dipole-Dipole': return '3';
      case 'Wenner': return '1';
      case 'Schlumberger': return '2';
      default: return '3';
    }
  }, []);

  const exportToDAT = useCallback(() => {
    const lines: string[] = [];
    
    // Header
    lines.push(`${config.projectName} - par ${config.operator}`);
    lines.push(getArrayTypeCode(config.arrayType));
    lines.push(measurements.length.toString());
    lines.push(config.electrodeSpacing.toString());
    lines.push('0'); // Type flag
    
    // Data
    measurements.forEach(m => {
      // Format: x y a rho (for Res2DInv)
      const x = (m.a + m.b + m.m + m.n) / 4;
      const n_factor = Math.abs(m.m - m.b) / config.electrodeSpacing;
      lines.push(`${x.toFixed(2)} ${config.electrodeSpacing.toFixed(2)} ${n_factor.toFixed(0)} ${m.ra.toFixed(2)}`);
    });
    
    return lines.join('\n');
  }, [measurements, config, getArrayTypeCode]);

  const exportToCSV = useCallback(() => {
    const lines: string[] = [];
    lines.push('Index,A,B,M,N,Rho_a (Ohm.m),Timestamp');
    
    measurements.forEach((m, idx) => {
      lines.push(`${idx + 1},${m.a},${m.b},${m.m},${m.n},${m.ra.toFixed(2)},${m.timestamp.toISOString()}`);
    });
    
    return lines.join('\n');
  }, [measurements]);

  const downloadFileWeb = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadFileNative = useCallback(async (content: string, filename: string, _mimeType: string) => {
    try {
      // Write file to Cache directory (more reliable for sharing on Android)
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      console.log('File written to:', result.uri);

      // Open native share sheet immediately
      await Share.share({
        title: filename,
        url: result.uri,
        dialogTitle: 'Partager les données ERT',
      });
    } catch (error) {
      console.error('Error exporting file:', error);
      // Fallback to web download if native fails
      downloadFileWeb(content, filename, _mimeType);
    }
  }, [downloadFileWeb]);

  const exportDAT = useCallback(() => {
    const content = exportToDAT();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ERT-THA_${timestamp}.dat`;
    
    if (Capacitor.isNativePlatform()) {
      downloadFileNative(content, filename, 'text/plain');
    } else {
      downloadFileWeb(content, filename, 'text/plain');
    }
  }, [exportToDAT, downloadFileNative, downloadFileWeb]);

  const exportCSV = useCallback(() => {
    const content = exportToCSV();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ERT-THA_${timestamp}.csv`;
    
    if (Capacitor.isNativePlatform()) {
      downloadFileNative(content, filename, 'text/csv');
    } else {
      downloadFileWeb(content, filename, 'text/csv');
    }
  }, [exportToCSV, downloadFileNative, downloadFileWeb]);

  return {
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
  };
}
