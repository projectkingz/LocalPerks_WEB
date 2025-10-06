'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onScanError?: (error: string) => void;
}

// Create the inner scanner component
const InnerScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let Html5QrcodeScanner: any;

    const initializeScanner = async () => {
      if (!scannerRef.current && isScanning) {
        // eslint-disable-next-line @next/next/no-assign-module-variable
        const qrModule = await import('html5-qrcode');
        Html5QrcodeScanner = qrModule.Html5QrcodeScanner;

        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scannerRef.current.render(
          (decodedText: string) => {
            if (scannerRef.current) {
              scannerRef.current.clear();
              setIsScanning(false);
              onScanSuccess(decodedText);
            }
          },
          (error: string) => {
            if (onScanError) {
              onScanError(error);
            }
          }
        );
      }
    };

    if (isScanning) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current && !isScanning) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScanSuccess, onScanError]);

  return (
    <div>
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
        >
          Start QR Scanner
        </button>
      ) : (
        <div>
          <div id="qr-reader" className="w-full max-w-md mx-auto" />
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
                setIsScanning(false);
              }
            }}
            className="mt-4 w-full py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
          >
            Stop Scanner
          </button>
        </div>
      )}
    </div>
  );
};

// Create a dynamic component that only loads on the client side
const QRScannerComponent = dynamic(() => Promise.resolve(InnerScanner), {
  ssr: false
});

export default function QRScanner(props: QRScannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
    >
      <QRScannerComponent {...props} />
    </motion.div>
  );
} 