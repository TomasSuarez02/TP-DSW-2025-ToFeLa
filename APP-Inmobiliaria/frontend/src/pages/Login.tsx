import Header from "../components/Header.tsx";

export default function Login() {
  return (
    <>
      <Header />
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f6f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            boxShadow: "0 4px 24px rgba(80,60,40,0.08)",
            borderRadius: "18px",
            overflow: "hidden",
            background: "#fff",
            maxWidth: 625,
            width: "96vw",
            minHeight: 380,
            border: "3px solid #222", // borde negro
          }}
        >
          {/* Izquierda: Formulario */}
          <div
            style={{
              padding: "28px 20px",
              flex: 1.1,
              background: "#f2e5d8",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                marginBottom: 22,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: `'Times New Roman', Times, serif`,
                  letterSpacing: "0.11em",
                  fontSize: 23,
                  color: "#222",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                INICIAR SESIÓN
              </span>
            </div>
            <form>
              <input
                type="email"
                placeholder="Correo electrónico"
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  fontSize: 15,
                  borderRadius: 8,
                  border: "1.2px solid #e5d4c0",
                  marginBottom: 14,
                  background: "#fbf7f3",
                  color: "#493523",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="password"
                placeholder="Contraseña"
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  fontSize: 15,
                  borderRadius: 8,
                  border: "1.2px solid #e5d4c0",
                  marginBottom: 14,
                  background: "#fbf7f3",
                  color: "#493523",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14,
                  color: "#493523",
                  marginBottom: 13,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  style={{
                    accentColor: "#bba180",
                    marginRight: 7,
                  }}
                />
                Recordar
              </label>
              <button
                type="submit"
                style={{
                  width: "100%",
                  background: "#bba180",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 9,
                  padding: "10px 0",
                  marginBottom: 7,
                  boxShadow: "0 2px 12px rgba(140,110,70,0.09)",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
              >
                Log in
              </button>
              <div
                style={{
                  color: "#a08974",
                  fontSize: 14,
                  marginTop: 4,
                  textAlign: "left",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Guardar la contraseña
              </div>
            </form>
          </div>
          {/* Derecha: fondo beige e icono centralizado */}
          <div
            style={{
              flex: 0.95,
              background: "#dcc7af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Icono casa minimalista en recuadro blanco con borde y sombra */}
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "2px solid #a58e6f",
                padding: 20,
                boxShadow: "0 2px 10px rgba(100,70,40,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* SVG casa minimalista */}
              <svg
                width="70"
                height="70"
                viewBox="0 0 180 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  display: "block",
                }}
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