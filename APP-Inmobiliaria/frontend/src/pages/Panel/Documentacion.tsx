import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";
import { formatearFecha } from "../../config/senia";
import {
  crearDocumentacion,
  descargarDocumentacion,
  eliminarDocumentacion,
  obtenerDocumentaciones,
  type Documentacion as Doc,
} from "../../services/documentaciones";
import {
  obtenerDocumentacionClientes,
  presentarDocumentacion,
  revisarDocumentacion,
} from "../../services/documentacionCliente";
import {
  refId,
  refObjeto,
  type ClienteRef,
  type DocumentacionCliente,
  type EstadoDocumentacionCliente,
} from "../../types/senia";

const ETIQUETAS: Record<EstadoDocumentacionCliente, string> = {
  pendiente: "Pendiente de revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const ESTILOS: Record<EstadoDocumentacionCliente, string> = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  aprobada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
};

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  mail?: string;
}

/**
 * Registro de los papeles que hacen falta para cerrar un alquiler.
 * Los carga el agente: sube el archivo y lo deja aprobado o pendiente. Sin
 * documentación aprobada, `concretar` una seña devuelve 409.
 */
export default function Documentacion() {
  const [presentaciones, setPresentaciones] = useState<DocumentacionCliente[]>([]);
  const [documentos, setDocumentos] = useState<Doc[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    cliente: "",
    descripcion: "",
    fecha_vencimiento: "",
    estado: "aprobada" as EstadoDocumentacionCliente,
  });
  const [archivo, setArchivo] = useState<File | null>(null);

  const fetchTodo = useCallback(async () => {
    try {
      setLoading(true);
      const [dcs, docs, cls] = await Promise.all([
        obtenerDocumentacionClientes(),
        obtenerDocumentaciones(),
        apiClient.get("/clientes").then((r) => r.data?.data ?? []),
      ]);
      setPresentaciones(dcs);
      setDocumentos(docs);
      setClientes(cls);
    } catch (error) {
      console.error("Error al cargar documentación:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodo();
  }, [fetchTodo]);

  const resetForm = () => {
    setForm({ cliente: "", descripcion: "", fecha_vencimiento: "", estado: "aprobada" });
    setArchivo(null);
    setShowForm(false);
    setSubmitError(null);
    setFieldErrors({});
  };

  /**
   * Son dos pasos: primero el documento (con el archivo) y después el vínculo
   * con el cliente. Si el segundo falla se borra el primero, así no queda un
   * documento colgado sin dueño.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const errores: FieldErrors = {};
    if (!form.cliente) errores.cliente = "Elegí un cliente";
    if (form.descripcion.trim().length < 2) errores.descripcion = "La descripción es obligatoria";
    if (!form.fecha_vencimiento) errores.fecha_vencimiento = "La fecha de vencimiento es obligatoria";
    if (Object.keys(errores).length > 0) {
      setFieldErrors(errores);
      setSubmitError("Completá los campos obligatorios");
      return;
    }

    setGuardando(true);
    let creado: Doc | null = null;
    try {
      creado = await crearDocumentacion({
        descripcion: form.descripcion.trim(),
        fecha_vencimiento: form.fecha_vencimiento,
        archivo,
      });
      await presentarDocumentacion(creado.id, Number(form.cliente), form.estado);
      resetForm();
      fetchTodo();
    } catch (error) {
      if (creado) {
        await eliminarDocumentacion(creado.id).catch(() => undefined);
      }
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setGuardando(false);
    }
  };

  const handleRevisar = async (
    dc: DocumentacionCliente,
    estado: EstadoDocumentacionCliente,
  ) => {
    const docId = refId(dc.documentacion);
    const cliId = refId(dc.cliente);
    if (!docId || !cliId) return;

    let observaciones: string | undefined;
    if (estado === "rechazada") {
      observaciones = prompt("¿Por qué se rechaza? (opcional)") ?? undefined;
    }

    try {
      await revisarDocumentacion(docId, cliId, estado, observaciones);
      fetchTodo();
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  const handleEliminar = async (dc: DocumentacionCliente) => {
    const docId = refId(dc.documentacion);
    if (!docId) return;
    if (!confirm("¿Eliminar este documento y su archivo?")) return;
    try {
      await eliminarDocumentacion(docId);
      fetchTodo();
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  const handleDescargar = async (dc: DocumentacionCliente) => {
    const docId = refId(dc.documentacion);
    if (!docId) return;
    const doc = documentos.find((d) => d.id === docId);
    try {
      await descargarDocumentacion(docId, doc?.path ?? undefined);
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  // Agrupado por cliente: es como el agente piensa el trámite ("¿este cliente
  // tiene los papeles?"), no documento por documento.
  const porCliente = new Map<number, { cliente: ClienteRef; items: DocumentacionCliente[] }>();
  for (const dc of presentaciones) {
    const id = refId(dc.cliente);
    if (!id) continue;
    const cliente = refObjeto<ClienteRef>(dc.cliente) ?? { id };
    if (!porCliente.has(id)) porCliente.set(id, { cliente, items: [] });
    porCliente.get(id)!.items.push(dc);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-900">Documentación</h2>
          <p className="text-neutral-600 text-sm mt-1">
            Papeles necesarios para cerrar un contrato. Sin documentación aprobada no se
            puede concretar el alquiler de una seña.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#846a41] hover:bg-[#6d5735] text-white px-5 py-2 rounded-lg font-medium"
        >
          Cargar documento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold mb-4 text-neutral-800">Cargar documento</h3>

            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <label className="block text-sm text-neutral-700 mb-1">Cliente</label>
            <select
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg mb-1 bg-[#fffdf9] ${fieldErrors.cliente ? "border-red-400" : "border-[#e5d8c2]"}`}
            >
              <option value="">Elegí un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
            {fieldErrors.cliente && <p className="text-sm text-red-600 mb-2">{fieldErrors.cliente}</p>}

            <label className="block text-sm text-neutral-700 mb-1 mt-3">Tipo de documento</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Recibo de sueldo, garantía propietaria, DNI…"
              className={`w-full px-3 py-2 border rounded-lg mb-1 bg-[#fffdf9] ${fieldErrors.descripcion ? "border-red-400" : "border-[#e5d8c2]"}`}
            />
            {fieldErrors.descripcion && <p className="text-sm text-red-600 mb-2">{fieldErrors.descripcion}</p>}

            <label className="block text-sm text-neutral-700 mb-1 mt-3">Vence el</label>
            <input
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg mb-1 bg-[#fffdf9] ${fieldErrors.fecha_vencimiento ? "border-red-400" : "border-[#e5d8c2]"}`}
            />
            {fieldErrors.fecha_vencimiento && (
              <p className="text-sm text-red-600 mb-2">{fieldErrors.fecha_vencimiento}</p>
            )}
            <p className="text-xs text-neutral-500 mb-3">
              Un documento vencido bloquea el cierre del alquiler.
            </p>

            <label className="block text-sm text-neutral-700 mb-1">Archivo (PDF o imagen)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-sm mb-1"
            />
            {archivo && <p className="text-xs text-neutral-500 mb-3">📎 {archivo.name}</p>}

            <label className="block text-sm text-neutral-700 mb-1 mt-3">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoDocumentacionCliente })}
              className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg mb-5 bg-[#fffdf9]"
            >
              <option value="aprobada">Aprobada — ya verifiqué el papel</option>
              <option value="pendiente">Pendiente de revisión</option>
            </select>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 border border-neutral-300 text-neutral-700 py-2 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-[#846a41] hover:bg-[#6d5735] disabled:bg-neutral-300 text-white py-2 rounded-lg text-sm font-medium"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando documentación…</div>
      ) : porCliente.size === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">No hay documentación cargada</h3>
          <p className="text-neutral-500">Cargá el primer documento de un cliente</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...porCliente.values()].map(({ cliente, items }) => {
            const enRegla = items.every((i) => i.estado === "aprobada");
            return (
              <div key={cliente.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-neutral-900">
                    {`${cliente.nombre ?? ""} ${cliente.apellido ?? ""}`.trim() || `Cliente #${cliente.id}`}
                  </h3>
                  <span className={`text-xs px-3 py-1 rounded-full border ${enRegla ? ESTILOS.aprobada : ESTILOS.pendiente}`}>
                    {enRegla ? "Documentación en regla" : "Falta documentación"}
                  </span>
                </div>

                <div className="divide-y divide-[#f0e6d8]">
                  {items.map((dc) => {
                    const doc = refObjeto<{ id: number; descripcion?: string; fecha_vencimiento?: string }>(
                      dc.documentacion,
                    );
                    const docId = refId(dc.documentacion);
                    const archivoDisponible = documentos.find((d) => d.id === docId)?.path;
                    const vencido = doc?.fecha_vencimiento
                      ? new Date(doc.fecha_vencimiento) < new Date()
                      : false;

                    return (
                      <div key={`${docId}-${cliente.id}`} className="py-3 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm font-medium text-neutral-800">
                            {doc?.descripcion ?? `Documento #${docId}`}
                          </p>
                          <p className={`text-xs ${vencido ? "text-red-600" : "text-neutral-500"}`}>
                            {vencido ? "Vencido el " : "Vence el "}
                            {formatearFecha(doc?.fecha_vencimiento)}
                            {dc.observaciones && ` · ${dc.observaciones}`}
                          </p>
                        </div>

                        <span className={`text-xs px-2 py-1 rounded-full border ${ESTILOS[dc.estado]}`}>
                          {ETIQUETAS[dc.estado]}
                        </span>

                        {archivoDisponible && (
                          <button
                            onClick={() => handleDescargar(dc)}
                            className="text-xs px-3 py-1 rounded-lg bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-800"
                          >
                            Ver archivo
                          </button>
                        )}
                        {dc.estado !== "aprobada" && (
                          <button
                            onClick={() => handleRevisar(dc, "aprobada")}
                            className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Aprobar
                          </button>
                        )}
                        {dc.estado !== "rechazada" && (
                          <button
                            onClick={() => handleRevisar(dc, "rechazada")}
                            className="text-xs px-3 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                          >
                            Rechazar
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(dc)}
                          className="text-xs px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
