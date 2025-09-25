import { useState } from "react";
import axios from "axios";
import Header from "../../components/Header.tsx";
export type UserInput ={
  email: string;
  dni: string;
}

export default function Login() {

  const [user, setUser] = useState<UserInput>({
    email: "",
    dni: ""
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email: user.email,
        password: user.dni, // el dni es la "contraseña"
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "cliente") {
        window.location.href = "/Rent";
      } else {
        window.location.href = "/Panel";
      }
    } catch (err) {
      console.log(err);
      setError("Credenciales inválidas");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af] flex items-center justify-center">
        <div className="flex shadow-2xl rounded-2xl overflow-hidden bg-white max-w-3xl w-full">
          {/* Izquierda: Formulario */}
          <div className="p-10 flex-1 bg-[#f2e5d8] flex flex-col justify-center relative">
            <div className="mb-8 text-center">
              <span className="tracking-wider text-2xl text-black font-semibold drop-shadow-sm">INICIAR SESION</span>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <p className="text-red-500">Error al iniciar sesion: email o contraseña incorrecto</p>}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#493523] mb-1">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@email.com"
                  className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#493523] mb-1">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={user.dni}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-base rounded-xl border border-[#e5d4c0] bg-[#fbf7f3] text-[#493523] outline-none font-sans focus:ring-2 focus:ring-[#bba180] transition-all duration-200"
                  onChange={(e) => setUser({ ...user, dni: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <a href="#" className="text-xs text-[#a08974] underline hover:text-[#bba180] transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#bba180] to-[#dcc7af] text-white font-bold text-lg border-none rounded-xl py-2 shadow-md shadow-[#8c6e46]/20 cursor-pointer transition-all duration-200 hover:from-[#a88c6f] hover:to-[#cdbba5]"
              >
                Ingresar
              </button>
            </form>
            <div className="mt-7 text-center">
              <span className="text-[#a08974] text-sm">¿No tienes cuenta? <a href="/register" className="underline hover:text-[#bba180] transition-colors">Regístrate</a></span>
            </div>
          </div>
          {/* Derecha: fondo beige e icono centralizado */}
          <div className="bg-[#dcc7af] flex items-center justify-center p-6">
            {/* Icono casa minimalista en recuadro blanco con borde y sombra */}
            <div className="bg-white rounded-2xl border-2 border-[#a58e6f] p-7 shadow-lg flex items-center justify-center">
              {/* SVG casa minimalista */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 180 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="block"
              >
                <rect width="180" height="180" fill="#dcc7af" />
                {/* Sombra */}
                <polygon
                  points="60,110 150,110 150,135 60,135"
                  fill="#cdbba5"
                  opacity="0.7"
                  transform="translate(20,35) skewX(-32)"
                />
                {/* Casa */}
                <polygon
                  points="30,90 90,45 150,90 150,150 30,150"
                  fill="#fff"
                  stroke="#fff"
                  strokeWidth="2"
                />
                {/* Puerta */}
                <rect
                  x="80"
                  y="115"
                  width="20"
                  height="35"
                  fill="#dcc7af"
                />
                {/* Chimenea */}
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