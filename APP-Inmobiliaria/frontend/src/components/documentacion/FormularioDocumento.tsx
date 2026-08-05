import { useState } from "react";
import { parseApiError, type FieldErrors } from "../../utils/apiErrors";
import type { EstadoDocumentacionCliente } from "../../types/senia";

export interface DatosDocumento {
  descripcion: string;
  fecha_vencimiento: string;
  archivo: File | null;
  estado?: EstadoDocumentacionCliente;
}

/**
 * Alta de un papel. Se usa desde los tres lugares donde se carga documentación:
 * el panel del agente, el modal de concretar y la vista del cliente.
 *
 * El selector de estado solo aparece para el agente: si lo carga él es porque
 * ya vio el papel, así que puede darlo por aprobado en el acto. Lo que sube el
 * cliente siempre queda pendiente de revisión.
 */
export default function FormularioDocumento({
  titulo,
  permiteEstado = false,
  campoExtra,
  onGuardar,
  onCancelar,
}: {
  titulo: string;
  permiteEstado?: boolean;
  /** Campos que solo tienen sentido en una pantalla; hoy, elegir el cliente. */
  campoExtra?: React.ReactNode;
  onGuardar: (datos: DatosDocumento) => Promise<void>;
  onCancelar: () => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<EstadoDocumentacionCliente>("aprobada");
  const [guardando, setGuardando] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errores: FieldErrors = {};
    if (descripcion.trim().length < 2) errores.descripcion = "La descripción es obligatoria";
    if (!fechaVencimiento) errores.fecha_vencimiento = "La fecha de vencimiento es obligatoria";
    // Sin adjunto no hay nada que revisar; el backend también lo rechaza.
    if (!archivo) errores.base64 = "Adjuntá el archivo del documento";
    if (Object.keys(errores).length > 0) {
      setFieldErrors(errores);
      setSubmitError("Completá los campos obligatorios");
      return;
    }
    setFieldErrors({});

    setGuardando(true);
    try {
      await onGuardar({
        descripcion: descripcion.trim(),
        fecha_vencimiento: fechaVencimiento,
        archivo,
        ...(permiteEstado ? { estado } : {}),
      });
    } catch (error) {
      const parsed = parseApiError(error);
      setSubmitError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setGuardando(false);
    }
  };

  const claseInput = (error?: string) =>
    `w-full px-3 py-2 border rounded-lg mb-1 bg-[#fffdf9] ${error ? "border-red-400" : "border-[#e5d8c2]"}`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4 text-neutral-800">{titulo}</h3>

      {submitError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {campoExtra}

      <label className="block text-sm text-neutral-700 mb-1">Tipo de documento</label>
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Recibo de sueldo, garantía propietaria, DNI…"
        className={claseInput(fieldErrors.descripcion)}
      />
      {fieldErrors.descripcion && <p className="text-sm text-red-600 mb-2">{fieldErrors.descripcion}</p>}

      <label className="block text-sm text-neutral-700 mb-1 mt-3">Vence el</label>
      <input
        type="date"
        value={fechaVencimiento}
        onChange={(e) => setFechaVencimiento(e.target.value)}
        className={claseInput(fieldErrors.fecha_vencimiento)}
      />
      {fieldErrors.fecha_vencimiento && (
        <p className="text-sm text-red-600 mb-2">{fieldErrors.fecha_vencimiento}</p>
      )}
      <p className="text-xs text-neutral-500 mb-3">Un documento vencido bloquea el cierre del alquiler.</p>

      <label className="block text-sm text-neutral-700 mb-1">Archivo (PDF o imagen)</label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        className={`w-full text-sm mb-1 ${fieldErrors.base64 ? "border border-red-400 rounded-lg p-2" : ""}`}
      />
      {archivo && <p className="text-xs text-neutral-500 mb-3">📎 {archivo.name}</p>}
      {fieldErrors.base64 && <p className="text-sm text-red-600 mb-2">{fieldErrors.base64}</p>}

      {permiteEstado && (
        <>
          <label className="block text-sm text-neutral-700 mb-1 mt-3">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoDocumentacionCliente)}
            className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg mb-5 bg-[#fffdf9]"
          >
            <option value="aprobada">Aprobada — ya verifiqué el papel</option>
            <option value="pendiente">Pendiente de revisión</option>
          </select>
        </>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancelar}
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
  );
}
