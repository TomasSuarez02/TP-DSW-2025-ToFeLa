import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import type { Propiedades } from "./Card.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState } from 'react';
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
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0,10));


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
    }, [id, propiedad]);

    

    // Log the logged-in user id (if present inside the JWT accessToken)
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

    // 1) Slots rápidos (en línea, sin helpers)
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
            arr.push(`${hh}:${mm}`); // <-- solo HH:mm
            }
            return arr;
        })();


        function setVisita(data: { propiedad?: number; fecha_hora?: string; cliente?: number } | null) {
            if (data) {
                axios.post('http://localhost:3000/api/visitas', data)
                    .then(res => {
                        console.log('Visita agendada:', res.data);
                        alert('Visita agendada con éxito');
                    })
                    .catch(err => {
                        console.error('Error agendando visita', err);
                        if(data.cliente === null) {
                            alert('Debes iniciar sesión para agendar una visita.');
                            return;
                        }
                        alert('No se pudo agendar la visita')
                    });
            }
        }

            // Try to obtain logged user id from localStorage or from JWT token
            const getLoggedUserId = (): number | null => {
                const fromStorage = localStorage.getItem('userId');
                if (fromStorage) {
                    const n = Number(fromStorage);
                    if (!Number.isNaN(n) && n > 0) return n;
                }

                // try decode token
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
            };


    return (
        <>
            <Header />

            <main className="bg-gradient-to-t from-[#e4dfd5] to-white py-12">
                <div className="container mx-auto my-auto">
                    <div className="bg-white bg-opacity-90 rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-3">
                        <div className="md:col-span-2">
                        
                            <div className="p-6 ">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ">
                                    {prop?.imagenes?.map(i => (
                                        <img key={i.id} src={i.path} alt={i.path ?? ''} className="aspect-square w-full object-cover rounded-xl" />
                                    ))}
                                </div>
                                {loading ? (
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Cargando...</h1>
                                ) : error ? (
                                    <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-2">{error}</h1>
                                ) : prop ? (
                                    <>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-10 mb-2">{prop.direccion}</h1>
                                        <p className="text-xl text-gray-600 mb-4"><strong>Estado:</strong> {prop.estado.toUpperCase()}</p>
                                    </>
                                ) : (
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Propiedad no encontrada</h1>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4 text-gray-700">
                                        <span className="px-3 py-1 bg-gray-100 rounded-md font-bold text-xl">${prop?.precio.toLocaleString() ?? '-'}</span>
                                        <span className="text-xl">{prop?.tipoPropiedad?.descripcion ?? 'Tipo: -'}</span>
                                    </div>
                                    
                                </div>


                                <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-10">Descripción</h2>
                                <p className="text-gray-700 leading-relaxed">{prop ? 'No hay descripción disponible para esta propiedad.' : ''}</p>
                            </div>
                        </div>

                        <aside className="p-6 border-t md:border-t-0 md:border-l md:border-gray-100">
                            <div className="flex flex-col gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xl text-gray-600">Inmobiliaria</p>
                                    <p className="font-semibold text-gray-800">{prop?.inmobiliaria?.nombre ?? 'Sin inmobiliaria'}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xl text-gray-600">Tipo de propiedad</p>
                                    <p className="mt-2 text-gray-700 font-semibold">{prop?.tipoPropiedad?.descripcion ?? 'Sin tipo'}</p>
                                </div>
                                <div className="flex gap-6 mt-10">
                                        <button
                                            onClick={() => { console.log('Open modal click'); setOpen(true); }}
                                            aria-haspopup="dialog"
                                            aria-expanded={open}
                                            aria-controls="property-modal"
                                           className="px-4 py-2 bg-white text-xl text-[#695433] rounded-md hover:bg-[#695433] hover:text-white border-2 transition font-semibold"
                                            type="button"
                                        >
                                            AGENDAR VISITA
                                        </button>

                                        {open && (
                                            <div className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center">
                                                <div
                                                    className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
                                                    onClick={() => setOpen(false)}
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
                                                            onClick={() => setOpen(false)}
                                                            className="rounded-md border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                                            type="button"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                           onClick={() => {
                                                                const clienteId = getLoggedUserId();

                                                                const fecha_hora = `${fecha} ${slotSel}:00`; // "YYYY-MM-DD HH:mm:00"

                                                                setVisita({
                                                                    propiedad: prop.id,
                                                                    fecha_hora,
                                                                    cliente: clienteId
                                                                });

                                                                setOpen(false);
                                                                }}


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

                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
