import { useEffect, useState } from 'react';
import axios from 'axios';

interface Visita {
  id: number;
  fecha_hora: string;
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  propiedad: {
    id: number;
    direccion: string;
    precio: number;
  };
}

export default function Visitas() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenAscendente, setOrdenAscendente] = useState(false);

  useEffect(() => {
    fetchVisitas();
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

  // Función simple para formatear fecha
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

  // Ordenar visitas por fecha
  const visitasOrdenadas = [...visitas].sort((a, b) => {
    const fechaA = new Date(a.fecha_hora).getTime();
    const fechaB = new Date(b.fecha_hora).getTime();
    return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
  });

  // Verificar si la visita ya pasó
  const visitaPasada = (fecha: string) => {
    return new Date(fecha) < new Date();
  };

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Gestión de Visitas</h2>
          <p className="text-neutral-600 mt-2">
            Total de visitas: {visitas.length}
          </p>
        </div>
        
        {/* Botón para ordenar */}
        <button
          onClick={() => setOrdenAscendente(!ordenAscendente)}
          className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
        >
          <span>📅</span>
          <span className='text-neutral-900'>{ordenAscendente ? 'Más antiguas primero' : 'Más recientes primero'}</span>
        </button>
      </div>

      {visitas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-neutral-600">No hay visitas agendadas</p>
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
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {visitasOrdenadas.map((visita) => {
                  const pasada = visitaPasada(visita.fecha_hora);
                  
                  return (
                    <tr 
                      key={visita.id} 
                      className={`hover:bg-neutral-50 transition-colors ${pasada ? 'bg-gray-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pasada 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {pasada ? '✓ Realizada' : '⏰ Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {visita.cliente?.nombre} {visita.cliente?.apellido}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {visita.cliente?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {visita.propiedad?.direccion || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {formatearFecha(visita.fecha_hora)}
                      </td>
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