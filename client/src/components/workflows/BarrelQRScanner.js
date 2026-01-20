import { useState, useRef, useEffect } from 'react';
import './BarrelQRScanner.css';

const BarrelQRScanner = ({ onBarrelScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processBarrelData = async (barrelId) => {
    try {
      const barrelData = {
        barrelId: barrelId,
        timestamp: new Date().toISOString()
      };

      if (onBarrelScanned) {
        onBarrelScanned(barrelData);
      }
      
    } catch (error) {
      console.error('Error processing barrel data:', error);
    }
  };

  return (
    <div className="barrel-qr-scanner">
      <div className="scanner-header">
        <h3>Barrel QR Scanner</h3>
        <div className="scanner-controls">
          <button
            className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setIsScanning(!isScanning)}
          >
            <i className={`fas fa-${isScanning ? 'stop' : 'play'}`}></i>
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video"
          />
          <div className="scan-overlay">
            <div className="scan-frame"></div>
            <p>Position QR code within the frame</p>
          </div>
        </div>
      )}

      {scannedData && (
        <div className="recent-scan">
          <div className="scan-result">
            <div className="scan-header">
              <i className="fas fa-check-circle"></i>
              <span>Last Scanned</span>
            </div>
            <div className="scan-details">
              <div className="scan-id">Barrel ID: {scannedData}</div>
              <div className="scan-time">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="scanner-instructions">
        <h4>Instructions:</h4>
        <ol>
          <li>Click "Start Scanning" to activate camera</li>
          <li>Position the QR code within the frame</li>
          <li>The system will automatically detect and process the code</li>
        </ol>
      </div>
    </div>
  );
};

export default BarrelQRScanner;
