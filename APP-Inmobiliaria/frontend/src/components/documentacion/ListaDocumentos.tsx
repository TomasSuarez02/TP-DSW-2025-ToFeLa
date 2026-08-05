import { useState } from "react";
import { formatearFecha } from "../../utils/formato";
import Badge from "../ui/Badge";
import { TONO_ESTADO_DOC } from "../../lib/estados";
import { parseApiError } from "../../utils/apiErrors";
import { eliminarPresentacion, revisarDocumentacion } from "../../services/documentacionCliente";
import VisorDocumento from "./VisorDocumento";
import {
  ETIQUETAS_ESTADO_DOC,
  refId,
  refObjeto,
  type DocumentacionCliente,
  type DocumentacionRef,
  type EstadoDocumentacionCliente,
} from "../../types/senia";

/**
 * Lista de papeles presentados por un cliente, con sus acciones.
 *
 * El agente aprueba, rechaza y da de baja; el cliente solo ve el estado y puede
 * retirar lo que todavía no le aprobaron (esa misma regla la valida el backend,
 * acá solo se esconde el botón).
 *
 * Para aprobar hay que haber abierto el documento antes: aprobar a ciegas desde
 * la lista es exactamente lo que no queremos que pase.
 */
export default function ListaDocumentos({
  items,
  isAgent,
  onCambio,
  vacio = "No hay documentación cargada.",
}: {
  items: DocumentacionCliente[];
  isAgent: boolean;
  /** Se llama después de aprobar, rechazar o eliminar, para refrescar. */
  onCambio: () => void;
  vacio?: string;
}) {
  /** Documento abierto en el visor, con el papel ya resuelto. */
  const [viendo, setViendo] = useState<{ dc: DocumentacionCliente; doc: DocumentacionRef } | null>(
    null,
  );
  /** Ids ya inspeccionados en esta pantalla; habilitan el botón de aprobar. */
  const [inspeccionados, setInspeccionados] = useState<Set<number>>(new Set());

  const abrirVisor = (dc: DocumentacionCliente, doc: DocumentacionRef) => {
    setInspeccionados((previos) => new Set(previos).add(doc.id));
    setViendo({ dc, doc });
  };

  const handleRevisar = async (dc: DocumentacionCliente, estado: EstadoDocumentacionCliente) => {
    const docId = refId(dc.documentacion);
    const cliId = refId(dc.cliente);
    if (!docId || !cliId) return;

    let observaciones: string | undefined;
    if (estado === "rechazada") {
      observaciones = prompt("¿Por qué se rechaza? (opcional)") ?? undefined;
    }

    try {
      await revisarDocumentacion(docId, cliId, estado, observaciones);
      setViendo(null);
      onCambio();
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  const handleEliminar = async (dc: DocumentacionCliente) => {
    const docId = refId(dc.documentacion);
    const cliId = refId(dc.cliente);
    if (!docId || !cliId) return;
    if (!confirm("¿Eliminar este documento y su archivo?")) return;

    try {
      await eliminarPresentacion(docId, cliId);
      onCambio();
    } catch (error) {
      alert(parseApiError(error).message);
    }
  };

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500 py-3">{vacio}</p>;
  }

  return (
    <div className="divide-y divide-[#f0e6d8]">
      {items.map((dc) => {
        const doc = refObjeto<DocumentacionRef>(dc.documentacion);
        const docId = refId(dc.documentacion);
        const cliId = refId(dc.cliente);
        const vencido = doc?.fecha_vencimiento ? new Date(doc.fecha_vencimiento) < new Date() : false;
        const puedeEliminar = isAgent || dc.estado !== "aprobada";
        const inspeccionado = docId !== undefined && inspeccionados.has(docId);

        return (
          <div key={`${docId}-${cliId}`} className="py-3 flex flex-wrap items-center gap-3">
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

            <Badge tono={TONO_ESTADO_DOC[dc.estado]}>{ETIQUETAS_ESTADO_DOC[dc.estado]}</Badge>

            {doc?.path && (
              <button
                onClick={() => abrirVisor(dc, doc)}
                className="text-xs px-3 py-1 rounded-lg bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-800"
              >
                Inspeccionar
              </button>
            )}

            {isAgent && dc.estado !== "aprobada" && (
              <button
                onClick={() => handleRevisar(dc, "aprobada")}
                disabled={!inspeccionado}
                title={inspeccionado ? undefined : "Inspeccioná el documento antes de aprobarlo"}
                className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white"
              >
                Aprobar
              </button>
            )}
            {isAgent && dc.estado !== "rechazada" && (
              <button
                onClick={() => handleRevisar(dc, "rechazada")}
                className="text-xs px-3 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
              >
                Rechazar
              </button>
            )}
            {puedeEliminar && (
              <button
                onClick={() => handleEliminar(dc)}
                className="text-xs px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800"
              >
                Eliminar
              </button>
            )}
          </div>
        );
      })}

      {viendo && (
        <VisorDocumento
          documento={viendo.doc}
          isAgent={isAgent}
          onRevisar={isAgent ? (estado) => handleRevisar(viendo.dc, estado) : undefined}
          onCerrar={() => setViendo(null)}
        />
      )}
    </div>
  );
}
