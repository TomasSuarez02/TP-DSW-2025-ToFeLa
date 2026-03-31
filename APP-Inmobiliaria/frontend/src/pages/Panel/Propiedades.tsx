import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";

export interface Propiedad {
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

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Senia {
  id?: number;
  idPropiedad?: number;
  idCliente?: number;
  propiedad?: number;
  cliente?: number;
  importe?: number;
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Propiedad | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [open, setOpen] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Propiedad | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [importe, setImporte] = useState<number | null>(null);
  // estado para la seña (no guardamos el objeto aquí antes de enviarlo)


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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Cargar datos
  const fetchPropiedades = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/propiedades");
      setPropiedades(res.data.data || []);
      console.log("Propiedades cargadas:", res.data.data);
    } catch (error) {
      console.error("Error al cargar propiedades:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/clientes");
      setClientes(res.data.data || []);
      console.log("Clientes cargados:", res.data.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      // No forzar re-render de loading aquí si ya fue manejado por fetchPropiedades
      setLoading(false);
    }
  }, []);

  const fetchDependencias = useCallback(async () => {
    try {
      const tipos = await axios.get("http://localhost:3000/api/tipopropiedades");
      setTiposPropiedad(tipos.data.data || []);
      console.log("Tipos de propiedad cargados:", tipos.data.data);
    } catch (error) {
      console.error("Error al cargar tipos de propiedad:", error);
    }
  }, []);

  // useEffect con dependencias estables — se ejecutará una vez al montar
  useEffect(() => {
    fetchPropiedades();
    fetchDependencias();
  }, [fetchPropiedades, fetchDependencias]);

  // Cargar clientes sólo cuando se abra el modal; fetchClientes está memoizado
  useEffect(() => {
    if (open) fetchClientes();
  }, [open, fetchClientes]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
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
    setSubmitError(null);
    setFieldErrors({});
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
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
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
        alert("Error al eliminar propiedad, tiene una seña o visita asociada");
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

  const seniaPost = useCallback(async (data: Senia | null) => {
    if (!data) return;

    // intentar obtener id de propiedad desde distintos posibles campos
    const d = data as Partial<Senia>;
    const propiedadId = d.propiedad ?? d.idPropiedad ?? null;

    // validar que el importe no supere el precio de la propiedad
    if (propiedadId && d.importe != null) {
      // buscar en la lista local primero
      let prop = propiedades.find((p) => p.id === Number(propiedadId));
      if (!prop) {
        // intentar traer la propiedad puntual
        try {
          const resp = await axios.get(`http://localhost:3000/api/propiedades/${propiedadId}`);
          prop = resp.data.data;
        } catch (err) {
          console.warn('No se pudo cargar la propiedad para validación del importe', err);
        }
      }

      if (prop && typeof prop.precio === 'number') {
        if ((d.importe as number) > prop.precio) {
          alert(`El importe de la seña no puede ser mayor que el precio de la propiedad (${prop.precio}).`);
          return;
        }
      }
    }

    try {
      const res = await axios.post('http://localhost:3000/api/senias', data);
      console.log('Senia guardada:', res.data);
      alert('Alquiler señado con éxito');

      if (propiedadId) {
        try {
          await axios.put(`http://localhost:3000/api/propiedades/${propiedadId}`, { estado: 'reservada' });
          fetchPropiedades();
        } catch (err) {
          console.error('Error actualizando estado de propiedad', err);
        }
      }

      setOpen(false);
    } catch (err) {
      console.error('Error señando alquiler', err);
      alert('No se pudo agendar la visita');
    }
  }, [fetchPropiedades, propiedades]);

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
    setSubmitError(null);
    setFieldErrors({});
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
            noValidate
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {submitError && (
              <div className="col-span-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {submitError}
              </div>
            )}
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
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.direccion ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.direccion && <p className="mt-1 text-sm text-red-600">{fieldErrors.direccion}</p>}
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
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.precio ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.precio && <p className="mt-1 text-sm text-red-600">{fieldErrors.precio}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.estado ? "border-red-400" : "border-[#e5d8c2]"}`}
              >
                <option value="disponible">Disponible</option>
                <option value="reservada">Reservada</option>
                <option value="alquilada">Alquilada</option>
              </select>
              {fieldErrors.estado && <p className="mt-1 text-sm text-red-600">{fieldErrors.estado}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Tipo de Propiedad *
              </label>
              <select
                name="tipoPropiedad"
                value={formData.tipoPropiedad}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.tipoPropiedad ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposPropiedad.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              {fieldErrors.tipoPropiedad && <p className="mt-1 text-sm text-red-600">{fieldErrors.tipoPropiedad}</p>}
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
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.hora_desde ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.hora_desde && <p className="mt-1 text-sm text-red-600">{fieldErrors.hora_desde}</p>}
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
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.hora_hasta ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.hora_hasta && <p className="mt-1 text-sm text-red-600">{fieldErrors.hora_hasta}</p>}
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
                <button
                  onClick={() => {
                    // No abrir modal si la propiedad ya está reservada o alquilada
                    const estado = p.estado?.toLowerCase() ?? '';
                    if (estado === 'reservada' || estado === 'alquilada') {
                      alert('No se puede señar: la propiedad ya está reservada o alquilada.');
                      return;
                    }

                    console.log('Open modal click');
                    setSelectedProperty(p);
                    setOpen(true);
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-controls="property-modal"
                  className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-600 py-2 rounded-lg"
                >
                  Señar
                </button>
              </div>
            </div>
          ))}
        </div>

        
      )}

      {/* Modal único para señar propiedad (fuera del map) */}
      {open && selectedProperty && (
        <div className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center">
          {/* Fondo semitransparente */}
          <div
            className="fixed inset-0 bg-[#f5f2ed] bg-opacity-95 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setSelectedProperty(null);
              setCliente(null);
              setImporte(null);
            }}
          />

          {/* Contenedor principal del modal */}
          <div className="relative m-4 p-4 w-11/12 max-w-3xl rounded-lg bg-white shadow-sm z-10">
            {/* Título */}
            <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800">
              Señar propiedad
            </div>

            {/* Cuerpo */}
            <div className="relative border-t border-slate-200 py-4 leading-normal text-slate-600 font-light">
              {/* Propiedad */}
              <label htmlFor="propiedad" className="block">
                Propiedad
              </label>
              <input
                id="propiedad"
                type="text"
                readOnly
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm 
                          focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={selectedProperty.direccion}
              />

              {/* Cliente */}
              <label htmlFor="cliente" className="block mt-4">
                Cliente
              </label>
              <select
                id="cliente"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm 
                          focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={cliente?.id ?? ''}
                onChange={(e) => setCliente(clientes.find(c => c.id === Number(e.target.value)) || null)}
              >
                {clientes.length === 0 ? (
                  <option>No hay clientes disponibles</option>
                ) : (
                  <>
                    <option value="" disabled>
                      Elegí un cliente
                    </option>
                    {clientes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.apellido}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <label htmlFor="importe" className="block mt-4">
                Importe
              </label>
              <input
                type="number"
                id="importe"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                value={importe ?? ''}
                onChange={(e) => setImporte(e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>

            {/* Botones */}
            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  setSelectedProperty(null);
                  setCliente(null);
                  setImporte(null);
                }}
                className="rounded-md border border-transparent py-2 px-4 text-center text-sm 
                          text-slate-600 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 
                          disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="button"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (!clientes.length || !cliente) {
                    alert('Selecciona un cliente.');
                    return;
                  }

                  const data: Senia = {
                    propiedad: selectedProperty.id,
                    cliente: cliente.id,
                    importe: Number(importe)
                  };

                  seniaPost(data);
                }}
                className="ml-2 rounded-md bg-green-600 py-2 px-4 border border-transparent text-center text-sm 
                          text-white transition-all shadow-md hover:shadow-lg focus:bg-green-700 focus:shadow-none 
                          active:bg-green-700 hover:bg-green-700 active:shadow-none 
                          disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="button"
              >
                Señar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
