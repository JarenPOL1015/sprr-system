import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import './leaflet.css';

export default function LeafletMap() {
    const mapContainer = useRef(null);
    const statusRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        const map = L.map(mapContainer.current).setView([-2.14, -80], 13);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const userMarker = L.marker([0, 0]).addTo(map);
        let dangerZones = [];
        let insideDangerZone = false;

        const precargarZonasPeligrosas = () => {
            const zonaCentroGuayaquil = L.circle([-2.1700, -79.9220], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: 500
            }).addTo(map);
            dangerZones.push(zonaCentroGuayaquil);

            const zonaBarrio9Octubre = L.rectangle([[-2.1620, -79.9200], [-2.1650, -79.9150]], {
                color: 'red',
                weight: 2,
                fillOpacity: 0.5
            }).addTo(map);
            dangerZones.push(zonaBarrio9Octubre);

            const zonaPuertoMaritimo = L.polygon([
                [-2.1500, -79.9000],
                [-2.1480, -79.8920],
                [-2.1450, -79.8900],
                [-2.1400, -79.8950]
            ], {
                color: 'red',
                weight: 2,
                fillOpacity: 0.5
            }).addTo(map);
            dangerZones.push(zonaPuertoMaritimo);
        };

        precargarZonasPeligrosas();

        // Use watchPosition instead of repeatedly calling getCurrentPosition
        // to avoid stacking requests and improve performance.
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                userMarker.setLatLng([lat, lon]);
                if (statusRef.current) {
                    statusRef.current.innerHTML = `Ubicación actualizada: Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
                }

                let isInDangerZone = false;
                for (let i = 0; i < dangerZones.length; i++) {
                    try {
                        if (dangerZones[i].getBounds().contains(userMarker.getLatLng())) {
                            isInDangerZone = true;
                            break;
                        }
                    } catch (e) {
                        // algunos layer types no tienen getBounds, ignore
                    }
                }

                if (isInDangerZone && !insideDangerZone) {
                    insideDangerZone = true;
                    if (statusRef.current) {
                        statusRef.current.classList.add('alert');
                        statusRef.current.innerHTML = '¡Estás en una zona peligrosa!';
                    }
                    // Removed blocking browser alert to avoid UI freezes/crashes
                    // try { window.alert('¡Alerta! Estás en una zona peligrosa.'); } catch(e){}
                } else if (!isInDangerZone && insideDangerZone) {
                    insideDangerZone = false;
                    if (statusRef.current) statusRef.current.classList.remove('alert');
                }

            }, (err) => {
                if (statusRef.current) statusRef.current.innerHTML = 'No se pudo obtener la ubicación.';
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            });
        }

        try {
            if (L.Control && L.Control.Draw) {
                const drawnItems = new L.FeatureGroup().addTo(map);
                map.addControl(new L.Control.Draw({ edit: { featureGroup: drawnItems } }));
                map.on(L.Draw.Event.CREATED, (event) => {
                    const layer = event.layer;
                    drawnItems.addLayer(layer);
                    dangerZones.push(layer);
                    if (layer instanceof L.Circle || layer instanceof L.Rectangle || layer instanceof L.Polygon) {
                        layer.setStyle({ color: 'red', weight: 2, fillOpacity: 0.5 });
                    }
                });
            }
        } catch (e) {
            // leaflet-draw not available; continue
        }

        return () => {
            // clean up geolocation watch if present
            try { if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId); } catch(e){}
            if (mapRef.current) mapRef.current.remove();
        };
    }, []);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <div
                ref={statusRef}
                className="info"
                style={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px',
                    fontSize: 16,
                    borderRadius: 6,
                    zIndex: 9999,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
            >
                Esperando ubicación...
            </div>
            <div ref={mapContainer} id="map-react" style={{ height: '100%', width: '100%' }} />
        </div>
    );
}