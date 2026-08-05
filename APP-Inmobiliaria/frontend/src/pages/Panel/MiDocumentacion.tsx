import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import FormularioDocumento from "../../components/documentacion/FormularioDocumento";
import ListaDocumentos from "../../components/documentacion/ListaDocumentos";
import {
  cargarDocumentoDeCliente,
  obtenerMiDocumentacion,
} from "../../services/documentacionCliente";
import { documentacionEnRegla, type DocumentacionCliente } from "../../types/senia";

/**
 * El cliente sube sus propios papeles y ve en qué quedó la revisión.
 *
 * Todo lo que carga acá entra como `pendiente`: la aprobación es del agente. La
 * ventaja es que puede mandarlos antes de ir a la inmobiliaria, y el día que se
 * concreta el alquiler ya están revisados.
 */
export default function MiDocumentacion() {
  const { userId } = useAuth();
  const [items, setItems] = useState<DocumentacionCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await obtenerMiDocumentacion());
    } catch (error) {
      console.error("Error al cargar mi documentación:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  const handleGuardar = async (datos: {
    descripcion: string;
    fecha_vencimiento: string;
    archivo: File | null;
  }) => {
    if (!userId) throw new Error("Volvé a iniciar sesión para cargar documentación");

    // Sin `estado`: lo que sube el cliente queda pendiente de revisión.
    await cargarDocumentoDeCliente({
      clienteId: userId,
      descripcion: datos.descripcion,
      fecha_vencimiento: datos.fecha_vencimiento,
      archivo: datos.archivo,
    });

    setShowForm(false);
    fetchDocumentos();
  };

  const enRegla = documentacionEnRegla(items);
  const rechazados = items.filter((dc) => dc.estado === "rechazada").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-900">Mi documentación</h2>
          <p className="text-neutral-600 text-sm mt-1">
            Subí los papeles que te piden para alquilar. Un agente los revisa y, si están en
            regla, el día de la firma no tenés que traer nada más.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#846a41] hover:bg-[#6d5735] text-white px-5 py-2 rounded-lg font-medium"
        >
          Subir documento
        </button>
      </div>

      {!loading && items.length > 0 && (
        <div
          className={`mb-6 rounded-lg border p-4 text-sm ${
            enRegla
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {enRegla
            ? "✓ Tu documentación está aprobada y vigente. Podés cerrar el alquiler."
            : rechazados > 0
              ? `Tenés ${rechazados} ${rechazados === 1 ? "documento rechazado" : "documentos rechazados"}. Mirá el motivo abajo y volvé a subirlo corregido.`
              : "Tus documentos están pendientes de revisión."}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <FormularioDocumento
            titulo="Subir documento"
            onGuardar={handleGuardar}
            onCancelar={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando tu documentación…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <ListaDocumentos
            items={items}
            isAgent={false}
            onCambio={fetchDocumentos}
            vacio="Todavía no subiste ningún documento."
          />
        </div>
      )}
    </div>
  );
}
