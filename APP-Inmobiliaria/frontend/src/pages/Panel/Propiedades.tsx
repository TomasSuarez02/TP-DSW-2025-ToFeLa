import { useState, useEffect } from "react";
import axios from "axios";

interface Propiedad {
  id: number;
  direccion: string;
  precio: number;
  estado: string;
  hora_desde?: string;
  hora_hasta?: string;
  tipoPropiedad?: { id: number; nombre: string };
  inmobiliaria?: { id: number; nombre: string };
}

interface TipoPropiedad {
  id: number;
  nombre: string;
}

interface Inmobiliaria {
  id: number;
  nombre: string;
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Propiedad | null>(null);

  const [formData, setFormData] = useState({
    direccion: "",
    precio: "",
    estado: "disponible",
    hora_desde: "",
    hora_hasta: "",
    tipoPropiedad: "",
    inmobiliaria: "",
  });

  const [tiposPropiedad, setTiposPropiedad] = useState<TipoPropiedad[]>([]);
  const [inmobiliarias, setInmobiliarias] = useState<Inmobiliaria[]>([]);

  // ---------------------------
  // Cargar datos
  // ---------------------------
  const fetchPropiedades = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/propiedades");
      setPropiedades(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar propiedades:", error);
      setLoading(false);
    }
  };

  const fetchDependencias = async () => {
    try {
      const [tipos, inmo] = await Promise.all([
        axios.get("http://localhost:3000/api/tipopropiedades"),
        axios.get("http://localhost:3000/api/inmobiliarias"),
      ]);
      setTiposPropiedad(tipos.data.data || []);
      setInmobiliarias(inmo.data.data || []);
    } catch (error) {
      console.error("Error al cargar dependencias:", error);
    }
  };

  useEffect(() => {
    fetchPropiedades();
    fetchDependencias();
  }, []);

  // ---------------------------
  // Handlers
  // ---------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        direccion: formData.direccion,
        precio: parseFloat(formData.precio),
        estado: formData.estado,
        hora_desde: formData.hora_desde,
        hora_hasta: formData.hora_hasta,
        tipoPropiedad: formData.tipoPropiedad ? parseInt(formData.tipoPropiedad) : undefined,
        inmobiliaria: formData.inmobiliaria ? parseInt(formData.inmobiliaria) : undefined,
      };

      if (editingProperty) {
        await axios.put(`http://localhost:3000/api/propiedades/${editingProperty.id}`, payload);
        alert("Propiedad actualizada correctamente");
      } else {
        await axios.post("http://localhost:3000/api/propiedades", payload);
        alert("Propiedad creada correctamente");
      }

      resetForm();
      fetchPropiedades();
    } catch (error) {
      console.error("Error al guardar propiedad:", error);
      alert("Error al guardar propiedad. Revisá la consola.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que querés eliminar esta propiedad?")) {
      try {
        await axios.delete(`http://localhost:3000/api/propiedades/${id}`);
        fetchPropiedades();
        alert("Propiedad eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar propiedad:", error);
        alert("Error al eliminar propiedad");
      }
    }
  };

  const handleEdit = (propiedad: Propiedad) => {
    setEditingProperty(propiedad);
    setFormData({
      direccion: propiedad.direccion || "",
      precio: propiedad.precio.toString(),
      estado: propiedad.estado || "disponible",
      hora_desde: propiedad.hora_desde || "",
      hora_hasta: propiedad.hora_hasta || "",
      tipoPropiedad: propiedad.tipoPropiedad?.id?.toString() || "",
      inmobiliaria: propiedad.inmobiliaria?.id?.toString() || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      direccion: "",
      precio: "",
      estado: "disponible",
      hora_desde: "",
      hora_hasta: "",
      tipoPropiedad: "",
      inmobiliaria: "",
    });
    setEditingProperty(null);
    setShowForm(false);
  };

  // ---------------------------
  // Utils
  // ---------------------------
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "reservada":
        return "bg-yellow-100 text-yellow-800";
      case "vendida":
        return "bg-gray-100 text-gray-800";
      case "alquilada":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-neutral-900">Gestión de Propiedades</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium"
        >
          {showForm ? "Cerrar" : "+ Nueva Propiedad"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-neutral-900">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Dirección *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Precio ($) *</label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Estado *</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              >
                <option value="disponible">Disponible</option>
                <option value="reservada">Reservada</option>
                <option value="vendida">Vendida</option>
                <option value="alquilada">Alquilada</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Tipo de Propiedad *</label>
              <select
                name="tipoPropiedad"
                value={formData.tipoPropiedad}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposPropiedad.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Inmobiliaria</label>
              <select
                name="inmobiliaria"
                value={formData.inmobiliaria}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              >
                <option value="">Sin inmobiliaria</option>
                {inmobiliarias.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Hora Desde *</label>
              <input
                type="time"
                name="hora_desde"
                value={formData.hora_desde}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Hora Hasta *</label>
              <input
                type="time"
                name="hora_hasta"
                value={formData.hora_hasta}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#dcc7af] hover:bg-[#d4b89e] rounded-lg font-medium text-neutral-900"
              >
                {editingProperty ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando propiedades...</div>
      ) : propiedades.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">No hay propiedades registradas</h3>
          <p className="text-neutral-500 mb-4">Agregá la primera propiedad</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-3 rounded-lg"
          >
            + Agregar Propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propiedades.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-md border p-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg text-neutral-900">#{p.id}</h3>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoColor(p.estado)}`}
                >
                  {p.estado.toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1 text-neutral-900">${p.precio.toLocaleString()}</div>
              <p className="text-sm text-neutral-600">📍 {p.direccion}</p>
              <p className="text-sm text-neutral-600">
                🏠 {p.tipoPropiedad?.nombre || "Sin tipo"}
              </p>ß
              {p.inmobiliaria && (
                <p className="text-sm text-neutral-600">🏢 {p.inmobiliaria.nombre}</p>
              )}
              <p className="text-sm text-neutral-600">
                🕐 {p.hora_desde} - {p.hora_hasta}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(p)}
                  className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 rounded-lg"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
