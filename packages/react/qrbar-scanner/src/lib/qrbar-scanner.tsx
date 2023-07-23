import { BrowserMultiFormatReader, Exception, Result } from '@zxing/library';
import React, { useRef, useState, useEffect } from 'react';

interface QrbarScannerProps {
  onUpdate: (result: Result | undefined, error?: Exception) => void;
  isCapturing: boolean;
  onMultipleCameras?: (hasMultipleCameras: boolean) => void;
  delay?: number;
  facingMode?: string;
  width?: string;
  height?: string;
}

const QrbarScanner: React.FC<QrbarScannerProps> = ({
  onUpdate,
  isCapturing,
  onMultipleCameras,
  delay = 500,
  facingMode = 'environment',
  width = '300px',
  height = '300px'
}) => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        if (typeof onMultipleCameras === 'function') {
          onMultipleCameras(videoDevices.length > 1);
        }

        if (videoDevices.length >= 1) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }

        let deviceId;
        if (facingMode === 'environment') {
          deviceId = videoDevices.find((device) => device.label.toLowerCase().includes('back'))?.deviceId;
        } else if (facingMode === 'user') {
          deviceId = videoDevices.find((device) => device.label.toLowerCase().includes('front'))?.deviceId;
        }

        if (deviceId) {
          setSelectedDeviceId(deviceId);
        } else if (videoDevices.length >= 1) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error al obtener la lista de cámaras:', error);
      }
    };
    getCameras();
  }, [onMultipleCameras, facingMode]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCapture = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: selectedDeviceId ? { deviceId: selectedDeviceId } : true });

        if (webcamRef.current) {
          codeReader.current.decodeFromVideoDevice(selectedDeviceId, webcamRef.current, (result, error) => {
            if (result) {
              onUpdate(result);
            } else {
              onUpdate(undefined, error);
            }
          });
        }
      } catch (error) {
        console.error('Error al acceder a la cámara:', error);
      }
    };

    const stopCapture = () => {
      codeReader.current.reset();
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        if (webcamRef.current) {
          webcamRef.current.srcObject = null;
        }
      }
    };

    if (isCapturing) {
      startCapture();
    } else {
      stopCapture();
    }

    return () => {
      stopCapture();
    };
  }, [isCapturing, selectedDeviceId, onUpdate]);

  return (
    <div data-testid="qrbar-video-capture" style={{ width, height, margin: '0 auto' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <video ref={webcamRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </div>
  );
};

export default QrbarScanner;

