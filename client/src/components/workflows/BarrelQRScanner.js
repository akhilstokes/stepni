import React, { useState, useRef, useEffect } from 'react';
import './BarrelQRScanner.css';

const BarrelQRScanner = ({ onBarrelScanned, onLocationUpdate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [barrelStatus, setBarrelStatus] = useState('picked_up');
  const [location, setLocation] = useState(null);
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

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

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

  const handleScan = (data) => {
    if (data) {
      setScannedData(data);
      setIsScanning(false);
      processBarrelData(data);
    }
  };

  const handleManualEntry = () => {
    if (manualEntry.trim()) {
      setScannedData(manualEntry);
      processBarrelData(manualEntry);
      setManualEntry('');
      setShowManualEntry(false);
    }
  };

  const processBarrelData = async (barrelId) => {
    try {
      // Simulate barrel data processing
      const barrelData = {
        id: barrelId,
        status: barrelStatus,
        location: location,
        timestamp: new Date().toISOString(),
        scannedBy: 'field_staff'
      };

      // Call parent callbacks
      if (onBarrelScanned) {
        onBarrelScanned(barrelData);
      }
      
      if (onLocationUpdate) {
        onLocationUpdate(barrelId, barrelStatus, location);
      }

      // Send to backend
      await updateBarrelStatus(barrelData);
      
    } catch (error) {
      console.error('Error processing barrel data:', error);
    }
  };

  const updateBarrelStatus = async (barrelData) => {
    try {
      const response = await fetch('/api/field-staff/barrel-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(barrelData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update barrel status');
      }
      
      console.log('Barrel status updated successfully');
    } catch (error) {
      console.error('Error updating barrel status:', error);
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
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowManualEntry(!showManualEntry)}
          >
            <i className="fas fa-keyboard"></i>
            Manual Entry
          </button>
        </div>
      </div>

      {/* Camera View */}
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

      {/* Manual Entry */}
      {showManualEntry && (
        <div className="manual-entry">
          <div className="input-group">
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              placeholder="Enter barrel ID manually"
              className="manual-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleManualEntry}
              disabled={!manualEntry.trim()}
            >
              <i className="fas fa-check"></i>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Status Selection */}
      <div className="status-selection">
        <label>Barrel Status:</label>
        <div className="status-options">
          <label className="status-option">
            <input
              type="radio"
              value="picked_up"
              checked={barrelStatus === 'picked_up'}
              onChange={(e) => setBarrelStatus(e.target.value)}
            />
            <span>Picked Up</span>
          </label>
          <label className="status-option">
            <input
              type="radio"
              value="delivered"
              checked={barrelStatus === 'delivered'}
              onChange={(e) => setBarrelStatus(e.target.value)}
            />
            <span>Delivered</span>
          </label>
          <label className="status-option">
            <input
              type="radio"
              value="damaged"
              checked={barrelStatus === 'damaged'}
              onChange={(e) => setBarrelStatus(e.target.value)}
            />
            <span>Damaged</span>
          </label>
          <label className="status-option">
            <input
              type="radio"
              value="in_transit"
              checked={barrelStatus === 'in_transit'}
              onChange={(e) => setBarrelStatus(e.target.value)}
            />
            <span>In Transit</span>
          </label>
        </div>
      </div>

      {/* Location Info */}
      {location && (
        <div className="location-info">
          <div className="location-header">
            <i className="fas fa-map-marker-alt"></i>
            <span>Current Location</span>
          </div>
          <div className="location-coords">
            <span>Lat: {location.latitude.toFixed(6)}</span>
            <span>Lng: {location.longitude.toFixed(6)}</span>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {scannedData && (
        <div className="recent-scan">
          <div className="scan-result">
            <div className="scan-header">
              <i className="fas fa-check-circle"></i>
              <span>Last Scanned</span>
            </div>
            <div className="scan-details">
              <div className="scan-id">Barrel ID: {scannedData}</div>
              <div className="scan-status">Status: {barrelStatus.replace('_', ' ')}</div>
              <div className="scan-time">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="scanner-instructions">
        <h4>Instructions:</h4>
        <ol>
          <li>Select the appropriate barrel status</li>
          <li>Click "Start Scanning" to activate camera</li>
          <li>Position the QR code within the frame</li>
          <li>The system will automatically detect and process the code</li>
          <li>Use "Manual Entry" if QR code is damaged or unreadable</li>
        </ol>
      </div>
    </div>
  );
};

export default BarrelQRScanner;