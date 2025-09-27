import { useState, useEffect } from 'react';
import axios from 'axios';

interface Propiedad {
  id: number;
  direccion: string;
  precio: number;
  estado: string;
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Propiedad | null>(null);
  
  // Estado del formulario simplificado
  const [formData, setFormData] = useState({
    direccion: '',
    precio: '',
    estado: 'disponible'
  });

  // Cargar propiedades
  const fetchPropiedades = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/propiedades');
      setPropiedades(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropiedades();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar propiedad (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const propertyData = {
        direccion: formData.direccion,
        precio: parseFloat(formData.precio),
        estado: formData.estado
      };

      if (editingProperty) {
        // Editar
        await axios.put(`http://localhost:3000/api/propiedades/${editingProperty.id}`, propertyData);
      } else {
        // Crear nueva
        await axios.post('http://localhost:3000/api/propiedades', propertyData);
      }

      // Resetear formulario y recargar
      resetForm();
      fetchPropiedades();
      
      alert(`Propiedad ${editingProperty ? 'actualizada' : 'creada'} exitosamente!`);
    } catch (error) {
      console.error('Error al guardar propiedad:', error);
      alert('Error al guardar la propiedad. Revisa la consola.');
    }
  };

  // Eliminar propiedad
  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta propiedad?')) {
      try {
        await axios.delete(`http://localhost:3000/api/propiedades/${id}`);
        fetchPropiedades();
        alert('Propiedad eliminada exitosamente!');
      } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        alert('Error al eliminar la propiedad.');
      }
    }
  };

  // Editar propiedad
  const handleEdit = (propiedad: Propiedad) => {
    setEditingProperty(propiedad);
    setFormData({
      direccion: propiedad.direccion || '',
      precio: propiedad.precio.toString(),
      estado: propiedad.estado || 'disponible'
    });
    setShowForm(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      direccion: '',
      precio: '',
      estado: 'disponible'
    });
    setEditingProperty(null);
    setShowForm(false);
  };

  // Estado color
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'reservada': return 'bg-yellow-100 text-yellow-800';
      case 'vendida': return 'bg-gray-100 text-gray-800';
      case 'alquilada': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header de la sección */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-neutral-900 tracking-wide">
          Gestión de Propiedades
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium transition-colors tracking-wide"
        >
          + Nueva Propiedad
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">Cargando propiedades...</div>
        </div>
      )}

      {/* Lista de Propiedades */}
      {!loading && !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propiedades.map((propiedad) => (
            <div key={propiedad.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-neutral-100">
              {/* Header de la card */}
              <div className="bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af] p-4">
                <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                  Propiedad #{propiedad.id}
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(propiedad.estado)}`}>
                  {propiedad.estado.toUpperCase()}
                </span>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="text-2xl font-bold text-neutral-900">
                    ${propiedad.precio?.toLocaleString()}
                  </div>
                  <div className="text-sm text-neutral-600">
                    📍 {propiedad.direccion}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(propiedad)}
                    className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(propiedad.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje si no hay propiedades */}
      {!loading && !showForm && propiedades.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-medium text-neutral-700 mb-2">
            No hay propiedades registradas
          </h3>
          <p className="text-neutral-500 mb-6">
            Comienza agregando tu primera propiedad
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Agregar Primera Propiedad
          </button>
        </div>
      )}

      {/* Formulario Modal - SIMPLIFICADO */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header del modal */}
            <div className="bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af] p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-900 tracking-wide">
                  {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-neutral-600 hover:text-neutral-900 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#dcc7af] focus:border-transparent text-neutral-900"
                  required
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Precio ($) *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#dcc7af] focus:border-transparent text-neutral-900"
                  required
                  placeholder="250000"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Estado *
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#dcc7af] focus:border-transparent text-neutral-900"
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alquilada">Alquilada</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingProperty ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
