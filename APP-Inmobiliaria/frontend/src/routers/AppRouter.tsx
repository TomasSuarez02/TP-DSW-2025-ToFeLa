import { Routes, Route } from "react-router-dom";
import { Contact, Home, Login, Rent, Reserv, Visit } from "../pages/index.tsx";
import Panel from "../pages/Panel/Panel.tsx";
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

        {/*Rutas Privadas: hace falta sesión iniciada*/}
        <Route path="/Rent/visit" element={<RutaProtegida><Visit/></RutaProtegida>}/>
        <Route path="/Rent/Reserv" element={<RutaProtegida><Reserv/></RutaProtegida>}/>
        <Route path="/checkout/:clave" element={<RutaProtegida><Checkout/></RutaProtegida>}/>
        <Route path="/MisSenias" element={<RutaProtegida><Panel isAgent={false} /></RutaProtegida>} />

        {/*Backoffice: además de sesión, rol de agente*/}
        <Route path="/Panel" element={<RutaProtegida rol="agente"><Panel/></RutaProtegida>}/>

    </Routes>
    )
}