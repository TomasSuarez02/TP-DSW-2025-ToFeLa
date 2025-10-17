import { useState, useEffect } from "react";
import axios from "axios";

interface Propiedad {
  id: number;
  direccion: string;
  precio: number;
  estado: string;
  hora_desde?: string;
  hora_hasta?: string;
  descripcion?: string;
  tipoPropiedad?: { id: number; nombre: string; descripcion?: string };
  imagenes?: { id: number; path: string }[];
}

interface TipoPropiedad {
  id: number;
  nombre: string;
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Propiedad | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");

  const [formData, setFormData] = useState({
    direccion: "",
    precio: "",
    estado: "disponible",
    descripcion: "",
    hora_desde: "",
    hora_hasta: "",
    tipoPropiedad: "",
  });

  const [tiposPropiedad, setTiposPropiedad] = useState<TipoPropiedad[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Cargar datos
  const fetchPropiedades = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/propiedades");
      setPropiedades(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar propiedades:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencias = async () => {
    try {
      const tipos = await axios.get("http://localhost:3000/api/tipopropiedades");
      setTiposPropiedad(tipos.data.data || []);
    } catch (error) {
      console.error("Error al cargar tipos de propiedad:", error);
    }
  };

  useEffect(() => {
    fetchPropiedades();
    fetchDependencias();
  }, []);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    selectedImages.forEach(img => {
      URL.revokeObjectURL(URL.createObjectURL(img));
    });
    
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        direccion: formData.direccion,
        precio: parseFloat(formData.precio),
        estado: formData.estado,
        descripcion: formData.descripcion || undefined,
        hora_desde: formData.hora_desde,
        hora_hasta: formData.hora_hasta,
        tipoPropiedad: formData.tipoPropiedad
          ? parseInt(formData.tipoPropiedad)
          : undefined,
      };

      let propiedadId: number | null = null;

      if (editingProperty) {
        await axios.put(
          `http://localhost:3000/api/propiedades/${editingProperty.id}`,
          payload
        );
        propiedadId = editingProperty.id;
        alert("Propiedad actualizada correctamente");
      } else {
        const res = await axios.post("http://localhost:3000/api/propiedades", payload);
        propiedadId = res.data.data.id;
        alert("Propiedad creada correctamente");

        // Subir imágenes correctamente con el formato que espera el backend
        if (selectedImages.length > 0) {
          for (const img of selectedImages) {
            // Convertir archivo a base64
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(img);
            });

            // Enviar con el formato correcto que espera el backend
            await axios.post("http://localhost:3000/api/imagenes", {
              propiedad: propiedadId,
              base64: base64,
              filename: `${Date.now()}-${img.name}` // nombre único
            });
          }
        }
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
      descripcion: propiedad.descripcion || "",
      hora_desde: propiedad.hora_desde || "",
      hora_hasta: propiedad.hora_hasta || "",
      tipoPropiedad: propiedad.tipoPropiedad?.id?.toString() || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    selectedImages.forEach(img => {
      URL.revokeObjectURL(URL.createObjectURL(img));
    });
    
    setFormData({
      direccion: "",
      precio: "",
      estado: "disponible",
      descripcion: "",
      hora_desde: "",
      hora_hasta: "",
      tipoPropiedad: "",
    });
    setSelectedImages([]);
    setEditingProperty(null);
    setShowForm(false);
  };

  // Utils
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "reservada":
        return "bg-yellow-100 text-yellow-800";
      case "alquilada":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filtrado
  const propiedadesFiltradas =
    estadoFiltro === "todos"
      ? propiedades
      : propiedades.filter(
          (p) => p.estado.toLowerCase() === estadoFiltro.toLowerCase()
        );

  // Render
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-3xl font-semibold text-neutral-900">
          Gestión de Propiedades
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-800">
            Filtrar por estado:
          </label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border border-[#e5d8c2] rounded-lg px-3 py-2 bg-[#fffdf9] text-[#1a1a1a] focus:ring-2 focus:ring-[#d4b89e]"
          >
            <option value="todos">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="reservada">Reservada</option>
            <option value="alquilada">Alquilada</option>
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium"
          >
            {showForm ? "Cerrar" : "+ Nueva Propiedad"}
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-neutral-900">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Campos existentes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Dirección *
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Precio ($) *
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
              >
                <option value="disponible">Disponible</option>
                <option value="reservada">Reservada</option>
                <option value="alquilada">Alquilada</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Tipo de Propiedad *
              </label>
              <select
                name="tipoPropiedad"
                value={formData.tipoPropiedad}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposPropiedad.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Hora Desde *
              </label>
              <input
                type="time"
                name="hora_desde"
                value={formData.hora_desde}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Hora Hasta *
              </label>
              <input
                type="time"
                name="hora_hasta"
                value={formData.hora_hasta}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a] resize-none"
                placeholder="Describe las características de esta propiedad..."
              />
            </div>

            <div className="col-span-2">
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Imágenes de la propiedad
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
              />
              {selectedImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {selectedImages.map((img, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(img)}
                      alt={`img-${i}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-[#e5d8c2] rounded-lg text-[#1a1a1a]"
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
        <div className="text-center py-10 text-neutral-600">
          Cargando propiedades...
        </div>
      ) : propiedadesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">
            No hay propiedades registradas
          </h3>
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
          {propiedadesFiltradas.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-md border p-4"
            >
              {/* Imagen principal de la propiedad */}
              {p.imagenes && p.imagenes.length > 0 && (
                <div className="mb-3">
                  <img
                    src={`http://localhost:3000/images/${p.imagenes[0].path.split('/').pop()}`}
                    alt="Imagen propiedad"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  #{p.id}
                </h3>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoColor(
                    p.estado
                  )}`}
                >
                  {p.estado.toUpperCase()}
                </span>
              </div>

              <div className="text-2xl font-bold mb-1 text-neutral-900">
                ${p.precio.toLocaleString()}
              </div>
              <p className="text-sm text-neutral-600">📍 {p.direccion}</p>
              <p className="text-sm text-neutral-600">
                🏠 {p.tipoPropiedad?.nombre || "Sin tipo"}
              </p>
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
