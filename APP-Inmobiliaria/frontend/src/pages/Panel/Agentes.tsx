import { useEffect, useState } from "react";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";
import { useAuth } from "../../auth/useAuth";
import {
  actualizarAgente,
  crearAgente,
  eliminarAgente,
  obtenerAgentes,
  type Agente,
} from "../../services/agentesInmobiliarios";

/**
 * Alta de agentes del backoffice.
 *
 * No hay registro público para este rol: la única forma de crear un agente es
 * que otro agente ya logueado lo cargue acá. Antes de esta pantalla, la única
 * forma de hacerlo era pegándole a la API directamente con curl.
 */
export default function Agentes() {
  const { userId } = useAuth();

  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    mail: "",
    telefono: "",
    tipo_doc: "",
    nro_doc: "",
    fecha_ingreso: new Date().toISOString().slice(0, 10),
    contrasenia: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fetchAgentes = async () => {
    try {
      setLoading(true);
      setAgentes(await obtenerAgentes());
    } catch (error) {
      console.error("Error al cargar agentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      mail: "",
      telefono: "",
      tipo_doc: "",
      nro_doc: "",
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      contrasenia: "",
    });
    setEditingAgente(null);
    setShowForm(false);
    setSubmitError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    // Al editar, la contraseña es opcional: si se deja vacía, se mantiene la actual.
    if (!editingAgente && !formData.contrasenia.trim()) {
      setFieldErrors({ contrasenia: "La contraseña es obligatoria" });
      setSubmitError("Completá los campos obligatorios");
      return;
    }

    // Sin este guard, dos clicks seguidos dan de alta el agente dos veces.
    setGuardando(true);
    try {
      if (editingAgente) {
        await actualizarAgente(editingAgente.id, formData);
        alert("Agente actualizado correctamente");
      } else {
        await crearAgente(formData);
        alert("Agente creado correctamente");
      }
      resetForm();
      fetchAgentes();
    } catch (error) {
      console.error("Error al guardar agente:", error);
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = (agente: Agente) => {
    setEditingAgente(agente);
    setFormData({
      nombre: agente.nombre,
      apellido: agente.apellido,
      mail: agente.mail,
      telefono: agente.telefono,
      tipo_doc: agente.tipo_doc,
      nro_doc: String(agente.nro_doc),
      fecha_ingreso: agente.fecha_ingreso ? agente.fecha_ingreso.slice(0, 10) : "",
      contrasenia: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (agente: Agente) => {
    if (agente.id === userId) {
      alert("No podés eliminar tu propia cuenta.");
      return;
    }
    if (!confirm(`¿Eliminar a ${agente.nombre} ${agente.apellido}?`)) return;
    try {
      await eliminarAgente(agente.id);
      fetchAgentes();
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-900">Gestión de Agentes</h2>
          <p className="text-neutral-600 text-sm mt-1">
            Altas y bajas del personal con acceso al panel de administración.
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium"
        >
          {showForm ? "Cerrar" : "+ Nuevo Agente"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-neutral-900">
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submitError && (
              <div className="col-span-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {submitError}
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Nombre *</label>
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
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Apellido *</label>
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
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Email *</label>
              <input
                type="email"
                name="mail"
                value={formData.mail}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.mail ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.mail && <p className="mt-1 text-sm text-red-600">{fieldErrors.mail}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Teléfono *</label>
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
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Tipo de Documento *</label>
              <select
                name="tipo_doc"
                value={formData.tipo_doc}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.tipo_doc ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              >
                <option value="">Seleccionar tipo...</option>
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
              {fieldErrors.tipo_doc && <p className="mt-1 text-sm text-red-600">{fieldErrors.tipo_doc}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Número de Documento *</label>
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

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Fecha de ingreso *</label>
              <input
                type="date"
                name="fecha_ingreso"
                value={formData.fecha_ingreso}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.fecha_ingreso ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.fecha_ingreso && <p className="mt-1 text-sm text-red-600">{fieldErrors.fecha_ingreso}</p>}
            </div>

            <div className="col-span-2">
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">
                Contraseña {editingAgente ? "" : "*"}
              </label>
              <input
                type="password"
                name="contrasenia"
                value={formData.contrasenia}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.contrasenia ? "border-red-400" : "border-[#e5d8c2]"}`}
                required={!editingAgente}
                placeholder={editingAgente ? "Dejar vacío para mantener la contraseña actual" : ""}
              />
              {fieldErrors.contrasenia && <p className="mt-1 text-sm text-red-600">{fieldErrors.contrasenia}</p>}
            </div>

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
                disabled={guardando}
                className="px-6 py-2 bg-[#dcc7af] hover:bg-[#d4b89e] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg font-medium text-neutral-900"
              >
                {guardando ? "Guardando…" : editingAgente ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando agentes…</div>
      ) : agentes.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">No hay agentes registrados</h3>
          <p className="text-neutral-500 mb-4">Agregá el primer agente</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-3 rounded-lg"
          >
            + Agregar Agente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentes.map((agente) => {
            const esUnoMismo = agente.id === userId;
            return (
              <div key={agente.id} className="bg-white rounded-xl shadow-md border p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-neutral-900">
                    {agente.nombre} {agente.apellido}
                  </h3>
                  {esUnoMismo && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f2e5d8] text-neutral-800">Vos</span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-neutral-600">📧 {agente.mail}</p>
                  <p className="text-sm text-neutral-600">📱 {agente.telefono}</p>
                  <p className="text-sm text-neutral-600">
                    {agente.tipo_doc.toUpperCase()} {agente.nro_doc}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(agente)}
                    className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 rounded-lg text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(agente)}
                    disabled={esUnoMismo}
                    title={esUnoMismo ? "No podés eliminar tu propia cuenta" : undefined}
                    className="flex-1 bg-red-100 hover:bg-red-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed text-red-800 py-2 rounded-lg text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
