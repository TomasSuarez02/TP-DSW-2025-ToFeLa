import Header from "../components/Header.tsx"

export default function Contact() {
    return (
        <>
            <Header/>
            <div style={{
                maxWidth: "400px",
                margin: "40px auto",
                padding: "28px",
                borderRadius: "14px",
                background: "#a48460", // Marrón claro
                boxShadow: "0 4px 18px rgba(162,132,96,0.10)",
                border: "1.5px solid #d2bba0"
            }}>
                <div style={{textAlign: "center", marginBottom: "18px"}}>
                    <svg width={80} height={80} fill="none" viewBox="0 0 24 24" style={{marginBottom: "8px"}}>
                        <rect width="24" height="24" rx="5" fill="#e1d3bc"/>
                        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="#4b2e1c" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="m4 7 8 7 8-7" stroke="#d2bba0" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <h2 style={{
                        fontWeight: "bold",
                        color: "#4b2e1c", // Marrón más fuerte
                        letterSpacing: "1px",
                        margin: 0,
                        fontSize: "1.25rem"
                    }}>CONTÁCTESE CON NOSOTROS</h2>
                    <p style={{
                        color: "#4b2e1c",
                        fontSize: "1rem",
                        margin: "10px 0 0 0"
                    }}>
                        Déjanos tus datos, te contactaremos a la brevedad.
                    </p>
                </div>
                <form>
                    <input
                        type="text"
                        placeholder="Nombre"
                        style={inputStyle}
                    />
                    <input
                        type="text"
                        placeholder="Apellido"
                        style={inputStyle}
                    />
                    <input
                        type="text"
                        placeholder="Celular"
                        style={inputStyle}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        style={inputStyle}
                    />
                    <textarea
                        placeholder="Mensaje"
                        rows={4}
                        style={{
                            ...inputStyle,
                            resize: "none",
                            height: "80px"
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            width: "100%",
                            background: "#4b2e1c", // Marrón aún más fuerte
                            color: "#f3ecdb", // Marfil
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "12px",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(75,46,28,0.09)"
                        }}
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </>
    )
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1.5px solid #d2bba0", // Arena claro
    background: "#fffdfa", // Blanco/beige muy suave
    color: "#4b2e1c", // Marrón aún más fuerte
    outline: "none"
};