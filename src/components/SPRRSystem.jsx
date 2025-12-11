import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Navigation, Users, Settings, FileText, LogOut, Bell, CheckCircle, XCircle, TrendingUp, Clock, Car } from 'lucide-react';
import DriverDashboard from './DriverDashboard';
import SupervisorDashboard from './SupervisorDashboard';

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

  return (
    <div>
      {currentView === 'login' && <LoginScreen />}
      {currentView === 'driver-dashboard' && (
        <DriverDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setCurrentView={setCurrentView}
          alerts={alerts}
          routeProgress={routeProgress}
          showAlert={showAlert}
          currentAlert={currentAlert}
          handleAcceptAlternative={handleAcceptAlternative}
          handleRejectAlternative={handleRejectAlternative}
          submitFeedback={submitFeedback}
        />
      )}
      {currentView === 'supervisor-dashboard' && (
        <SupervisorDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setCurrentView={setCurrentView}
          fleet={fleet}
          alerts={alerts}
          riskZones={riskZones}
          setRiskZones={setRiskZones}
          feedback={feedback}
        />
      )}
    </div>
  );
};

export default SPRRSystem;