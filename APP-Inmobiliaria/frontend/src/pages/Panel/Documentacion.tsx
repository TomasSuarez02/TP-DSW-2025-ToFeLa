import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../utils/apiClient";
import FormularioDocumento from "../../components/documentacion/FormularioDocumento";
import ListaDocumentos from "../../components/documentacion/ListaDocumentos";
import {
  cargarDocumentoDeCliente,
  obtenerDocumentacionClientes,
} from "../../services/documentacionCliente";
import {
  documentacionEnRegla,
  ESTILOS_ESTADO_DOC,
  refId,
  refObjeto,
  type ClienteRef,
  type DocumentacionCliente,
} from "../../types/senia";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  mail?: string;
}

function nombreCompleto(cliente: ClienteRef): string {
  return `${cliente.nombre ?? ""} ${cliente.apellido ?? ""}`.trim() || `Cliente #${cliente.id}`;
}

/**
 * Registro de los papeles que hacen falta para cerrar un alquiler.
 *
 * Es la vista transversal: sirve para cargar documentación por adelantado
 * (cuando el cliente la manda antes de venir) y para consultar rápido el estado
 * de un cliente sin tener que entrar por la propiedad. El cierre en sí se hace
 * desde el modal de concretar en Señas, que reusa estos mismos componentes.
 */
export default function Documentacion() {
  const [presentaciones, setPresentaciones] = useState<DocumentacionCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clienteForm, setClienteForm] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const fetchTodo = useCallback(async () => {
    try {
      setLoading(true);
      const [dcs, cls] = await Promise.all([
        obtenerDocumentacionClientes(),
        apiClient.get("/clientes").then((r) => r.data?.data ?? []),
      ]);
      setPresentaciones(dcs);
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

  // Agrupado por cliente: es como el agente piensa el trámite ("¿este cliente
  // tiene los papeles?"), no documento por documento.
  const grupos = useMemo(() => {
    const porCliente = new Map<number, { cliente: ClienteRef; items: DocumentacionCliente[] }>();
    for (const dc of presentaciones) {
      const id = refId(dc.cliente);
      if (!id) continue;
      const cliente = refObjeto<ClienteRef>(dc.cliente) ?? { id };
      if (!porCliente.has(id)) porCliente.set(id, { cliente, items: [] });
      porCliente.get(id)!.items.push(dc);
    }
    return [...porCliente.values()];
  }, [presentaciones]);

  const gruposFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return grupos;
    return grupos.filter(({ cliente }) => {
      const texto = `${nombreCompleto(cliente)} ${cliente.mail ?? ""} ${cliente.id}`.toLowerCase();
      return texto.includes(termino);
    });
  }, [grupos, busqueda]);

  const handleGuardar = async (datos: {
    descripcion: string;
    fecha_vencimiento: string;
    archivo: File | null;
    estado?: DocumentacionCliente["estado"];
  }) => {
    if (!clienteForm) throw new Error("Elegí un cliente");

    await cargarDocumentoDeCliente({
      clienteId: Number(clienteForm),
      descripcion: datos.descripcion,
      fecha_vencimiento: datos.fecha_vencimiento,
      archivo: datos.archivo,
      estado: datos.estado,
    });

    setShowForm(false);
    setClienteForm("");
    fetchTodo();
  };

  const abrirFormulario = (clienteId?: number) => {
    setClienteForm(clienteId ? String(clienteId) : "");
    setShowForm(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-900">Documentación</h2>
          <p className="text-neutral-600 text-sm mt-1">
            Papeles necesarios para cerrar un contrato. Podés cargarlos apenas el cliente los
            manda; después, al concretar el alquiler, ya están listos.
          </p>
        </div>
        <button
          onClick={() => abrirFormulario()}
          className="bg-[#846a41] hover:bg-[#6d5735] text-white px-5 py-2 rounded-lg font-medium"
        >
          Cargar documento
        </button>
      </div>

      <div className="mb-6">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre o mail…"
          className="w-full max-w-md px-4 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9]"
        />
        {busqueda.trim() && (
          <p className="text-xs text-neutral-500 mt-1">
            {gruposFiltrados.length} de {grupos.length} clientes
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <FormularioDocumento
            titulo="Cargar documento"
            permiteEstado
            campoExtra={
              <>
                <label className="block text-sm text-neutral-700 mb-1">Cliente</label>
                <select
                  value={clienteForm}
                  onChange={(e) => setClienteForm(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg mb-4 bg-[#fffdf9]"
                >
                  <option value="">Elegí un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </>
            }
            onGuardar={handleGuardar}
            onCancelar={() => {
              setShowForm(false);
              setClienteForm("");
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando documentación…</div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">
            {grupos.length === 0 ? "No hay documentación cargada" : "Ningún cliente coincide"}
          </h3>
          <p className="text-neutral-500">
            {grupos.length === 0
              ? "Cargá el primer documento de un cliente"
              : "Probá con otro nombre o mail"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {gruposFiltrados.map(({ cliente, items }) => {
            const enRegla = documentacionEnRegla(items);
            return (
              <div key={cliente.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <h3 className="font-semibold text-neutral-900">{nombreCompleto(cliente)}</h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${enRegla ? ESTILOS_ESTADO_DOC.aprobada : ESTILOS_ESTADO_DOC.pendiente}`}
                    >
                      {enRegla ? "Documentación en regla" : "Falta documentación"}
                    </span>
                    <button
                      onClick={() => abrirFormulario(cliente.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-800"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                <ListaDocumentos items={items} isAgent onCambio={fetchTodo} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
