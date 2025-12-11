import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Navigation, Users, Settings, FileText, LogOut, Bell, CheckCircle, XCircle, TrendingUp, Clock, Car } from 'lucide-react';
import Mapa from './mapa';
import DangerMap from './DangerMap';

const SPRRSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [vehiclePosition, setVehiclePosition] = useState({ lat: -2.1894, lng: -79.8886 });
  const [routeProgress, setRouteProgress] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [alertedZones, setAlertedZones] = useState(new Set());
  const [riskZones, setRiskZones] = useState([
    { id: 1, name: 'Zona Industrial Norte', lat: -2.17, lng: -79.89, risk: 'high', active: true },
    { id: 2, name: 'Puente El Carmen', lat: -2.20, lng: -79.88, risk: 'medium', active: true },
    { id: 3, name: 'Curva La Esperanza', lat: -2.15, lng: -79.91, risk: 'high', active: true }
  ]);
  const [fleet, setFleet] = useState([
    { id: 1, driver: 'Juan Pérez', vehicle: 'ABC-123', status: 'En ruta', lat: -2.1894, lng: -79.8886, speed: 45 },
    { id: 2, driver: 'María López', vehicle: 'XYZ-789', status: 'En ruta', lat: -2.15, lng: -79.90, speed: 52 },
    { id: 3, driver: 'Carlos Ruiz', vehicle: 'DEF-456', status: 'Parado', lat: -2.20, lng: -79.88, speed: 0 }
  ]);

  useEffect(() => {
    if (currentUser?.role === 'driver') {
      const interval = setInterval(() => {
        setRouteProgress(prev => {
          const newProgress = prev + 2.22; // 100% / 45 segundos ≈ 2.22% por segundo
          return newProgress > 100 ? 100 : newProgress;
        });

        setVehiclePosition(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.01,
          lng: prev.lng + (Math.random() - 0.5) * 0.01
        }));
      }, 1000); // Actualizar cada segundo
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'driver' && routeProgress > 0 && routeProgress < 100) {
      checkProximityToRiskZones();
    }
  }, [routeProgress, currentUser]);

  const checkProximityToRiskZones = () => {
    if (alerts.length >= 3) return; // Limitar a máximo 3 alertas

    riskZones.forEach(zone => {
      if (!zone.active || alertedZones.has(zone.id)) return;

      // Calcular posición actual del vehículo basado en routeProgress
      let vehicleX, vehicleY;

      if (routeProgress <= 20) {
        vehicleX = 80 + (routeProgress * 6);
        vehicleY = 300 + (routeProgress * 2);
      } else if (routeProgress <= 40) {
        vehicleX = 200 + ((routeProgress - 20) * 8);
        vehicleY = 340 + ((routeProgress - 20) * 0.25);
      } else if (routeProgress <= 60) {
        vehicleX = 360 + ((routeProgress - 40) * 3);
        vehicleY = 345 - ((routeProgress - 40) * 2.75);
      } else if (routeProgress <= 80) {
        vehicleX = 420 + ((routeProgress - 60) * 3.25);
        vehicleY = 290 - ((routeProgress - 60) * 7.5);
      } else {
        vehicleX = 485 - ((routeProgress - 80) * 0.75);
        vehicleY = 140 - ((routeProgress - 80) * 0.5);
      }

      // Obtener posición de la zona de riesgo
      const zonePositions = [
        { left: 180, top: 265 },
        { left: 340, top: 200 },
        { left: 410, top: 155 }
      ];
      const zoneIdx = zone.id - 1;
      const zonePos = zonePositions[zoneIdx];

      // Calcular distancia entre vehículo y zona de riesgo
      const distance = Math.sqrt(
        Math.pow(vehicleX - zonePos.left, 2) +
        Math.pow(vehicleY - zonePos.top, 2)
      );

      // Ajustar radio de detección según la zona (más amplio para Puente El Carmen)
      const detectionRadius = zone.id === 2 ? 100 : 80;

      // Si está cerca de la zona, generar alerta
      if (distance < detectionRadius && !showAlert) {
        // triggerAlert(zone);
        // setAlertedZones(prev => new Set([...prev, zone.id]));
      }
    });
  };

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

    /*
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Alerta: ${newAlert.message}. ${newAlert.recommendation}`
      );
      utterance.lang = 'es-ES';
      speechSynthesis.speak(utterance);
    }
    */
  };

  const handleLogin = (username, password, role) => {
    setCurrentUser({ username, role });
    setCurrentView(role === 'driver' ? 'driver-dashboard' : 'supervisor-dashboard');
  };

  const handleAcceptAlternative = () => {
    setShowAlert(false);
    setAlerts(prev => prev.map(a =>
      a.id === currentAlert.id ? { ...a, action: 'accepted' } : a
    ));
  };

  const handleRejectAlternative = () => {
    setShowAlert(false);
    setAlerts(prev => prev.map(a =>
      a.id === currentAlert.id ? { ...a, action: 'rejected' } : a
    ));
  };

  const submitFeedback = (rating) => {
    setFeedback(prev => [...prev, { alertId: currentAlert.id, rating, timestamp: new Date() }]);
    setShowAlert(false);
  };

  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('driver');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">SPRR</h1>
            <p className="text-gray-600 mt-2">Sistema de Prevención de Riesgos en Rutas</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su contraseña"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedRole('driver')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${selectedRole === 'driver'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  <Car className="inline mr-2" size={20} />
                  Conductor
                </button>
                <button
                  onClick={() => setSelectedRole('supervisor')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${selectedRole === 'supervisor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  <Users className="inline mr-2" size={20} />
                  Supervisor
                </button>
              </div>
            </div>

            <button
              onClick={() => handleLogin(username, password, selectedRole)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-6"
            >
              Iniciar Sesión
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              Demo: Usuario: demo / Contraseña: cualquiera
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DriverDashboard = () => {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Navigation size={28} />
              <div>
                <h1 className="text-xl font-bold">SPRR - Conductor</h1>
                <p className="text-sm opacity-90">{currentUser.username}</p>
              </div>
            </div>
            <button
              onClick={() => { setCurrentUser(null); setCurrentView('login'); }}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

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

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600">Estado Actual</p>
                <p className="text-xl font-bold text-green-600">En Ruta</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Velocidad</p>
                <p className="text-xl font-bold">45 km/h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Alertas Hoy</p>
                <p className="text-xl font-bold text-orange-600">{alerts.length}</p>
              </div>
            </div>

            {/* Route Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Progreso de Ruta</p>
                <p className="text-sm font-bold text-blue-600">{Math.round(routeProgress)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${routeProgress}%` }}
                >
                  {routeProgress > 10 && (
                    <div className="h-full flex items-center justify-end pr-2">
                      <Car className="text-white" size={12} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Origen</span>
                <span>Destino</span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Mapa de Ruta
            </h2>
            <DangerMap />

          </div>

          {/* Alertas Recientes */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="text-orange-600" />
              Alertas Recientes
            </h2>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay alertas recientes</p>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${alert.risk === 'high' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
                    }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{alert.zone}</p>
                        <p className="text-sm text-gray-600">{alert.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{alert.timestamp}</p>
                        {alert.action && (
                          <span className={`text-xs px-2 py-1 rounded ${alert.action === 'accepted' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                            }`}>
                            {alert.action === 'accepted' ? 'Aceptada' : 'Rechazada'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SupervisorDashboard = () => {
    const [activeTab, setActiveTab] = useState('fleet');

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users size={28} />
              <div>
                <h1 className="text-xl font-bold">SPRR - Supervisor</h1>
                <p className="text-sm opacity-90">{currentUser.username}</p>
              </div>
            </div>
            <button
              onClick={() => { setCurrentUser(null); setCurrentView('login'); }}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow-md">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-4 px-6 font-semibold transition ${activeTab === 'fleet' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
                }`}
            >
              <Car className="inline mr-2" size={20} />
              Flota
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`flex-1 py-4 px-6 font-semibold transition ${activeTab === 'zones' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
                }`}
            >
              <MapPin className="inline mr-2" size={20} />
              Zonas de Riesgo
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-4 px-6 font-semibold transition ${activeTab === 'reports' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
                }`}
            >
              <FileText className="inline mr-2" size={20} />
              Reportes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Vehículos Activos</p>
                      <p className="text-2xl font-bold text-green-600">2</p>
                    </div>
                    <Car className="text-green-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Alertas Hoy</p>
                      <p className="text-2xl font-bold text-orange-600">{alerts.length}</p>
                    </div>
                    <Bell className="text-orange-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rutas Alt. Aceptadas</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {alerts.filter(a => a.action === 'accepted').length}
                      </p>
                    </div>
                    <TrendingUp className="text-blue-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Incidentes</p>
                      <p className="text-2xl font-bold text-red-600">0</p>
                    </div>
                    <AlertTriangle className="text-red-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Fleet Map */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-4">Mapa de Flota</h2>
                <DangerMap />

              </div>

              {/* Fleet List */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-4">Estado de Vehículos</h2>
                <div className="space-y-2">
                  {fleet.map(vehicle => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${vehicle.status === 'En ruta' ? 'bg-green-600' : 'bg-gray-600'
                          }`} />
                        <div>
                          <p className="font-semibold">{vehicle.vehicle}</p>
                          <p className="text-sm text-gray-600">{vehicle.driver}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{vehicle.status}</p>
                        <p className="text-sm text-gray-600">{vehicle.speed} km/h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Gestión de Zonas de Riesgo</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    + Agregar Zona
                  </button>
                </div>
                <div className="space-y-3">
                  {riskZones.map(zone => (
                    <div key={zone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${zone.risk === 'high' ? 'bg-red-100' : 'bg-orange-100'
                          }`}>
                          <AlertTriangle className={zone.risk === 'high' ? 'text-red-600' : 'text-orange-600'} />
                        </div>
                        <div>
                          <p className="font-semibold">{zone.name}</p>
                          <p className="text-sm text-gray-600">
                            {zone.risk === 'high' ? 'Riesgo Alto' : 'Riesgo Medio'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={zone.active}
                            onChange={() => {
                              setRiskZones(riskZones.map(z =>
                                z.id === zone.id ? { ...z, active: !z.active } : z
                              ));
                            }}
                            className="w-5 h-5"
                          />
                          <span className="text-sm">Activa</span>
                        </label>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                          <Settings size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Reportes y Análisis</h2>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Exportar PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Alertas por Zona</h3>
                    <div className="space-y-2">
                      {riskZones.map(zone => (
                        <div key={zone.id} className="flex justify-between items-center">
                          <span className="text-sm">{zone.name}</span>
                          <span className="font-bold">
                            {alerts.filter(a => a.zone === zone.name).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Tasa de Aceptación</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        {alerts.length > 0
                          ? Math.round((alerts.filter(a => a.action === 'accepted').length / alerts.filter(a => a.action).length) * 100)
                          : 0}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Rutas alternativas aceptadas
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Promedio de Feedback</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600">
                        {feedback.length > 0
                          ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
                          : 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Calificación de alertas
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Tiempo Promedio</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">2.5h</div>
                      <p className="text-sm text-gray-600 mt-2">
                        Duración de rutas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Historial de Alertas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4">Hora</th>
                          <th className="text-left py-3 px-4">Zona</th>
                          <th className="text-left py-3 px-4">Vehículo</th>
                          <th className="text-left py-3 px-4">Nivel</th>
                          <th className="text-left py-3 px-4">Acción</th>
                          <th className="text-left py-3 px-4">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-gray-500">
                              No hay alertas registradas
                            </td>
                          </tr>
                        ) : (
                          alerts.map((alert, idx) => (
                            <tr key={alert.id} className="border-b border-gray-200 hover:bg-white">
                              <td className="py-3 px-4 text-sm">{alert.timestamp}</td>
                              <td className="py-3 px-4 text-sm">{alert.zone}</td>
                              <td className="py-3 px-4 text-sm">ABC-123</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${alert.risk === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                                  }`}>
                                  {alert.risk === 'high' ? 'Alto' : 'Medio'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {alert.action ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${alert.action === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {alert.action === 'accepted' ? 'Aceptada' : 'Rechazada'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Pendiente</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {feedback.find(f => f.alertId === alert.id)?.rating || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="font-semibold text-gray-700 mb-2">Reportes Personalizados</h3>
                  <p className="text-gray-500 mb-4">
                    Genera reportes detallados por período, conductor o zona
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                      Reporte Semanal
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                      Reporte Mensual
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                      Personalizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {currentView === 'login' && <LoginScreen />}
      {currentView === 'driver-dashboard' && <DriverDashboard />}
      {currentView === 'supervisor-dashboard' && <SupervisorDashboard />}
    </div>
  );
};

export default SPRRSystem;