import React from 'react';
import { MapPin, AlertTriangle, Navigation, LogOut, Bell, CheckCircle, XCircle, Car } from 'lucide-react';
import DangerMap from './DangerMap';

const DriverDashboard = ({
    currentUser,
    setCurrentUser,
    setCurrentView,
    alerts,
    routeProgress,
    showAlert,
    currentAlert,
    handleAcceptAlternative,
    handleRejectAlternative,
    submitFeedback
}) => {
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className={`relative z-[10000] bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${currentAlert.risk === 'high' ? 'border-4 border-red-500' : 'border-4 border-orange-500'
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

export default DriverDashboard;
