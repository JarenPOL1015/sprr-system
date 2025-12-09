import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Navigation, Users, Settings, FileText, LogOut, Bell, CheckCircle, XCircle, TrendingUp, Clock, Car } from 'lucide-react';

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
  }, [currentUser, vehiclePosition]);

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
        triggerAlert(zone);
        setAlertedZones(prev => new Set([...prev, zone.id]));
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
    setShowAlert(true);
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Alerta: ${newAlert.message}. ${newAlert.recommendation}`
      );
      utterance.lang = 'es-ES';
      speechSynthesis.speak(utterance);
    }
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
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    selectedRole === 'driver'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <Car className="inline mr-2" size={20} />
                  Conductor
                </button>
                <button
                  onClick={() => setSelectedRole('supervisor')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    selectedRole === 'supervisor'
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
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${
              currentAlert.risk === 'high' ? 'border-4 border-red-500' : 'border-4 border-orange-500'
            }`}>
              <div className="text-center mb-4">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
                  currentAlert.risk === 'high' ? 'bg-red-100' : 'bg-orange-100'
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
            <div className="relative bg-gradient-to-br from-yellow-50 via-green-50 to-blue-100 rounded-lg h-96 overflow-hidden border-2 border-gray-300 shadow-inner">
              {/* Fondo base de ciudad */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                backgroundSize: '60px 60px',
                backgroundPosition: '0 0, 30px 30px',
                backgroundColor: '#F5F5DC',
                opacity: 0.3
              }}></div>
              
              {/* Capa de agua y características naturales */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                {/* Río/Arroyo sinuoso */}
                <defs>
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4DA6FF" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path
                  d="M -10,80 Q 40,100 80,110 T 180,120 Q 250,125 320,115 T 450,90"
                  stroke="url(#waterGradient)"
                  strokeWidth="16"
                  fill="none"
                />
                <path
                  d="M -10,80 Q 40,100 80,110 T 180,120 Q 250,125 320,115 T 450,90"
                  stroke="#1E90FF"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.5"
                  strokeDasharray="4,2"
                />
              </svg>

              {/* Capa de calles y vías principales */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                {/* Avenida principal horizontal (este-oeste) */}
                <rect x="0" y="235" width="600" height="50" fill="#C0C0C0"/>
                <line x1="0" y1="250" x2="600" y2="250" stroke="#FFD700" strokeWidth="3" opacity="0.6"/>
                <line x1="0" y1="270" x2="600" y2="270" stroke="#FFD700" strokeWidth="3" opacity="0.6"/>
                
                {/* Avenida vertical (norte-sur) */}
                <rect x="310" y="0" width="50" height="400" fill="#C0C0C0"/>
                <line x1="325" y1="0" x2="325" y2="400" stroke="#FFD700" strokeWidth="3" opacity="0.6"/>
                <line x1="345" y1="0" x2="345" y2="400" stroke="#FFD700" strokeWidth="3" opacity="0.6"/>
                
                {/* Calle transversal norte-este */}
                <path d="M 0,140 L 350,30" stroke="#A9A9A9" strokeWidth="18" opacity="0.7"/>
                <path d="M 0,140 L 350,30" stroke="#FFD700" strokeWidth="2" opacity="0.4" strokeDasharray="6,4"/>
                
                {/* Calle transversal sur-este */}
                <path d="M 30,350 L 420,100" stroke="#A9A9A9" strokeWidth="18" opacity="0.7"/>
                <path d="M 30,350 L 420,100" stroke="#FFD700" strokeWidth="2" opacity="0.4" strokeDasharray="6,4"/>

                {/* Calles secundarias */}
                <path d="M 0,180 L 310,180" stroke="#D3D3D3" strokeWidth="12" opacity="0.6"/>
                <path d="M 360,150 L 600,150" stroke="#D3D3D3" strokeWidth="12" opacity="0.6"/>
                <path d="M 0,300 L 310,300" stroke="#D3D3D3" strokeWidth="12" opacity="0.6"/>
                <path d="M 360,320 L 600,320" stroke="#D3D3D3" strokeWidth="12" opacity="0.6"/>

                {/* Manzanas/Edificios simulados */}
                <g opacity="0.12" fill="#696969">
                  {/* Bloque noroeste */}
                  <rect x="20" y="20" width="50" height="60" />
                  <rect x="80" y="15" width="45" height="70" />
                  <rect x="135" y="25" width="55" height="55" />
                  
                  {/* Bloque noreste */}
                  <rect x="380" y="20" width="50" height="65" />
                  <rect x="445" y="30" width="45" height="50" />
                  <rect x="500" y="15" width="50" height="70" />
                  
                  {/* Bloque suroeste */}
                  <rect x="35" y="320" width="55" height="60" />
                  <rect x="100" y="310" width="48" height="70" />
                  
                  {/* Bloque sureste */}
                  <rect x="390" y="300" width="50" height="60" />
                  <rect x="455" y="320" width="45" height="50" />
                </g>

                {/* Parques/Espacios verdes */}
                <circle cx="200" cy="70" r="20" fill="#228B22" opacity="0.2"/>
                <circle cx="480" cy="350" r="25" fill="#228B22" opacity="0.2"/>
              </svg>

              <div className="absolute inset-0 p-4" style={{ zIndex: 2 }}>
                {/* Marcador de origen mejorado */}
                <div className="absolute" style={{ left: '80px', top: '300px' }}>
                  <div className="absolute w-12 h-12 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute w-8 h-8 bg-green-400 rounded-full opacity-30 top-1 left-1" style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.2s infinite'}}></div>
                  <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-10">
                    <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
                    ORIGEN
                  </div>
                </div>

                {/* Marcador de destino mejorado */}
                <div className="absolute" style={{ left: '470px', top: '130px' }}>
                  <div className="absolute w-14 h-14 bg-red-400 rounded-full opacity-15 animate-pulse"></div>
                  <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative z-10" style={{background: 'linear-gradient(135deg, #DC2626, #991B1B)'}}>
                    <MapPin className="text-white" size={18} />
                  </div>
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
                    DESTINO
                  </div>
                </div>

                {/* Zonas de Riesgo Mejoradas */}
                {riskZones.filter(z => z.active).map((zone, idx) => {
                  const positions = [
                    { left: '180px', top: '265px' },
                    { left: '340px', top: '200px' },
                    { left: '410px', top: '155px' }
                  ];
                  const isHighRisk = zone.risk === 'high';
                  return (
                    <div key={zone.id} className="absolute" style={positions[idx]}>
                      {/* Efecto de pulso exterior */}
                      <div
                        className={`w-28 h-28 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                          isHighRisk ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ 
                          opacity: 0.15,
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                      />
                      {/* Círculo intermedio */}
                      <div
                        className={`w-24 h-24 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 ${
                          isHighRisk ? 'border-red-500 bg-red-200' : 'border-orange-500 bg-orange-200'
                        }`}
                        style={{ opacity: 0.35 }}
                      />
                      {/* Símbolo de peligro y etiqueta */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                          isHighRisk ? 'bg-red-600' : 'bg-orange-600'
                        }`}>
                          <AlertTriangle className="text-white" size={24} />
                        </div>
                        <div className={`text-xs font-bold mt-2 px-2 py-1 rounded-lg shadow-lg text-white ${
                          isHighRisk ? 'bg-red-700' : 'bg-orange-700'
                        }`} style={{fontSize: '10px', whiteSpace: 'nowrap'}}>
                          {zone.name}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Ruta original peligrosa - roja */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
                  {/* Sombra/Efecto de profundidad */}
                  <path
                    d="M 80,300 L 180,265 L 340,200 L 410,155 L 460,120"
                    stroke="#333"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.1"
                  />
                  {/* Ruta principal */}
                  <path
                    d="M 80,300 L 180,265 L 340,200 L 410,155 L 460,120"
                    stroke="#EF4444"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="10,6"
                    opacity="0.8"
                    strokeLinecap="round"
                  />
                  {/* Borde decorativo */}
                  <path
                    d="M 80,300 L 180,265 L 340,200 L 410,155 L 460,120"
                    stroke="#DC2626"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                    strokeDasharray="10,6"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Ruta alternativa segura - azul a verde */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }}>
                  <defs>
                    <linearGradient id="safeRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Sombra exterior */}
                  <path
                    d="M 80,300 Q 140,325 200,340 Q 280,355 360,345 Q 420,335 460,300 Q 480,280 485,240 Q 488,200 480,160 Q 475,140 470,130"
                    stroke="#000"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.1"
                  />
                  {/* Ruta principal segura con gradiente */}
                  <path
                    d="M 80,300 Q 140,325 200,340 Q 280,355 360,345 Q 420,335 460,300 Q 480,280 485,240 Q 488,200 480,160 Q 475,140 470,130"
                    stroke="url(#safeRouteGradient)"
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray="15,10"
                    strokeDashoffset={680 - (680 * routeProgress / 100)}
                    opacity="0.95"
                    filter="url(#glow)"
                    style={{
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      transition: 'stroke-dashoffset 1s linear'
                    }}
                  />
                  {/* Borde reforzado */}
                  <path
                    d="M 80,300 Q 140,325 200,340 Q 280,355 360,345 Q 420,335 460,300 Q 480,280 485,240 Q 488,200 480,160 Q 475,140 470,130"
                    stroke="#0EA5E9"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.6"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Vehicle Position following the safe route */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    // Precise calculation to follow the safe route curve smoothly
                    left: routeProgress <= 20
                      ? `${80 + (routeProgress * 6)}px`
                      : routeProgress <= 40
                      ? `${200 + ((routeProgress - 20) * 8)}px`
                      : routeProgress <= 60
                      ? `${360 + ((routeProgress - 40) * 3)}px`
                      : routeProgress <= 80
                      ? `${420 + ((routeProgress - 60) * 3.25)}px`
                      : `${485 - ((routeProgress - 80) * 0.75)}px`,
                    top: routeProgress <= 20
                      ? `${300 + (routeProgress * 2)}px`
                      : routeProgress <= 40
                      ? `${340 + ((routeProgress - 20) * 0.25)}px`
                      : routeProgress <= 60
                      ? `${345 - ((routeProgress - 40) * 2.75)}px`
                      : routeProgress <= 80
                      ? `${290 - ((routeProgress - 60) * 7.5)}px`
                      : `${140 - ((routeProgress - 80) * 0.5)}px`,
                    transition: 'all 1s linear'
                  }}
                >
                  {/* Efecto de pulso dinámico */}
                  <div className="absolute w-16 h-16 bg-blue-400 rounded-full opacity-25 animate-pulse" style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}></div>
                  <div className="absolute w-12 h-12 bg-blue-500 rounded-full opacity-20" style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite'}}></div>
                  
                  {/* Marcador del vehículo */}
                  <div className="relative w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full border-4 border-white shadow-2xl flex items-center justify-center z-10" style={{background: 'linear-gradient(135deg, #60A5FA, #1E40AF)'}}>
                    <Car className="text-white" size={16} />
                  </div>
                  
                  {/* Etiqueta de posición */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
                    Posición Actual
                  </div>
                </div>
              </div>

              {/* Leyenda mejorada */}
              <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-2xl z-20 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Leyenda</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full shadow-md flex items-center justify-center">
                      <AlertTriangle className="text-white" size={10} />
                    </div>
                    <span className="font-medium text-gray-700">Riesgo Alto</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full shadow-md flex items-center justify-center">
                      <AlertTriangle className="text-white" size={10} />
                    </div>
                    <span className="font-medium text-gray-700">Riesgo Medio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full shadow-md flex items-center justify-center">
                      <MapPin className="text-white" size={10} />
                    </div>
                    <span className="font-medium text-gray-700">Origen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-red-600 rounded-full shadow-md flex items-center justify-center">
                      <MapPin className="text-white" size={10} />
                    </div>
                    <span className="font-medium text-gray-700">Destino</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 rounded"></div>
                    <span className="font-medium text-gray-700">Ruta Segura</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-red-500 rounded" style={{ borderStyle: 'dashed' }}></div>
                    <span className="font-medium text-gray-700">Ruta Peligrosa</span>
                  </div>
                </div>
              </div>

              {/* Mensaje de ruta completada */}
              {routeProgress >= 100 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 rounded-lg">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm transform scale-100">
                    <div className="mb-4 flex justify-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="text-white" size={64} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">¡Ruta Completada!</h3>
                    <p className="text-gray-600 mb-6">Has llegado a tu destino de manera segura. Excelente conducción.</p>
                    <button
                      onClick={() => {
                        setRouteProgress(0);
                        setAlertedZones(new Set());
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
                    >
                      Iniciar Nueva Ruta
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                    alert.risk === 'high' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{alert.zone}</p>
                        <p className="text-sm text-gray-600">{alert.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{alert.timestamp}</p>
                        {alert.action && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            alert.action === 'accepted' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
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
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'fleet' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
              }`}
            >
              <Car className="inline mr-2" size={20} />
              Flota
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'zones' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
              }`}
            >
              <MapPin className="inline mr-2" size={20} />
              Zonas de Riesgo
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'reports' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-600'
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
                <div className="relative bg-gradient-to-br from-green-100 via-blue-50 to-green-50 rounded-lg h-96 overflow-hidden border-2 border-gray-300">
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }}></div>

                  {/* Roads network */}
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    <path d="M 10,350 Q 150,300 200,200 T 350,100 L 450,80" stroke="#666" strokeWidth="8" fill="none" opacity="0.3" />
                    <path d="M 50,250 Q 200,240 280,180 T 400,150" stroke="#666" strokeWidth="6" fill="none" opacity="0.2" />
                    <path d="M 100,100 L 300,150 L 400,250" stroke="#666" strokeWidth="6" fill="none" opacity="0.2" />
                  </svg>

                  <div className="absolute inset-0 p-4" style={{ zIndex: 2 }}>
                    {/* Risk Zones */}
                    {riskZones.filter(z => z.active).map((zone, idx) => {
                      const positions = [
                        { left: '25%', top: '30%' },
                        { left: '55%', top: '55%' },
                        { left: '70%', top: '25%' }
                      ];
                      return (
                        <div key={zone.id} className="absolute" style={positions[idx]}>
                          <div
                            className={`w-28 h-28 rounded-full ${
                              zone.risk === 'high' ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                            style={{ opacity: 0.35 }}
                          />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <AlertTriangle 
                              className={zone.risk === 'high' ? 'text-red-700' : 'text-orange-700'} 
                              size={28}
                            />
                            <div className="text-xs font-bold text-gray-800 mt-1 bg-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              {zone.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Fleet Vehicles */}
                    {fleet.map((vehicle, idx) => {
                      const positions = [
                        { left: '45%', top: '40%' },
                        { left: '65%', top: '30%' },
                        { left: '50%', top: '60%' }
                      ];
                      return (
                        <div
                          key={vehicle.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={positions[idx]}
                        >
                          {vehicle.status === 'En ruta' && (
                            <div className="absolute w-10 h-10 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                          )}
                          <div
                            className={`relative w-6 h-6 rounded-full border-3 border-white shadow-xl flex items-center justify-center ${
                              vehicle.status === 'En ruta' ? 'bg-green-600' : 'bg-gray-600'
                            }`}
                          >
                            <Car className="text-white" size={14} />
                          </div>
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap border-2 border-gray-200">
                            <div className="font-bold text-gray-800">{vehicle.vehicle}</div>
                            <div className="text-gray-600">{vehicle.driver}</div>
                            <div className={`font-semibold ${vehicle.status === 'En ruta' ? 'text-green-600' : 'text-gray-500'}`}>
                              {vehicle.speed} km/h
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-xl z-20">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="font-medium">En Ruta</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        <span className="font-medium">Parado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet List */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-4">Estado de Vehículos</h2>
                <div className="space-y-2">
                  {fleet.map(vehicle => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          vehicle.status === 'En ruta' ? 'bg-green-600' : 'bg-gray-600'
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          zone.risk === 'high' ? 'bg-red-100' : 'bg-orange-100'
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
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  alert.risk === 'high' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {alert.risk === 'high' ? 'Alto' : 'Medio'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {alert.action ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    alert.action === 'accepted'
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