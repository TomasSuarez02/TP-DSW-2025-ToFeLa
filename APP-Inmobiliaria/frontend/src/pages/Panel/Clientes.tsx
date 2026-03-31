import { useState, useEffect } from "react";
import axios from "axios";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";

interface TipoDocumentacion {
  id: number;
  nombre: string;
  descripcion: string;
  fechaVencimiento: string;
}

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipo_documento: string;
  nro_doc: string;
  documentaciones?: TipoDocumentacion[];
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState<string>("todos");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    tipo_documento: "",
    nro_doc: "",
    password: "",
  });

  const [tiposDocumentacion, setTiposDocumentacion] = useState<TipoDocumentacion[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Cargar datos
  const fetchClientes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/clientes");
      setClientes(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencias = async () => {
    try {
      const tipos = await axios.get("http://localhost:3000/api/tipodocumentaciones");
      setTiposDocumentacion(tipos.data.data || []);
    } catch (error) {
      console.error("Error al cargar tipos de documentación:", error);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchDependencias();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    try {
      const basePayload = {
        nombre: String(formData.nombre ?? "").trim(),
        apellido: String(formData.apellido ?? "").trim(),
        email: String(formData.email ?? "").trim(),
        telefono: String(formData.telefono ?? "").trim(),
        tipo_documento: String(formData.tipo_documento ?? "").trim(),
        nro_doc: String(formData.nro_doc ?? "").trim(),
      };

      const payload =
        editingCliente && !formData.password.trim()
          ? basePayload
          : { ...basePayload, password: formData.password };

      if (editingCliente) {
        await axios.put(
          `http://localhost:3000/api/clientes/${editingCliente.id}`,
          payload
        );
        alert("Cliente actualizado correctamente");
      } else {
        await axios.post("http://localhost:3000/api/clientes", payload);
        alert("Cliente creado correctamente");
      }

      resetForm();
      fetchClientes();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que querés eliminar este cliente?")) {
      try {
        await axios.delete(`http://localhost:3000/api/clientes/${id}`);
        fetchClientes();
        alert("Cliente eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Error al eliminar cliente");
      }
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: String(cliente.nombre ?? ""),
      apellido: String(cliente.apellido ?? ""),
      email: String(cliente.email ?? ""),
      telefono: String(cliente.telefono ?? ""),
      tipo_documento: String(cliente.tipo_documento ?? ""),
      nro_doc: String(cliente.nro_doc ?? ""),
      password: "", 
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      tipo_documento: "",
      nro_doc: "",
      password: "",
    });
    setEditingCliente(null);
    setShowForm(false);
    setSubmitError(null);
    setFieldErrors({});
  };

  // Utils
  const getTipoDocumentoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "dni":
        return "bg-blue-100 text-blue-800";
      case "pasaporte":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filtrado
  const clientesFiltrados =
    tipoDocumentoFiltro === "todos"
      ? clientes
      : clientes.filter(
          (c) => c.tipo_documento.toLowerCase() === tipoDocumentoFiltro.toLowerCase()
        );

  // Render
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-3xl font-semibold text-neutral-900">
          Gestión de Clientes
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-800">
            Filtrar por documento:
          </label>
          <select
            value={tipoDocumentoFiltro}
            onChange={(e) => setTipoDocumentoFiltro(e.target.value)}
            className="border border-[#e5d8c2] rounded-lg px-3 py-2 bg-[#fffdf9] text-[#1a1a1a] focus:ring-2 focus:ring-[#d4b89e]"
          >
            <option value="todos">Todos</option>
            {tiposDocumentacion.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre.toLowerCase()}>
                {tipo.nombre}
              </option>
            ))}
            {tiposDocumentacion.length === 0 && (
              <>
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
              </>
            )}
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium"
          >
            {showForm ? "Cerrar" : "+ Nuevo Cliente"}
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
            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.nombre ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.nombre && <p className="mt-1 text-sm text-red-600">{fieldErrors.nombre}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.apellido ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.apellido && <p className="mt-1 text-sm text-red-600">{fieldErrors.apellido}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.email ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.telefono ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.telefono && <p className="mt-1 text-sm text-red-600">{fieldErrors.telefono}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Tipo de Documento *
              </label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.tipo_documento ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposDocumentacion.map((tipo) => (
                  <option key={tipo.id} value={tipo.nombre.toLowerCase()}>
                    {tipo.nombre}
                  </option>
                ))}
                {tiposDocumentacion.length === 0 && (
                  <>
                    <option value="dni">DNI</option>
                    <option value="pasaporte">Pasaporte</option>
                  </>
                )}
              </select>
              {fieldErrors.tipo_documento && <p className="mt-1 text-sm text-red-600">{fieldErrors.tipo_documento}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Número de Documento *
              </label>
              <input
                type="text"
                name="nro_doc"
                value={formData.nro_doc}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.nro_doc ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.nro_doc && <p className="mt-1 text-sm text-red-600">{fieldErrors.nro_doc}</p>}
            </div>

            {!editingCliente && (
              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.password ? "border-red-400" : "border-[#e5d8c2]"}`}
                  required={!editingCliente}
                  placeholder={editingCliente ? "Dejar vacío para mantener contraseña actual" : ""}
                />
                {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
              </div>
            )}

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
                {editingCliente ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-10 text-neutral-600">
          Cargando clientes...
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">
            No hay clientes registrados
          </h3>
          <p className="text-neutral-500 mb-4">Agregá el primer cliente</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-3 rounded-lg"
          >
            + Agregar Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-xl shadow-md border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-neutral-900">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <span className="text-sm text-neutral-500">#{cliente.id}</span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-neutral-600">
                  📧 {cliente.email}
                </p>
                <p className="text-sm text-neutral-600">
                  📱 {cliente.telefono}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoDocumentoColor(
                      cliente.tipo_documento
                    )}`}
                  >
                    {cliente.tipo_documento.toUpperCase()}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {cliente.nro_doc}
                  </span>
                </div>
                {cliente.documentaciones && cliente.documentaciones.length > 0 && (
                  <p className="text-sm text-neutral-600">
                    📄 {cliente.documentaciones.length} documentos
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(cliente)}
                  className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 rounded-lg text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg text-sm font-medium"
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