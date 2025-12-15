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
    const [showAlert, setShowAlert] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);

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
            center={[-2.145426666711421, -79.96594468518431]}
            radius={27}
            pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }}
        />
    ];

    {/* Alert Modal */}
    {showAlert && currentAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${currentAlert.risk === 'high' ? 'border-4 border-red-500' : 'border-4 border-orange-500'
                }`}>
                <div className="text-center mb-4">
                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${currentAlert.risk === 'high' ? 'bg-red-100' : 'bg-orange-100'
                        }`}>
                        <AlertTriangle className={currentAlert.risk === 'high' ? 'text-red-600' : 'text-orange-600'} size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡ALERTA DE SEGURIDAD!</h2>
                    <p className="text-lg font-semibold text-gray-700">{currentAlert.message}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700 font-medium">{currentAlert.recommendation}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleAcceptAlternative}
                        className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={24} />
                        Aceptar Ruta Alternativa
                    </button>
                    <button
                        onClick={handleRejectAlternative}
                        className="w-full bg-gray-600 text-white py-4 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                        <XCircle size={24} />
                        Continuar Ruta Actual
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2 text-center">¿Qué tan útil fue esta alerta?</p>
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map(rating => (
                            <button
                                key={rating}
                                onClick={() => submitFeedback(rating)}
                                className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 transition font-semibold text-blue-700"
                            >
                                {rating}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )}

     const triggerAlert = (zone) => {
        const newAlert = {
        id: Date.now(),
        zone: zone.name,
        risk: zone.risk,
        message: `Aproximándose a ${zone.name} - ${zone.risk === 'high' ? 'Riesgo Alto' : 'Riesgo Medio'}`,
        recommendation: zone.risk === 'high' ? 'Se recomienda reducir velocidad a 40 km/h y tomar ruta alternativa' : 'Mantener precaución y velocidad moderada',
        timestamp: new Date().toLocaleTimeString()
        };
        setCurrentAlert(newAlert);
        // setShowAlert(true);
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    };

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
            setIsAlert(true);
            setStatusMsg("Entrando en zona de riesgo");
            triggerAlert({name: "Zona Peligrosa", risk: "high"});
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
