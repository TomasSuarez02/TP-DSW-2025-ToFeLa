import { Routes, Route } from "react-router-dom";
import { Contact, Home, Login, Rent, Reserv, Visit } from "../pages/index.tsx";
import Panel from "../pages/Panel/Panel.tsx";
import { Register } from "../pages/Login/Register.tsx";
import Page from "../pages/Rent/Page.tsx";
import Checkout from "../pages/Checkout/Checkout.tsx";


export const AppRouter = () => {
  return (
    <Routes>

        {/*Rutas Publicas*/}
        <Route path='/' element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/contact" element={<Contact/>}/>

        {/*Rutas Privadas*/}
        <Route path="/Rent/visit" element={<Visit/>}/>
        <Route path="/Rent/Reserv" element={<Reserv/>}/>
        <Route path="/Rent" element={<Rent/>}/>
        <Route path="/Panel" element={<Panel/>}/>
        <Route path="/register" element={<Register  />}/>
        <Route path="/Rent/property/:id" element={<Page/>}/>
        <Route path="/MisSenias" element={<Panel isAgent={false} />} />
        <Route path="/checkout/:seniaId" element={<Checkout/>}/>

    </Routes>
    )
}