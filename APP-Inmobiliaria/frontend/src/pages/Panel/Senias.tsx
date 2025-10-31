import { useState, useEffect } from "react";
import axios from "axios";
import type { Senia } from "./Propiedades.tsx";


export default function Senias() {
  const [senias, setSenias] = useState<Senia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSenia, setEditingSenia] = useState<Senia | null>(null);

  const [formData, setFormData] = useState({
    propiedad: "",
    cliente: "",
    importe: "",
  });

  // Cargar señas
  const fetchSenias = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/senias");
      setSenias(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar señas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenias();
  }, []);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        propiedad: formData.propiedad ? Number(formData.propiedad) : undefined,
        cliente: formData.cliente ? Number(formData.cliente) : undefined,
        importe: formData.importe ? Number(formData.importe) : undefined,
      };

      if (editingSenia && editingSenia.id) {
        await axios.put(
          `http://localhost:3000/api/senias/${editingSenia.id}`,
          payload
        );
        alert("Seña actualizada correctamente");
      } else {
        await axios.post("http://localhost:3000/api/senias", payload);
        alert("Seña creada correctamente");
      }

      resetForm();
      fetchSenias();
    } catch (error) {
      console.error("Error al guardar seña:", error);
      alert("Error al guardar seña. Revisá la consola.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("¿Seguro que querés eliminar esta seña?")) {
      try {
        // localizar la seña para extraer la propiedad vinculada (si existe)
        const seniaObj = senias.find(s => s.id === id);
        let propiedadId: number | undefined;
        if (seniaObj) {
          if (typeof seniaObj.propiedad === 'number') propiedadId = seniaObj.propiedad;
          else if (seniaObj.propiedad && typeof seniaObj.propiedad === 'object' && 'id' in seniaObj.propiedad) {
            propiedadId = (seniaObj.propiedad as { id: number }).id;
          }
        }

        await axios.delete(`http://localhost:3000/api/senias/${id}`);

        // Si había una propiedad vinculada, intentar marcarla como disponible
        if (propiedadId) {
          try {
            await axios.put(`http://localhost:3000/api/propiedades/${propiedadId}`, { estado: 'disponible' });
          } catch (err) {
            console.error('Error actualizando estado de propiedad a disponible', err);
            // no rompemos el flujo principal por esto
          }
        }

        fetchSenias();
        alert("Seña eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar seña:", error);
        alert("Error al eliminar seña");
      }
    }
  };

  const handleEdit = (s: Senia) => {
    setEditingSenia(s);
  const propId = typeof s.propiedad === "number" ? String(s.propiedad) : (s.propiedad && typeof s.propiedad === 'object' && 'id' in s.propiedad ? String((s.propiedad as { id: number }).id) : "");
  const cliId = typeof s.cliente === "number" ? String(s.cliente) : (s.cliente && typeof s.cliente === 'object' && 'id' in s.cliente ? String((s.cliente as { id: number }).id) : "");

    setFormData({
      propiedad: propId ,
      cliente: cliId,
      importe: s.importe?.toString() || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ propiedad: "", cliente: "", importe: "" });
    setEditingSenia(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-3xl font-semibold text-neutral-900">Gestión de Señas</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-[#dcc7af] hover:bg-[#d4b89e] text-neutral-900 px-6 py-2 rounded-lg font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-neutral-900">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Propiedad *</label>
              {editingSenia ? (
                <input
                  type="text"
                  readOnly
                  value={
                    typeof editingSenia.propiedad === 'object' && editingSenia.propiedad
                      ? ((editingSenia.propiedad as { direccion?: string }).direccion ?? `#${(editingSenia.propiedad as { id?: number }).id ?? ''}`)
                      : (typeof editingSenia.propiedad === 'number' ? `#${editingSenia.propiedad}` : '')
                  }
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                />
              ) : (
                <input
                  type="number"
                  name="propiedad"
                  value={formData.propiedad}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Cliente *</label>
              {editingSenia ? (
                <input
                  type="text"
                  readOnly
                  value={
                    typeof editingSenia.cliente === 'object' && editingSenia.cliente
                      ? `${(editingSenia.cliente as { nombre?: string }).nombre ?? ''} ${(editingSenia.cliente as { apellido?: string }).apellido ?? ''}`.trim()
                      : (typeof editingSenia.cliente === 'number' ? `#${editingSenia.cliente}` : '')
                  }
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                />
              ) : (
                <input
                  type="number"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#1a1a1a]">Importe *</label>
              <input
                type="number"
                name="importe"
                value={formData.importe}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e5d8c2] rounded-lg bg-[#fffdf9] text-[#1a1a1a]"
                required
              />
            </div>

            <div className="col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-[#e5d8c2] rounded-lg text-[#1a1a1a]">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-[#dcc7af] hover:bg-[#d4b89e] rounded-lg font-medium text-neutral-900">Editar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de señas */}
      {loading ? (
        <div className="text-center py-10 text-neutral-600">Cargando señas...</div>
      ) : senias.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">No hay señas registradas</h3>
          <p className="text-neutral-500 mb-4">Creá la primera seña</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {senias.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-md border p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-neutral-900">Seña #{s.id}</h3>
                <span className="text-sm text-neutral-500">Propiedad: {typeof s.propiedad === 'object' && s.propiedad ? ((s.propiedad as { direccion?: string }).direccion ?? `#${(s.propiedad as { id?: number }).id ?? ''}`) : (typeof s.propiedad === 'number' ? `#${s.propiedad}` : 'N/A')}</span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-neutral-600">Cliente: {typeof s.cliente === 'object' && s.cliente ? `${(s.cliente as { nombre?: string; apellido?: string }).nombre ?? ''} ${(s.cliente as { nombre?: string; apellido?: string }).apellido ?? ''}`.trim() : (typeof s.cliente === 'number' ? `#${s.cliente}` : 'N/A')}</p>
                <p className="text-sm text-neutral-600">Importe: ${s.importe}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="flex-1 bg-[#f2e5d8] hover:bg-[#e8d5c4] text-neutral-900 py-2 rounded-lg text-sm font-medium">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg text-sm font-medium">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}