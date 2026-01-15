import React, { useState, useEffect } from 'react';
import './FieldStaffRoutes.css';

const FieldStaffRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/field-staff/routes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRoutes(data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      // Mock data for development
      setRoutes([
        {
          id: 1,
          name: 'Route A - North Zone',
          locations: ['Farm 1', 'Farm 2', 'Farm 3'],
          status: 'active',
          estimatedTime: '4 hours',
          distance: '25 km'
        },
        {
          id: 2,
          name: 'Route B - South Zone',
          locations: ['Farm 4', 'Farm 5', 'Farm 6'],
          status: 'pending',
          estimatedTime: '3.5 hours',
          distance: '20 km'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="field-staff-routes">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="field-staff-routes">
      <div className="routes-header">
        <h2>My Routes</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="routes-grid">
        {routes.map(route => (
          <div 
            key={route.id} 
            className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
            onClick={() => setSelectedRoute(route)}
          >
            <div className="route-header">
              <h3>{route.name}</h3>
              <span className={`status-badge ${route.status}`}>
                {route.status}
              </span>
            </div>
            
            <div className="route-details">
              <div className="detail-item">
                <i className="fas fa-clock"></i>
                <span>{route.estimatedTime}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-route"></i>
                <span>{route.distance}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>{route.locations.length} locations</span>
              </div>
            </div>

            <div className="route-locations">
              <h4>Locations:</h4>
              <ul>
                {route.locations.map((location, index) => (
                  <li key={index}>{location}</li>
                ))}
              </ul>
            </div>

            <div className="route-actions">
              <button className="btn btn-outline-primary">
                <i className="fas fa-eye"></i>
                View Details
              </button>
              <button className="btn btn-success">
                <i className="fas fa-play"></i>
                Start Route
              </button>
            </div>
          </div>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="no-routes">
          <i className="fas fa-route"></i>
          <h3>No Routes Assigned</h3>
          <p>You don't have any routes assigned for today.</p>
        </div>
      )}
    </div>
  );
};

export default FieldStaffRoutes;