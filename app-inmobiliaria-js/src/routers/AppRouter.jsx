import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage, HomePage } from "../pages";
import PrivateRouter from "./PrivateRouter";


const AppRouter = () => {
    return (
        <Router>
            <Routes>

                {/*Rutas Publicas*/}
                <Route path="/" element={<PublicLayout/>}>
                    <Route path="/" element={<LoginPage/>}/>
                    <Route path="*" element={<NotFoundPage/>}/>
                </Route>

                {/*Rutas Privadas*/}
                <Route path="/" element={<PrivateRouter></PrivateRouter>}>
                    <Route path="/home" element={<HomePage/>}/>
                </Route>

            </Routes>
        </Router>
    );
}

export default AppRouter;