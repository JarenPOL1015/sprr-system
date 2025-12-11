import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Rectangle, Polygon, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LoadingInfo = ({ status, isAlert }) => (
    <div
        className={`info ${isAlert ? 'alert' : ''}`}
        style={{
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isAlert ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            fontSize: '18px',
            borderRadius: '5px',
            zIndex: 9999,
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}
    >
        {status}
    </div>
);

const LocationHandler = ({ setLocationStatus, setInsideDangerZone, insideDangerZone, dangerZonesRef }) => {
    const map = useMap();
    const markerRef = useRef(null);
    // User location Ref to allow accessing latest value inside effect without restarting it
    const insideZoneRef = useRef(insideDangerZone);

    // Sync ref with prop
    useEffect(() => {
        insideZoneRef.current = insideDangerZone;
    }, [insideDangerZone]);

    useEffect(() => {
        if (!markerRef.current) {
            // Create marker imperatively once
            markerRef.current = L.marker([0, 0]).addTo(map);
        }

        let watchId;

        const updateLocation = (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const newLatLng = new L.LatLng(lat, lon);

            // Update marker position directly
            if (markerRef.current) {
                markerRef.current.setLatLng(newLatLng);
            }

            // Update status text (this triggers parent re-render, but MainMap is memoized)
            setLocationStatus(`Ubicación actualizada: Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);

            // Check danger zones
            let isInDangerZone = false;
            const layers = dangerZonesRef.current ? dangerZonesRef.current.getLayers() : [];

            for (const layer of layers) {
                if (layer.getBounds && layer.getBounds().contains(newLatLng)) {
                    isInDangerZone = true;
                    break;
                }
            }

            // Use ref to check current state to avoid effect re-run
            if (isInDangerZone && !insideZoneRef.current) {
                setInsideDangerZone(true);
                // alert is annoying during dev, maybe just log or optional
                // alert("¡Alerta! Estás en una zona peligrosa."); 
            } else if (!isInDangerZone && insideZoneRef.current) {
                setInsideDangerZone(false);
            }
        };

        const handleError = (err) => {
            console.error("Geolocation error:", err);
            setLocationStatus("Error obteniendo ubicación.");
        };

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000
            });
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            // Optional: don't remove marker on unmount if we want to persist, but usually we clean up
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, dangerZonesRef, setLocationStatus, setInsideDangerZone]); // Removed insideDangerZone from deps

    return null;
};

// Memoize the map part so it doesn't re-render when 'locationStatus' string changes
const MainMap = React.memo(({ setLocationStatus, setInsideDangerZone, insideDangerZone, featureGroupRef, onCreated, centroGuayaquil, barrio9Octubre, puertoMaritimo }) => {
    return (
        <MapContainer center={[-2.14, -80]} zoom={13} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />

            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={onCreated}
                    draw={{
                        rectangle: true,
                        circle: true,
                        polygon: true,
                        marker: false,
                        circlemarker: false,
                        polyline: false
                    }}
                />

                {/* Preloaded Zones */}
                <Circle
                    center={centroGuayaquil.center}
                    radius={centroGuayaquil.radius}
                    pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }}
                />
                <Rectangle
                    bounds={barrio9Octubre}
                    pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.5 }}
                />
                <Polygon
                    positions={puertoMaritimo}
                    pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.5 }}
                />
            </FeatureGroup>

            <LocationHandler
                setLocationStatus={setLocationStatus}
                setInsideDangerZone={setInsideDangerZone}
                insideDangerZone={insideDangerZone}
                dangerZonesRef={featureGroupRef}
            />
        </MapContainer>
    );
});

const Mapa = () => {
    const [locationStatus, setLocationStatus] = useState("Esperando ubicación...");
    const [insideDangerZone, setInsideDangerZone] = useState(false);
    const featureGroupRef = useRef(null);

    // Initial zones configuration - memoized prevents re-creation for MainMap props
    const centroGuayaquil = React.useMemo(() => ({ center: [-2.1700, -79.9220], radius: 500 }), []);
    const barrio9Octubre = React.useMemo(() => [[-2.1620, -79.9200], [-2.1650, -79.9150]], []);
    const puertoMaritimo = React.useMemo(() => [
        [-2.1500, -79.9000],
        [-2.1480, -79.8920],
        [-2.1450, -79.8900],
        [-2.1400, -79.8950]
    ], []);

    const onCreated = (e) => {
        console.log("New zone created", e.layer);
        const layer = e.layer;
        if (layer.setStyle) {
            layer.setStyle({ color: 'red', weight: 2, fillOpacity: 0.5 });
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <LoadingInfo status={locationStatus} isAlert={insideDangerZone} />

            <MainMap
                setLocationStatus={setLocationStatus}
                setInsideDangerZone={setInsideDangerZone}
                insideDangerZone={insideDangerZone}
                featureGroupRef={featureGroupRef}
                onCreated={onCreated}
                centroGuayaquil={centroGuayaquil}
                barrio9Octubre={barrio9Octubre}
                puertoMaritimo={puertoMaritimo}
            />
        </div>
    );
};

export default Mapa;
