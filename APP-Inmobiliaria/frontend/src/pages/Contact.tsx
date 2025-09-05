import Header from "../components/Header.tsx"

export default function Contact() {
    return (
        <>
            <Header/>
            <div style={{
                minHeight: "100vh",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div style={{
                    borderRadius: "22px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: "2.5px solid #181818",
                    maxWidth: "420px",
                    width: "100%",
                    margin: "24px",
                    background: "#f3e5d1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}>
                    {/* Icono de teléfono */}
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "22px",
                        marginBottom: "5px"
                    }}>
                        <div style={{
                            background: "#bfa383",
                            borderRadius: "50%",
                            width: "52px",
                            height: "52px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
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
                    <div style={{padding: "0 18px 18px 18px", width: "100%"}}>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "#181818",
                            fontSize: "1.4rem",
                            textAlign: "center",
                            fontWeight: 500,
                            letterSpacing: "1.5px",
                            margin: 0,
                            marginBottom: "8px"
                        }}>
                            CONTÁCTESE CON NOSOTROS
                        </h2>
                        <p style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "#181818",
                            fontSize: "0.98rem",
                            textAlign: "center",
                            marginBottom: "17px"
                        }}>
                            Déjanos tus datos, te contactaremos a la brevedad.
                        </p>
                        <form>
                            <input
                                type="text"
                                placeholder="Nombre"
                                style={inputStyleLogin}
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                style={inputStyleLogin}
                            />
                            <input
                                type="text"
                                placeholder="Celular"
                                style={inputStyleLogin}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                style={inputStyleLogin}
                            />
                            <textarea
                                placeholder="Mensaje"
                                rows={4}
                                style={{
                                    ...inputStyleLogin,
                                    resize: "none",
                                    height: "60px"
                                }}
                            />
                            <button
                                type="submit"
                                style={buttonStyleLogin}
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

const inputStyleLogin: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    marginBottom: "10px",
    fontSize: "1.03rem",
    borderRadius: "10px",
    border: "1.2px solid #e3d4c2",
    background: "#fffdfa",
    color: "#a08e7a",
    outline: "none",
    fontFamily: "'Segoe UI', 'Open Sans', Arial, sans-serif",
    fontWeight: 400,
};

const buttonStyleLogin: React.CSSProperties = {
    width: "100%",
    background: "#bfa383",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1.08rem",
    border: "none",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "6px",
    marginBottom: "8px",
    cursor: "pointer",
    fontFamily: "'Segoe UI', 'Open Sans', Arial, sans-serif",
    boxShadow: "0 2px 8px rgba(191, 163, 131, 0.10)"
};