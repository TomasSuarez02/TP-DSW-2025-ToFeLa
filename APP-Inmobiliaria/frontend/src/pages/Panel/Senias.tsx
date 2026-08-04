import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";
import {
  actualizarEstadoSenia,
  cancelarSenia,
  eliminarSenia,
  liberarPropiedad,
  marcarPropiedadAlquilada,
  obtenerMisSenias,
  obtenerSenias,
} from "../../services/senias";
import { diasRestantes, formatearFecha, formatearMoneda } from "../../config/senia";
import {
  ESTILOS_ESTADO_SENIA,
  ETIQUETAS_ESTADO_SENIA,
  refId,
  refObjeto,
  type ClienteRef,
  type EstadoSenia,
  type PropiedadRef,
  type Senia,
} from "../../types/senia";

interface SeniasProps {
  isAgent?: boolean;
}

type Filtro = 'todos' | EstadoSenia;

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'todos', nombre: 'Todas' },
  { id: 'pendiente_pago', nombre: 'Pendientes de pago' },
  { id: 'confirmada', nombre: 'Confirmadas' },
  { id: 'vencida', nombre: 'Vencidas' },
  { id: 'cancelada', nombre: 'Canceladas' },
];

export default function Senias({ isAgent = true }: SeniasProps) {
  const navigate = useNavigate();

  const [senias, setSenias] = useState<Senia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSenia, setEditingSenia] = useState<Senia | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const [formData, setFormData] = useState({
    propiedad: "",
    cliente: "",
    importe: "",
  });

  const [propiedades, setPropiedades] = useState<PropiedadRef[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fetchSenias = useCallback(async () => {
    try {
      setLoading(true);
      setSenias(isAgent ? await obtenerSenias() : await obtenerMisSenias());
    } catch (error) {
      console.error("Error al cargar señas:", error);
      setSenias([]);
    } finally {
      setLoading(false);
    }
  }, [isAgent]);

  const fetchPropiedades = useCallback(async () => {
    try {
      const res = await apiClient.get("/propiedades");
      setPropiedades(res.data?.data || []);
    } catch (err) {
      console.error("Error cargando propiedades:", err);
    }
  }, []);

  useEffect(() => {
    fetchSenias();
    // Solo cargamos propiedades en modo agente para alimentar el formulario
    if (isAgent) {
      fetchPropiedades();
    }
  }, [isAgent, fetchSenias, fetchPropiedades]);

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

    const requiredErrors: FieldErrors = {};
    if (!formData.propiedad.trim()) requiredErrors.propiedad = "La propiedad es obligatoria";
    if (!formData.cliente.trim()) requiredErrors.cliente = "El cliente es obligatorio";
    if (!formData.importe.trim()) requiredErrors.importe = "El importe es obligatorio";

    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setSubmitError("Completá los campos obligatorios");
      return;
    }

    const propiedadIdNum = Number(formData.propiedad) || refId(editingSenia?.propiedad);
    const propiedadPrecio =
      propiedades.find((p) => p.id === propiedadIdNum)?.precio ??
      refObjeto<PropiedadRef>(editingSenia?.propiedad)?.precio;

    const importeNum = Number(formData.importe);
    if (Number.isNaN(importeNum) || importeNum <= 0) {
      setFieldErrors({ importe: "El importe debe ser mayor a cero" });
      setSubmitError("Revisá los datos ingresados");
      return;
    }
    if (propiedadPrecio !== undefined && importeNum > propiedadPrecio) {
      setFieldErrors({ importe: `No puede superar el precio de la propiedad (${formatearMoneda(propiedadPrecio)})` });
      setSubmitError("Revisá los datos ingresados");
      return;
    }

    try {
      const payload = {
        propiedad: propiedadIdNum,
        cliente: Number(formData.cliente),
        importe: importeNum,
      };

      if (editingSenia?.clave) {
        await apiClient.put(`/senias/${editingSenia.clave}`, payload);
      } else {
        await apiClient.post("/senias", payload);
      }

      resetForm();
      fetchSenias();
    } catch (error) {
      console.error("Error al guardar seña:", error);
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    }
  };

  const handleDelete = async (senia: Senia) => {
    if (!confirm("¿Seguro que querés eliminar esta seña?")) return;

    try {
      await eliminarSenia(senia.clave);

      // Si la seña reservaba la propiedad, la volvemos a dejar disponible.
      const propiedadId = refId(senia.propiedad);
      if (propiedadId && senia.estado === 'confirmada') {
        try {
          await liberarPropiedad(propiedadId);
        } catch (err) {
          console.error("Error liberando la propiedad", err);
        }
      }

      fetchSenias();
    } catch (error) {
      console.error("Error al eliminar seña:", error);
      alert(parseApiError(error).message);
    }
  };

  const handleEdit = (s: Senia) => {
    setEditingSenia(s);
    setFormData({
      propiedad: String(refId(s.propiedad) ?? ""),
      cliente: String(refId(s.cliente) ?? ""),
      importe: s.importe?.toString() || "",
    });
    setShowForm(true);
  };

  /** El cliente va a la pasarela de pago para confirmar su seña. */
  const handleCompletarSenia = (clave: string) => {
    navigate(`/checkout/${clave}`);
  };

  const handleCancelar = async (senia: Senia) => {
    if (!confirm("¿Querés cancelar esta seña?")) return;
    try {
      await cancelarSenia(senia.clave);
      fetchSenias();
    } catch (error) {
      console.error("Error al cancelar la seña:", error);
      alert(parseApiError(error).message);
    }
  };

  /** El admin concreta el alquiler tras recibir papeles y saldo. */
  const handleMarcarAlquilada = async (senia: Senia) => {
    const propiedadId = refId(senia.propiedad);
    if (!propiedadId) return;
    if (!confirm("¿Confirmás que el cliente presentó la documentación y el saldo restante?")) return;

    try {
      await marcarPropiedadAlquilada(propiedadId);
      fetchSenias();
    } catch (error) {
      console.error("Error al marcar la propiedad como alquilada:", error);
      alert(parseApiError(error).message);
    }
  };

  const handleMarcarVencida = async (senia: Senia) => {
    if (!confirm("¿Marcar la seña como vencida y liberar la propiedad?")) return;
    try {
      await actualizarEstadoSenia(senia.clave, 'vencida');
      const propiedadId = refId(senia.propiedad);
      if (propiedadId) await liberarPropiedad(propiedadId);
      fetchSenias();
    } catch (error) {
      console.error("Error al vencer la seña:", error);
      alert(parseApiError(error).message);
    }
  };

  const resetForm = () => {
    setFormData({ propiedad: "", cliente: "", importe: "" });
    setEditingSenia(null);
    setShowForm(false);
    setSubmitError(null);
    setFieldErrors({});
  };

  const seniasVisibles = filtro === 'todos' ? senias : senias.filter((s) => s.estado === filtro);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {isAgent && (
          <h2 className="text-3xl font-semibold text-neutral-900">Gestión de Señas</h2>
        )}

        {senias.length > 0 && (
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            className="px-3 py-2 border border-[#e5d8c2] rounded-lg bg-white text-neutral-900"
            aria-label="Filtrar señas por estado"
          >
            {FILTROS.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Formulario (solo administración) */}
      {isAgent && showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-neutral-900">
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {submitError && (
              <div className="col-span-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {submitError}
              </div>
            )}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Propiedad *</label>
              {editingSenia ? (
                <input
                  type="text"
                  readOnly
                  value={refObjeto<PropiedadRef>(editingSenia.propiedad)?.direccion ?? `#${refId(editingSenia.propiedad) ?? ''}`}
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                />
              ) : (
                <input
                  type="number"
                  name="propiedad"
                  value={formData.propiedad}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.propiedad ? "border-red-400" : "border-[#e5d8c2]"}`}
                  required
                />
              )}
              {fieldErrors.propiedad && <p className="mt-1 text-sm text-red-600">{fieldErrors.propiedad}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Cliente *</label>
              {editingSenia ? (
                <input
                  type="text"
                  readOnly
                  value={nombreCliente(editingSenia.cliente)}
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                />
              ) : (
                <input
                  type="number"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.cliente ? "border-red-400" : "border-[#e5d8c2]"}`}
                  required
                />
              )}
              {fieldErrors.cliente && <p className="mt-1 text-sm text-red-600">{fieldErrors.cliente}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Importe *</label>
              <input
                type="number"
                name="importe"
                value={formData.importe}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-[#fffdf9] text-[#1a1a1a] ${fieldErrors.importe ? "border-red-400" : "border-[#e5d8c2]"}`}
                required
              />
              {fieldErrors.importe && <p className="mt-1 text-sm text-red-600">{fieldErrors.importe}</p>}
            </div>

            <div className="col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-[#e5d8c2] rounded-lg text-[#1a1a1a]">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-[#dcc7af] hover:bg-[#d4b89e] rounded-lg font-medium text-neutral-900">
                {editingSenia ? "Editar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de señas */}
      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando señas...</div>
      ) : seniasVisibles.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">
            {senias.length === 0 ? "No hay señas registradas" : "No hay señas con ese estado"}
          </h3>
          {isAgent && senias.length === 0 && <p className="text-neutral-500 mb-4">Creá la primera seña</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seniasVisibles.map((s) => (
            <TarjetaSenia
              key={s.clave}
              senia={s}
              isAgent={isAgent}
              onEditar={() => handleEdit(s)}
              onEliminar={() => handleDelete(s)}
              onCompletar={() => handleCompletarSenia(s.clave)}
              onCancelar={() => handleCancelar(s)}
              onMarcarAlquilada={() => handleMarcarAlquilada(s)}
              onMarcarVencida={() => handleMarcarVencida(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function nombreCliente(cliente?: number | ClienteRef): string {
  const obj = refObjeto<ClienteRef>(cliente);
  if (obj) {
    const nombre = `${obj.nombre ?? ''} ${obj.apellido ?? ''}`.trim();
    return nombre || obj.mail || `#${obj.id}`;
  }
  const id = refId(cliente);
  return id ? `#${id}` : 'N/A';
}

function nombrePropiedad(propiedad?: number | PropiedadRef): string {
  const obj = refObjeto<PropiedadRef>(propiedad);
  if (obj) return obj.direccion ?? `#${obj.id}`;
  const id = refId(propiedad);
  return id ? `#${id}` : 'N/A';
}

function BadgeEstado({ estado }: { estado: EstadoSenia }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${ESTILOS_ESTADO_SENIA[estado]}`}>
      {ETIQUETAS_ESTADO_SENIA[estado]}
    </span>
  );
}

function TarjetaSenia({
  senia,
  isAgent,
  onEditar,
  onEliminar,
  onCompletar,
  onCancelar,
  onMarcarAlquilada,
  onMarcarVencida,
}: {
  senia: Senia;
  isAgent: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onCompletar: () => void;
  onCancelar: () => void;
  onMarcarAlquilada: () => void;
  onMarcarVencida: () => void;
}) {
  const dias = diasRestantes(senia.fechaVencimiento);
  const vencida = dias !== null && dias < 0;

  return (
    <div className="bg-white rounded-xl shadow-md border p-6 flex flex-col">
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-semibold text-lg text-neutral-900">Seña de {nombrePropiedad(senia.propiedad)}</h3>
        <BadgeEstado estado={senia.estado} />
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <p className="text-sm text-neutral-600">Propiedad: {nombrePropiedad(senia.propiedad)}</p>
        {isAgent && (
          <p className="text-sm text-neutral-600">Cliente: {nombreCliente(senia.cliente)}</p>
        )}
        <p className="text-sm text-neutral-600">Importe: {formatearMoneda(senia.importe)}</p>

        {senia.estado === 'confirmada' && senia.fechaVencimiento && (
          <p className={`text-sm ${vencida ? 'text-red-600' : 'text-neutral-600'}`}>
            {vencida
              ? `Reserva vencida el ${formatearFecha(senia.fechaVencimiento)}`
              : `Reservada hasta el ${formatearFecha(senia.fechaVencimiento)} · ${dias} ${dias === 1 ? 'día restante' : 'días restantes'}`}
          </p>
        )}

        {senia.pago?.estado === 'aprobado' && (
          <p className="text-xs text-neutral-500">
            Pago aprobado el {formatearFecha(senia.pago.fecha)} · tarjeta ****{senia.pago.ultimosCuatro}
            {senia.pago.referencia && ` · ${senia.pago.referencia}`}
          </p>
        )}

        {!isAgent && senia.estado === 'pendiente_pago' && (
          <p className="text-sm text-amber-700">
            Todavía no pagaste esta seña. La propiedad no queda reservada hasta que el pago se apruebe.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isAgent ? (
          <>
            <button onClick={onEditar} className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 rounded-lg text-sm font-medium">Editar</button>
            <button onClick={onEliminar} className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg text-sm font-medium">Eliminar</button>
            {senia.estado === 'confirmada' && (
              <>
                <button onClick={onMarcarAlquilada} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium">
                  Marcar como alquilada
                </button>
                {vencida && (
                  <button onClick={onMarcarVencida} className="w-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 py-2 rounded-lg text-sm font-medium">
                    Vencer y liberar propiedad
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          senia.estado === 'pendiente_pago' && (
            <>
              <button onClick={onCompletar} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Pagar seña
              </button>
              <button onClick={onCancelar} className="flex-1 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 py-2 rounded-lg text-sm font-medium">
                Cancelar
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}
