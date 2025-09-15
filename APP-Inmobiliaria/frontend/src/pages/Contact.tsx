import Header from "../components/Header.tsx"

export default function Contact() {
    return (
        <>
            <Header/>
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="rounded-2xl shadow-lg overflow-hidden border-1 border-black max-w-[450px] w-full m-6 bg-[#f3e5d1] flex flex-col items-center">
                    {/* Icono de teléfono */}
                    <div className="flex justify-center items-center mt-[22px] mb-[5px]">
                        <div className="bg-[#bfa383] rounded-full w-14 h-14 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 64 64">
                                <path
                                    d="M 49 44 
                                    c -2.5 2.5 -5.5 4 -8.5 3.2
                                    c -5.2 -1.3 -16.5 -12.6 -17.8 -17.8
                                    C 21 26.5 22.5 23.5 25 21
                                    l 2.7 -2.7
                                    c 0.8 -0.8 0.8 -2 0 -2.8
                                    l -4.4 -4.4
                                    c -0.8 -0.8 -2 -0.8 -2.8 0
                                    l -3.8 3.8
                                    c -3.3 3.3 -4.7 8.1 -3.4 12.6
                                    c 2.2 7.7 15.1 20.6 22.8 22.8
                                    c 4.6 1.3 9.3 -0.1 12.6 -3.4
                                    l 3.8 -3.8
                                    c 0.8 -0.8 0.8 -2 0 -2.8
                                    l -4.4 -4.4
                                    c -0.8 -0.8 -2 -0.8 -2.8 0
                                    L 49 44 Z"
                                    stroke="#fff"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="px-5 pb-5 w-full">
                        <h2 className="font-playfair text-black text-2xl text-center font-medium m-0 mb-2">
                            CONTÁCTESE CON NOSOTROS
                        </h2>
                        <p className="font-playfair text-black text-[0.98rem] text-center mb-5">
                            Déjanos tus datos, te contactaremos a la brevedad.
                        </p>
                        <form>
                            <input
                                type="text"
                                placeholder="Nombre"
                                className="w-full px-4 py-3 mb-2 text-[1.03rem] rounded-[10px] border border-[#e3d4c2] bg-[#fffdfa] text-[#a08e7a] outline-none font-sans font-normal"
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                className="w-full px-4 py-3 mb-2 text-[1.03rem] rounded-[10px] border border-[#e3d4c2] bg-[#fffdfa] text-[#a08e7a] outline-none font-sans font-normal"
                            />
                            <input
                                type="text"
                                placeholder="Celular"
                                className="w-full px-4 py-3 mb-2 text-[1.03rem] rounded-[10px] border border-[#e3d4c2] bg-[#fffdfa] text-[#a08e7a] outline-none font-sans font-normal"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-3 mb-2 text-[1.03rem] rounded-[10px] border border-[#e3d4c2] bg-[#fffdfa] text-[#a08e7a] outline-none font-sans font-normal"
                            />
                            <textarea
                                placeholder="Mensaje"
                                rows={4}
                                className="w-full px-4 py-3 mb-2 text-[1.03rem] rounded-[10px] border border-[#e3d4c2] bg-[#fffdfa] text-[#a08e7a] outline-none font-sans font-normal resize-none h-16"
                            />
                            <button
                                type="submit"
                                className="w-full bg-[#bfa383] text-white font-bold text-xl border-none rounded-2xl py-3 mt-1.5 mb-2 cursor-pointer font-sans shadow-md shadow-[#bfa3831a] hover:bg-[#a88c6f] transition-colors duration-300"
                            >
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
