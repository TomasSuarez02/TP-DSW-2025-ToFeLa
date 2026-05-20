import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import type { Propiedades } from "./Card.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../utils/apiClient';

export default function Page({ propiedad }: { propiedad?: Propiedades }) {
    const { id } = useParams<{ id?: string }>();

    const [prop, setProp] = useState<Propiedades | null>(propiedad ?? null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<boolean>(false);
    const [showSeniaModal, setShowSeniaModal] = useState<boolean>(false);
    const [loggedClient, setLoggedClient] = useState<{ id: number; nombre?: string; apellido?: string; email?: string } | null>(null);
    const [seniaImporte, setSeniaImporte] = useState<number>(0);
    const [seniaError, setSeniaError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [horaDesde, setHoraDesde] = useState<string>('');
    const [horaHasta, setHoraHasta] = useState<string>('');
    const [slotSel, setSlotSel] = useState('');
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [visitError, setVisitError] = useState<string | null>(null);


    useEffect(() => {
        setLoading(true);
        setError(null);
        apiClient.get(`/propiedades/${id}`)
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
            const role = localStorage.getItem('role');
            setUserRole(role);
            if (!token || role !== 'cliente') return;

            const parts = token.split('.');
            if (parts.length < 2) return console.warn('Invalid JWT token format');

            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const userId = payload.id ?? payload.userId ?? payload.sub ?? payload.usuarioId ?? null;
            if (!userId) {
                console.debug('No user id found inside JWT payload', payload);
                return;
            }

            apiClient.get(`/clientes/${userId}`)
                .then(res => {
                    const clientPayload = res.data?.data ?? res.data;
                    setLoggedClient({
                        id: clientPayload.id,
                        nombre: clientPayload.nombre,
                        apellido: clientPayload.apellido,
                        email: clientPayload.email,
                    });
                })
                .catch(err => {
                    console.warn('Error fetching client data', err);
                    setLoggedClient({ id: Number(userId), email: payload.email ?? '' });
                });
        } catch (err) {
            console.error('Error decoding accessToken for user id', err);
        }
    }, []);

    useEffect(() => {
        if (!prop?.precio) return;
        setSeniaImporte(Math.round(prop.precio * 0.1));
    }, [prop]);

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
            setVisitError(null);

            if (!data.cliente) {
                alert('Debes iniciar sesión para agendar una visita.');
                return;
            }

            apiClient.post('/visitas', data)
                .then(res => {
                    console.log('Visita agendada:', res.data);
                    alert('Visita agendada con éxito');
                    setOpen(false);
                    setSlotSel('');
                })
                .catch((err: unknown) => {
                    console.error('Error agendando visita', err);
                    const parsedError =
                        typeof err === 'object' &&
                        err !== null &&
                        'parsedError' in err &&
                        typeof (err as { parsedError?: unknown }).parsedError === 'object' &&
                        (err as { parsedError?: unknown }).parsedError !== null
                            ? (err as { parsedError: { message?: string; fieldErrors?: Record<string, string> } }).parsedError
                            : null;

                    const parsed = parsedError ?? { message: 'Error inesperado', fieldErrors: {} as Record<string, string> };
                    setVisitError(parsed.fieldErrors?.fecha_hora ?? parsed.message ?? 'Error inesperado');
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
                                                <p className="text-lg font-semibold text-gray-800">{prop.tipoPropiedad?.nombre ?? 'Sin tipo'}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h2>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {prop.descripcion || 'No hay descripción disponible para esta propiedad.'}
                                            </p>
                                        </div>

                                        <div className="pt-4 space-y-3">
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
                                            {userRole === 'cliente' && loggedClient && prop.estado?.toLowerCase() === 'disponible' && (
                                                <button
                                                    onClick={() => setShowSeniaModal(true)}
                                                    className="w-full px-6 py-3 bg-[#d97706] text-white text-lg font-semibold rounded-lg hover:bg-[#b45309] transition-colors duration-200 shadow-md hover:shadow-lg"
                                                    type="button"
                                                >
                                                    Señar
                                                </button>
                                            )}
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
                                            onClick={() => { setOpen(false); setSlotSel(''); setVisitError(null); }}
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
                                                {visitError && (
                                                    <p className="mt-2 text-sm text-red-600">{visitError}</p>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                                <button
                                                    onClick={() => { setOpen(false); setSlotSel(''); setVisitError(null); }}
                                                    className="rounded-md border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                                    type="button"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setVisitError(null);

                                                        if (!slotSel) {
                                                            alert('Selecciona un horario.');
                                                            return;
                                                        }
                                                        const [y, mo, d] = fecha.split('-').map(Number);
                                                        const [hh, mm] = slotSel.split(':').map(Number);
                                                        const selectedDate = new Date(y, mo - 1, d, hh, mm, 0);
                                                        const now = new Date();

                                                        if (selectedDate < now) {
                                                            alert('La fecha y hora deben ser iguales o posteriores al día de hoy.');
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

                                {showSeniaModal && loggedClient && (
                                    <div className="fixed inset-0 z-[1000] grid h-screen w-screen place-items-center">
                                        <div
                                            className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm"
                                            onClick={() => { setShowSeniaModal(false); setSeniaError(null); }}
                                        />
                                        <div className="relative m-4 w-11/12 max-w-xl rounded-lg bg-white p-5 shadow-xl z-10">
                                            <div className="mb-4 text-xl font-semibold text-slate-800">Confirmar seña</div>
                                            <p className="text-sm text-slate-600">Propiedad: <strong>{prop?.direccion || 'sin dirección'}</strong></p>
                                            <p className="text-sm text-slate-600">Cliente: <strong>{loggedClient.nombre ?? loggedClient.email}</strong></p>
                                            <p className="text-sm text-slate-600">Importe de seña: <strong>${seniaImporte.toFixed(2)}</strong></p>
                                            <p className="mt-3 text-sm text-slate-500">La seña se crea con la propiedad actual y el cliente autenticado.</p>
                                            {seniaError && <p className="mt-3 text-sm text-red-600">{seniaError}</p>}
                                            <div className="mt-5 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowSeniaModal(false); setSeniaError(null); }}
                                                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            setSeniaError(null);
                                                            if (!prop?.id || !loggedClient?.id) {
                                                                setSeniaError('No se puede crear la seña sin propiedad o cliente.');
                                                                return;
                                                            }
                                                            await apiClient.post('/senias/cliente', {
                                                                propiedad: prop.id,
                                                                cliente: loggedClient.id,
                                                                importe: seniaImporte,
                                                            });
                                                            setShowSeniaModal(false);
                                                            window.alert('Seña creada correctamente.');
                                                        } catch (error) {
                                                            console.error('Error creating seña', error);
                                                            setSeniaError('No se pudo crear la seña. Intenta nuevamente.');
                                                        }
                                                    }}
                                                    className="rounded-md bg-[#d97706] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b45309]"
                                                >
                                                    Confirmar seña
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
