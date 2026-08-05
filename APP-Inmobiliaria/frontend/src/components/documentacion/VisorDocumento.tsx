import { useEffect, useState } from "react";
import { parseApiError } from "../../utils/apiErrors";
import {
  descargarDocumentacion,
  obtenerArchivoDocumentacion,
} from "../../services/documentaciones";
import { formatearFecha } from "../../config/senia";
import type { DocumentacionRef, EstadoDocumentacionCliente } from "../../types/senia";

/**
 * Muestra el papel en pantalla para poder revisarlo antes de decidir.
 *
 * Los PDF van en un `<iframe>` y las imágenes en un `<img>`; el archivo se baja
 * por XHR (la ruta exige token) y se muestra como blob. Aprobar y rechazar
 * están acá adentro a propósito: la decisión se toma mirando el documento, no
 * desde la lista.
 */
export default function VisorDocumento({
  documento,
  isAgent,
  onRevisar,
  onCerrar,
}: {
  documento: DocumentacionRef;
  isAgent: boolean;
  onRevisar?: (estado: EstadoDocumentacionCliente) => void;
  onCerrar: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [tipo, setTipo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revocar: string | null = null;
    let cancelado = false;

    obtenerArchivoDocumentacion(documento.id)
      .then(({ url: creada, tipo: mime }) => {
        // Si el modal se cerró mientras bajaba, se libera y no se setea estado.
        if (cancelado) {
          URL.revokeObjectURL(creada);
          return;
        }
        revocar = creada;
        setUrl(creada);
        setTipo(mime);
      })
      .catch((err) => {
        if (!cancelado) setError(parseApiError(err).message);
      });

    return () => {
      cancelado = true;
      if (revocar) URL.revokeObjectURL(revocar);
    };
  }, [documento.id]);

  const esImagen = tipo.startsWith("image/");
  const vencido = documento.fecha_vencimiento
    ? new Date(documento.fecha_vencimiento) < new Date()
    : false;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[#e5d8c2]">
          <div>
            <h3 className="font-semibold text-neutral-900">
              {documento.descripcion ?? `Documento #${documento.id}`}
            </h3>
            <p className={`text-xs ${vencido ? "text-red-600" : "text-neutral-500"}`}>
              {vencido ? "Vencido el " : "Vence el "}
              {formatearFecha(documento.fecha_vencimiento)}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="text-neutral-500 hover:text-neutral-900 text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center">
          {error ? (
            <p className="text-sm text-red-700 p-6 text-center">{error}</p>
          ) : !url ? (
            <p className="text-sm text-neutral-600 p-6">Cargando documento…</p>
          ) : esImagen ? (
            <img src={url} alt={documento.descripcion ?? "Documento"} className="max-w-full" />
          ) : (
            <iframe src={url} title="Documento" className="w-full h-full border-0" />
          )}
        </div>

        <div className="flex flex-wrap gap-3 p-4 border-t border-[#e5d8c2]">
          <button
            onClick={() =>
              descargarDocumentacion(documento.id, documento.path).catch((err) =>
                alert(parseApiError(err).message),
              )
            }
            className="px-4 py-2 rounded-lg bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-800 text-sm font-medium"
          >
            Descargar
          </button>

          <div className="flex-1" />

          {isAgent && onRevisar && (
            <>
              <button
                onClick={() => onRevisar("rechazada")}
                className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-medium"
              >
                Rechazar
              </button>
              <button
                onClick={() => onRevisar("aprobada")}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
              >
                Aprobar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
