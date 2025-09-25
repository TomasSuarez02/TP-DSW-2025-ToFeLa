import { Routes, Route } from "react-router-dom";
import { Contact, Home, Login, Rent, Reserv, Visit } from "../pages/index.tsx";


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

    </Routes>
    )
}