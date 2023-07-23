import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarcodeFormat, Result } from '@zxing/library';
import QrbarScanner from './qrbar-scanner';
import '@testing-library/jest-dom'

const mockDecodeFromVideoDevice = jest.fn().mockImplementation((_: unknown, __: unknown, callback: (result: Result | null, error: unknown) => void) => {
  const mockResult = new Result(
    'Mock QR Code',
    new Uint8Array(),
    0,
    [],
    BarcodeFormat.QR_CODE,
  );
  callback(mockResult, null);
});

// Mock para BrowserMultiFormatReader
jest.mock('@zxing/library', () => {
  const actualLibrary = jest.requireActual('@zxing/library');
  return {
    ...actualLibrary,
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
      decodeFromVideoDevice: mockDecodeFromVideoDevice,
      reset: jest.fn(),
    })),
    Result: jest.fn(),
    BarcodeFormat: { QR_CODE: 'QR_CODE' },
  };
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('QrbarScanner', () => {
  it('should render without errors', () => {
    render(<QrbarScanner onUpdate={jest.fn()} isCapturing={false} />);
    expect(screen.getByTestId('qrbar-video-capture')).toBeInTheDocument();
  });

  // it('should call onUpdate when capturing and decoding a result', async () => {
  //   const onUpdateMock = jest.fn();
  //   const originalMediaDevices = navigator.mediaDevices;
  //   const mediaDevicesMock = jest.fn(async () => {
  //     return new Promise<void>((resolve) => {
  //       resolve();
  //     });
  //   });
  //   Object.defineProperty(global.navigator, 'mediaDevices', {
  //     value: {
  //       enumerateDevices: mediaDevicesMock,
  //     },
  //   });

  //   act(async () => {
  //     render(<QrbarScanner onUpdate={onUpdateMock} isCapturing={true} />);
  //   });

  //   // Simular un resultado decodificado
  //   const mockResult = new Result(
  //     'Mock QR Code',
  //     new Uint8Array(),
  //     0,
  //     [],
  //     BarcodeFormat.QR_CODE,
  //   );

  //   // Esperar a que el resultado decodificado se llame
  //   await waitFor(() => {
  //     expect(onUpdateMock).toHaveBeenCalledTimes(1);
  //     expect(onUpdateMock).toHaveBeenCalledWith(mockResult, null);
  //   });

  //   // Restores
  //   Object.defineProperty(global.navigator, "mediaDevices", {
  //     writable: true,
  //     value: originalMediaDevices,
  //   });
  // });

  // it('should stop capturing when isCapturing prop changes to false', async () => {
  //   const { container, rerender } = render(<QrbarScanner onUpdate={jest.fn()} isCapturing={true} />);

  //   // Simular una captura
  //   await act(async () => {
  //     await waitFor(() => {
  //       userEvent.click(container.querySelector('video')!);
  //     });
  //   });

  //   // isCapturing se establece en false, debería detener la captura
  //   rerender(<QrbarScanner onUpdate={jest.fn()} isCapturing={false} />);
  //   await waitFor(() => {
  //     const mockStopCapture = (jest.requireMock('./QrbarScanner').stopCapture as jest.Mock).mock.results[0].value;
  //     expect(mockStopCapture).toHaveBeenCalledTimes(1);
  //   });
  // });
});
