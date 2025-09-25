import { useState } from "react";
import Header from "../../components/Header.tsx";
import axios from "axios";

export function Register() {
    const [user, setUser] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        tipo_documento: "DNI",
        nro_doc: "",
        password: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.post("http://localhost:3000/api/clientes", user);
            setSuccess("Usuario registrado correctamente");
            if (res) {
                window.location.href = "/home";
            }
        } catch (err) {
            console.log(err);
            setError("Error al registrar usuario");
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af] flex items-center justify-center">
                <div className="flex shadow-2xl rounded-2xl overflow-hidden bg-white max-w-3xl w-full">
                    <div className="p-10 flex-1 bg-[#f2e5d8] flex flex-col justify-center relative">
                        <div className="mb-8 text-center">
                            <span className="tracking-wider text-2xl text-black font-semibold drop-shadow-sm">REGISTRARSE</span>
                        </div>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && <p className="text-red-500">{error}</p>}
                            {success && <p className="text-green-600">{success}</p>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={user.nombre}
                                        onChange={e => setUser({ ...user, nombre: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        value={user.apellido}
                                        onChange={e => setUser({ ...user, apellido: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        onChange={e => setUser({ ...user, email: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={user.telefono}
                                        onChange={e => setUser({ ...user, telefono: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Tipo de documento</label>
                                    <select
                                        value={user.tipo_documento}
                                        onChange={e => setUser({ ...user, tipo_documento: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans"
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#493523] mb-1">Número de documento</label>
                                    <input
                                        type="text"
                                        value={user.nro_doc}
                                        onChange={e => setUser({ ...user, nro_doc: e.target.value })}
                                        className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#bba180] to-[#dcc7af] text-white font-bold text-lg border-none rounded-xl py-2 shadow-md shadow-[#8c6e46]/20 cursor-pointer transition-all duration-200 hover:from-[#a88c6f] hover:to-[#cdbba5]"
                            >
                                Registrarse
                            </button>
                        </form>
                    </div>
                    {/* Derecha: fondo beige e icono centralizado */}
                    <div className="bg-[#dcc7af] flex items-center justify-center p-6">
                        <div className="bg-white rounded-2xl border-2 border-[#a58e6f] p-7 shadow-lg flex items-center justify-center">
                            <svg
                                width="80"
                                height="80"
                                viewBox="0 0 180 180"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="block"
                            >
                                <rect width="180" height="180" fill="#dcc7af" />
                                <polygon
                                    points="60,110 150,110 150,135 60,135"
                                    fill="#cdbba5"
                                    opacity="0.7"
                                    transform="translate(20,35) skewX(-32)"
                                />
                                <polygon
                                    points="30,90 90,45 150,90 150,150 30,150"
                                    fill="#fff"
                                    stroke="#fff"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="80"
                                    y="115"
                                    width="20"
                                    height="35"
                                    fill="#dcc7af"
                                />
                                <rect
                                    x="120"
                                    y="65"
                                    width="10"
                                    height="20"
                                    fill="#fff"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}