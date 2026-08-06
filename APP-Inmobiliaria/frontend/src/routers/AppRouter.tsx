import { Routes, Route, Navigate } from "react-router-dom";
import { Contact, Home, Login, NoEncontrado, Rent } from "../pages/index.tsx";
import PanelLayout from "../pages/Panel/PanelLayout.tsx";
import { SECCIONES_AGENTE, SECCIONES_CLIENTE } from "../pages/Panel/secciones.ts";
import Propiedades from "../pages/Panel/Propiedades.tsx";
import Clientes from "../pages/Panel/Clientes.tsx";
import Visitas from "../pages/Panel/Visitas.tsx";
import Senias from "../pages/Panel/Senias.tsx";
import Documentacion from "../pages/Panel/Documentacion.tsx";
import MiDocumentacion from "../pages/Panel/MiDocumentacion.tsx";
import Agentes from "../pages/Panel/Agentes.tsx";
import { Register } from "../pages/Login/Register.tsx";
import Page from "../pages/Rent/Page.tsx";
import Checkout from "../pages/Checkout/Checkout.tsx";
import { RutaProtegida } from "../auth/RutaProtegida.tsx";


export const AppRouter = () => {
  return (
    <Routes>

        {/*Rutas Publicas: el catálogo se navega sin cuenta, que es el punto del sitio*/}
        <Route path='/' element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/register" element={<Register  />}/>
        <Route path="/Rent" element={<Rent/>}/>
        <Route path="/Rent/property/:id" element={<Page/>}/>

        {/*Rutas Privadas: hace falta sesión iniciada.
           /Rent/visit y /Rent/Reserv se sacaron: eran dos stubs con un <h1>
           ("Página de visitas", "Reserv Page") enrutados en producción, sin
           un solo link que llevara a ellos. La visita del cliente todavía no
           existe como flujo; cuando exista, entra acá con su pantalla real.*/}
        <Route path="/checkout/:clave" element={<RutaProtegida><Checkout/></RutaProtegida>}/>

        {/*Backoffice: además de sesión, rol de agente.
           Cada sección es una ruta propia, así que se puede compartir el link,
           volver con el botón "atrás" y recargar sin perder dónde se estaba.*/}
        <Route
          path="/panel"
          element={
            <RutaProtegida rol="agente">
              <PanelLayout titulo="Panel" subtitulo="Sistema de gestión" secciones={SECCIONES_AGENTE} />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/panel/propiedades" replace/>}/>
          <Route path="propiedades" element={<Propiedades/>}/>
          <Route path="clientes" element={<Clientes/>}/>
          <Route path="visitas" element={<Visitas/>}/>
          <Route path="senias" element={<Senias/>}/>
          <Route path="documentacion" element={<Documentacion/>}/>
          <Route path="agentes" element={<Agentes/>}/>
        </Route>

        {/*La cuenta del cliente: el mismo marco, otras dos secciones.*/}
        <Route
          path="/mi-cuenta"
          element={
            <RutaProtegida>
              <PanelLayout titulo="Mi cuenta" subtitulo="Reservas y documentación" secciones={SECCIONES_CLIENTE} />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/mi-cuenta/senias" replace/>}/>
          <Route path="senias" element={<Senias isAgent={false}/>}/>
          <Route path="documentos" element={<MiDocumentacion/>}/>
        </Route>

        {/*Compatibilidad con las URLs viejas. /Panel no necesita entrada propia:
           el matcheo de React Router ignora mayúsculas y ya cae en /panel.*/}
        <Route path="/MisSenias" element={<Navigate to="/mi-cuenta/senias" replace/>}/>

        {/*Todo lo demás. Sin esta entrada, una URL mal escrita no coincidía con
           ninguna ruta y React Router no dibujaba nada: la ventana quedaba en
           blanco, sin Header ni forma de volver.*/}
        <Route path="*" element={<NoEncontrado/>}/>

    </Routes>
    )
}
