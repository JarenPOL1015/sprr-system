import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, FeatureGroup, Circle, Rectangle, Polygon, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

// Importar CSS de Leaflet y Draw
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './DangerMap.css';

// Fix para el icono predeterminado de Leaflet en Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DangerMap = () => {
    // Estado del usuario y alertas
    const [userPosition, setUserPosition] = useState(null);
    const [statusMsg, setStatusMsg] = useState("Esperando ubicación...");
    const [isAlert, setIsAlert] = useState(false);

    // Referencias
    const featureGroupRef = useRef(null); // Para acceder a las zonas dibujadas
    const isInsideRef = useRef(false); // Ref para mantener el estado de "dentro" sin re-renderizar loops

    // Zonas precargadas (simulando la lógica original)
    // Nota: Las renderizamos dentro del FeatureGroup para que sean detectables y editables
    const preloadedZones = [
        <Circle
            key="c1"
            center={[-2.1700, -79.9220]}
            radius={500}
            pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }}
        />,
        <Rectangle
            key="r1"
            bounds={[[-2.1620, -79.9200], [-2.1650, -79.9150]]}
            pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.5 }}
        />,
        <Polygon
            key="p1"
            positions={[
                [-2.1500, -79.9000],
                [-2.1480, -79.8920],
                [-2.1450, -79.8900],
                [-2.1400, -79.8950]
            ]}
            pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.5 }}
        />,
        <Circle
            key="c2"
            center={[-2.14402, -79.96209]}
            radius={500}
            pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }}
        />
    ];

    // Lógica de detección de colisión
    const checkDangerZone = (lat, lng) => {
        if (!featureGroupRef.current) return;

        const userLatLng = L.latLng(lat, lng);
        let currentlyInDanger = false;

        // Iterar sobre todas las capas (zonas) en el grupo
        featureGroupRef.current.eachLayer((layer) => {
            if (layer.getBounds().contains(userLatLng)) {
                currentlyInDanger = true;
            }
        });

        // Lógica de cambio de estado (Entrando o Saliendo)
        if (currentlyInDanger && !isInsideRef.current) {
            // ACABA DE ENTRAR
            isInsideRef.current = true;
            setIsAlert(true); // DISABLED
            setStatusMsg("Entrando en zona de riesgo");
            alert("¡Alerta! Estás en una zona peligrosa.");
        } else if (!currentlyInDanger && isInsideRef.current) {
            // ACABA DE SALIR
            isInsideRef.current = false;
            setIsAlert(false);
            setStatusMsg(`Ubicación segura: Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`);
        } else if (!currentlyInDanger) {
            // SE MANTIENE FUERA
            setStatusMsg(`Ubicación: Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`);
        }
    };

    // Efecto para rastrear ubicación (Geolocalización)
    useEffect(() => {
        if (!navigator.geolocation) {
            setStatusMsg("Geolocalización no soportada por el navegador.");
            return;
        }

        const handleSuccess = (position) => {
            const { latitude, longitude } = position.coords;
            setUserPosition([latitude, longitude]);
            checkDangerZone(latitude, longitude);
        };

        const handleError = () => {
            setStatusMsg("No se pudo obtener la ubicación.");
        };

        // watchPosition es mejor que setInterval para tracking
        const watcherId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        return () => navigator.geolocation.clearWatch(watcherId);
    }, []);

    // Manejador cuando se dibuja una nueva zona
    const onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'circle' || layerType === 'rectangle' || layerType === 'polygon') {
            layer.setStyle({ color: 'red', weight: 2, fillOpacity: 0.5 });
            // Nota: react-leaflet-draw añade la capa automáticamente al FeatureGroup
        }
    };

    return (
        <div>
            <div className={`info-panel ${isAlert ? 'alert' : ''}`}>
                {statusMsg}
            </div>

            <MapContainer center={[-2.14, -80]} zoom={13} className="map-container">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Marcador del usuario */}
                {userPosition && (
                    <Marker position={userPosition}>
                        <Popup>Tu ubicación actual</Popup>
                    </Marker>
                )}

                {/* Grupo de características (Zonas) */}
                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={onCreated}
                        draw={{
                            rectangle: true,
                            circle: true,
                            polygon: true,
                            circlemarker: false,
                            marker: false,
                            polyline: false
                        }}
                    />
                    {/* Renderizar zonas precargadas dentro del grupo controlable */}
                    {preloadedZones}
                </FeatureGroup>
            </MapContainer>
        </div>
    );
};

export default DangerMap;
