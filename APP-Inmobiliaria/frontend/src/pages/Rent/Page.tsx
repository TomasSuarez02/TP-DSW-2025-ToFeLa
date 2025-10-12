import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import type { Propiedades } from "./Card.tsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Page({ propiedad }: { propiedad?: Propiedades }) {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();

    const [prop, setProp] = useState<Propiedades | null>(propiedad ?? null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        if (propiedad) return; // already provided
        if (!id) return;

        setLoading(true);
        setError(null);
        axios.get(`http://localhost:3000/api/propiedades/${id}`)
            .then(res => {
                // backend may return { data: propiedad } or the propiedad directly
                const payload = res.data?.data ?? res.data;
                setProp(payload ?? null);
            })
            .catch(err => {
                console.error('Error fetching propiedad', err);
                setError('No se pudo cargar la propiedad');
            })
            .finally(() => setLoading(false));
    }, [id, propiedad]);

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
                                            onClick={() => navigate(`/visita/${prop?.id ?? ''}`)}
                                            className="px-4 py-2 bg-white text-xl text-[#695433] rounded-md hover:bg-[#695433] hover:text-white border-2 transition font-semibold"
                                        >
                                            AGENDAR VISITA
                                        </button>
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