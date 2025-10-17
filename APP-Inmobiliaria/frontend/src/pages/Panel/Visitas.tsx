import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

interface Visita {
  id: number;
  fecha_hora: string;
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  propiedad: {
    id: number;
    direccion: string;
    precio: number;
  };
}

type FiltroVisitas = 'todas' | 'hoy' | 'pendientes' | 'pasadas';

export default function Visitas() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenAscendente, setOrdenAscendente] = useState(false);
  const [filtro, setFiltro] = useState<FiltroVisitas>('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchVisitas();
    // Actualizar cada 30 segundos para visitas en tiempo real
    const interval = setInterval(fetchVisitas, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVisitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3000/api/visitas');
      const data = response.data?.data ?? response.data;
      setVisitas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching visitas:', err);
      setError('Error al cargar las visitas');
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  };


  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const año = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${año} - ${horas}:${minutos}`;
    } catch {
      return fecha;
    }
  };

  
  const visitaPasada = (fecha: string) => {
    return new Date(fecha) < new Date();
  };

  const esHoy = (fecha: string) => {
    const hoy = new Date();
    const fechaVisita = new Date(fecha);
    return (
      fechaVisita.getDate() === hoy.getDate() &&
      fechaVisita.getMonth() === hoy.getMonth() &&
      fechaVisita.getFullYear() === hoy.getFullYear()
    );
  };

  const proximaVisita = (fecha: string) => {
    const ahora = new Date();
    const fechaVisita = new Date(fecha);
    const diff = fechaVisita.getTime() - ahora.getTime();
    return diff > 0 && diff <= 3600000; // Próxima hora
  };

  // Filtrar y ordenar visitas
  const visitasFiltradas = useMemo(() => {
    let resultado = [...visitas];

    // Filtrar por búsqueda
    if (busqueda) {
      resultado = resultado.filter(v =>
        v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.cliente?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.propiedad?.direccion?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtrar por tipo
    switch (filtro) {
      case 'hoy':
        resultado = resultado.filter(v => esHoy(v.fecha_hora));
        break;
      case 'pendientes':
        resultado = resultado.filter(v => !visitaPasada(v.fecha_hora));
        break;
      case 'pasadas':
        resultado = resultado.filter(v => visitaPasada(v.fecha_hora));
        break;
    }

    // Ordenar
    resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha_hora).getTime();
      const fechaB = new Date(b.fecha_hora).getTime();
      return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
    });

    return resultado;
  }, [visitas, busqueda, filtro, ordenAscendente]);

  // Estadísticas
  const stats = useMemo(() => {
    const ahora = new Date();
    return {
      total: visitas.length,
      hoy: visitas.filter(v => esHoy(v.fecha_hora)).length,
      pendientes: visitas.filter(v => new Date(v.fecha_hora) >= ahora).length,
      proximas: visitas.filter(v => proximaVisita(v.fecha_hora)).length,
    };
  }, [visitas]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-600">Cargando visitas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchVisitas}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-neutral-900">Gestión de Visitas</h2>
        <p className="text-neutral-600 mt-2">Administra y organiza las visitas a propiedades</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-neutral-600 mb-1">Total Visitas</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-neutral-600 mb-1">Hoy</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.hoy}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-neutral-600 mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-green-600">{stats.pendientes}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <p className="text-sm text-neutral-600 mb-1">Próximas (1h)</p>
          <p className="text-3xl font-bold text-red-600">{stats.proximas}</p>
        </div>
      </div>

      {/* Alertas para visitas próximas */}
      {stats.proximas > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="text-red-800 font-semibold">
                ¡Atención! Tienes {stats.proximas} visita{stats.proximas > 1 ? 's' : ''} en la próxima hora
              </p>
              <p className="text-red-600 text-sm">Revisa la agenda y prepara las propiedades</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              🔍 Buscar visita
            </label>
            <input
              type="text"
              placeholder="Cliente o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
            />
          </div>

          {/* Filtros rápidos */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              📋 Filtro rápido
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'todas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro('hoy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'hoy'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setFiltro('pendientes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'pendientes'
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFiltro('pasadas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'pasadas'
                    ? 'bg-gray-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Pasadas
              </button>
            </div>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Mostrando <strong>{visitasFiltradas.length}</strong> de <strong>{visitas.length}</strong> visitas
          </p>
          <button
            onClick={() => setOrdenAscendente(!ordenAscendente)}
            className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-sm"
          >
            <span>📅</span>
            <span className="text-neutral-900">
              {ordenAscendente ? 'Más antiguas primero' : 'Más recientes primero'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabla de visitas */}
      {visitasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-neutral-600 text-lg">
            {busqueda || filtro !== 'todas'
              ? 'No se encontraron visitas con los filtros aplicados'
              : 'No hay visitas agendadas'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {visitasFiltradas.map((visita) => {
                  const pasada = visitaPasada(visita.fecha_hora);
                  const hoy = esHoy(visita.fecha_hora);
                  const proxima = proximaVisita(visita.fecha_hora);

                  return (
                    <tr
                      key={visita.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        proxima ? 'bg-red-50' : pasada ? 'bg-gray-50' : hoy ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            proxima
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : pasada
                              ? 'bg-gray-200 text-gray-700'
                              : hoy
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {proxima ? '🔴 ¡PRÓXIMA!' : pasada ? '✓ Realizada' : hoy ? '📍 Hoy' : '⏰ Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-neutral-900">
                          {formatearFecha(visita.fecha_hora)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {visita.cliente?.apellido}, {visita.cliente?.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">{visita.cliente?.email || 'N/A'}</div>
                        {visita.cliente?.telefono && (
                          <div className="text-xs text-neutral-500">📞 {visita.cliente.telefono}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">{visita.propiedad?.direccion || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                        ${visita.propiedad?.precio?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}