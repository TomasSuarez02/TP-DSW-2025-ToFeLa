import { useParams, useNavigate } from "react-router-dom";

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // buscar la info de la propiedad usando el id, con un fetch 
    // ejemplo:
    const property = {
        id,
        title: "Casa Moderna en Palermo",
        address: "Calle Falsa 123, CABA",
        price: "$200,000",
        description: "Hermosa casa moderna con jardín y pileta.",
        image: "https://via.placeholder.com/600x400",
        rooms: 3,
        bathrooms: 2,
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
            <img src={property.image} alt={property.title} style={{ width: "100%", borderRadius: 8 }} />
            <h1>{property.title}</h1>
            <p><strong>Dirección:</strong> {property.address}</p>
            <p><strong>Precio:</strong> {property.price}</p>
            <p><strong>Habitaciones:</strong> {property.rooms} | <strong>Baños:</strong> {property.bathrooms}</p>
            <p>{property.description}</p>
            <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
                <button onClick={() => navigate(`/visita/${id}`)} style={{ padding: "12px 24px" }}>Solicitar Visita</button>
                <button onClick={() => navigate(`/reservar/${id}`)} style={{ padding: "12px 24px" }}>Reservar</button>
            </div>
        </div>
    );
}