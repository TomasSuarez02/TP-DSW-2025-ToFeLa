import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import type { Propiedades } from "./Card.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function Page({ propiedad }: { propiedad?: Propiedades }) {
    const { id } = useParams<{ id?: string }>();

    const [prop, setProp] = useState<Propiedades | null>(propiedad ?? null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<boolean>(false);
    const [horaDesde, setHoraDesde] = useState<string>('');
    const [horaHasta, setHoraHasta] = useState<string>('');
    const [slotSel, setSlotSel] = useState('');
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));


    useEffect(() => {
        setLoading(true);
        setError(null);
        axios.get(`http://localhost:3000/api/propiedades/${id}`)
            .then(res => {
                const payload = res.data?.data ?? res.data;
                setProp(payload);
                setHoraDesde(payload.hora_desde);
                setHoraHasta(payload.hora_hasta);
            })
            .catch(err => {
                console.error('Error fetching propiedad', err);
                setError('No se pudo cargar la propiedad');
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return console.debug('No accessToken in localStorage');

            const parts = token.split('.');
            if (parts.length < 2) return console.warn('Invalid JWT token format');

            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const userId = payload.id ?? payload.userId ?? payload.sub ?? payload.usuarioId ?? null;
            if (userId) {
                console.log('Logged-in user id:', userId);
            } else {
                console.debug('No user id found inside JWT payload', payload);
            }
        } catch (err) {
            console.error('Error decoding accessToken for user id', err);
        }
    }, []);

    const slots =
        !horaDesde || !horaHasta
            ? []
            : (() => {
                const [h1, m1] = horaDesde.split(':').map(Number);
                const [h2, m2] = horaHasta.split(':').map(Number);
                const from = h1 * 60 + m1;
                const to = h2 * 60 + m2;

                const arr: string[] = [];
                for (let t = from; t + 60 <= to; t += 60) {
                    const hh = String(Math.floor(t / 60)).padStart(2, '0');
                    const mm = String(t % 60).padStart(2, '0');
                    arr.push(`${hh}:${mm}`);
                }
                return arr;
            })();


    const setVisita = useCallback((data: { propiedad?: number; fecha_hora?: string; cliente?: number | null } | null) => {
        if (data) {

            if (!data.cliente) {
                alert('Debes iniciar sesión para agendar una visita.');
                return;
            }

            axios.post('http://localhost:3000/api/visitas', data)
                .then(res => {
                    console.log('Visita agendada:', res.data);
                    alert('Visita agendada con éxito');
                    setOpen(false);
                    setSlotSel('');
                })
                .catch(err => {
                    console.error('Error agendando visita', err);
                    alert('No se pudo agendar la visita')
                });
        }
    }, []);


    const getLoggedUserId = useCallback((): number | null => {
        const fromStorage = localStorage.getItem('userId');
        if (fromStorage) {
            const n = Number(fromStorage);
            if (!Number.isNaN(n) && n > 0) return n;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const userId = payload.id ?? payload.userId ?? payload.sub ?? payload.usuarioId ?? null;
            if (userId) return Number(userId);
        } catch (err) {
            console.debug('Failed to decode token for user id', err);
        }
        return null;
    }, []);

    return (
        <>
            <Header />

            <main className="bg-[#f5f2ed] min-h-screen py-8">
                <div className="container mx-auto px-4">
    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* COLUMNA IZQUIERDA */}
                        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
                            {loading ? (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                    <p className="text-2xl text-gray-600">Cargando imágenes...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                    <p className="text-2xl text-red-600">{error}</p>
                                </div>
                            ) : prop?.imagenes && prop.imagenes.length > 0 ? (
                                prop.imagenes.map(img => (
                                    <div key={img.id} className="w-full h-[500px] overflow-hidden rounded-2xl shadow-lg">
                                        <img 
                                            src={img.path} 
                                            alt={img.path ?? 'Imagen de propiedad'} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                    <p className="text-xl text-gray-600">No hay imágenes disponibles</p>
                                </div>
                            )}
                        </div>

                        {/* COLUMNA DERECHA */}
                        <aside className="lg:col-span-1 order-1 lg:order-2">
                            <div className="sticky top-8 bg-white rounded-2xl shadow-lg p-6 space-y-6">
                                
                                {loading ? (
                                    <h1 className="text-3xl font-bold text-gray-800">Cargando...</h1>
                                ) : error ? (
                                    <h1 className="text-3xl font-bold text-red-600">{error}</h1>
                                ) : prop ? (
                                    <>
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{prop.direccion}</h1>
                                            <p className="text-lg text-gray-600 uppercase tracking-wide">{prop.estado}</p>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <p className="text-4xl font-bold text-[#695433]">
                                                ${prop.precio.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase tracking-wide">Tipo de propiedad</p>
                                                <p className="text-lg font-semibold text-gray-800">{prop.tipoPropiedad?.descripcion ?? 'Sin tipo'}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h2>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {prop.tipoPropiedad?.descripcion || 'No hay descripción disponible para este tipo de propiedad.'}
                                            </p>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={() => { console.log('Open modal click'); setOpen(true); }}
                                                aria-haspopup="dialog"
                                                aria-expanded={open}
                                                aria-controls="property-modal"
                                                className="w-full px-6 py-3 bg-[#695433] text-white text-lg font-semibold rounded-lg hover:bg-[#594429] transition-colors duration-200 shadow-md hover:shadow-lg"
                                                type="button"
                                            >
                                                AGENDAR VISITA
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <h1 className="text-2xl font-bold text-gray-800">Propiedad no encontrada</h1>
                                )}

                                {/* MODAL */}
                                {open && (
                                    <div className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center">
                                        <div
                                            className="fixed inset-0 bg-[#f5f2ed] bg-opacity-95 backdrop-blur-sm"
                                            onClick={() => { setOpen(false); setSlotSel(''); }}
                                        />

                                        <div className="relative m-4 p-4 w-11/12 max-w-3xl rounded-lg bg-white shadow-sm z-10">
                                            <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800">
                                                Agendar visita a la propiedad
                                            </div>
                                            <div className="relative border-t border-slate-200 py-4 leading-normal text-slate-600 font-light">
                                                <label htmlFor="visit-date" className="block">Fecha de visita</label>
                                                <input
                                                    id="visit-date"
                                                    type="date"
                                                    min={new Date().toISOString().slice(0, 10)}
                                                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                    value={fecha}
                                                    onChange={(e) => setFecha(e.target.value)}
                                                />

                                                <label htmlFor="visit" className="block mt-4">Horarios disponibles</label>
                                                <select
                                                    id="visit"
                                                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                    value={slotSel}
                                                    onChange={(e) => setSlotSel(e.target.value)}
                                                    disabled={slots.length === 0}
                                                >
                                                    {slots.length === 0 ? (
                                                        <option>No hay visitas disponibles</option>
                                                    ) : (
                                                        <>
                                                            <option value="" disabled>Elegí un horario</option>
                                                            {slots.map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                                <button
                                                    onClick={() => { setOpen(false); setSlotSel(''); }}
                                                    className="rounded-md border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                                    type="button"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!slotSel) {
                                                            alert('Selecciona un horario.');
                                                            return;
                                                        }

                                                        const clienteId = getLoggedUserId();
                                                        const fecha_hora = `${fecha} ${slotSel}:00`;

                                                        setVisita({
                                                            propiedad: prop?.id,
                                                            fecha_hora,
                                                            cliente: clienteId
                                                        });
                                                    }}
                                                    disabled={!slotSel}
                                                    className="rounded-md bg-green-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-green-700 focus:shadow-none active:bg-green-700 hover:bg-green-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2"
                                                    type="button"
                                                >
                                                    Agendar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
