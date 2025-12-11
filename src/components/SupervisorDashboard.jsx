import React, { useState } from 'react';
import { MapPin, AlertTriangle, Users, Settings, FileText, LogOut, Bell, TrendingUp, Car } from 'lucide-react';
import DangerMap from './DangerMap';

const SupervisorDashboard = ({
    currentUser,
    setCurrentUser,
    setCurrentView,
    fleet,
    alerts,
    riskZones,
    setRiskZones,
    feedback
}) => {
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

export default SupervisorDashboard;
