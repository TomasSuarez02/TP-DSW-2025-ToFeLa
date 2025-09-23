//import { Route ,Routes} from 'react-router-dom'
//import Home from './pages/Home.tsx';
//import Contact from './pages/Contact.tsx';
//import Rent from './pages/Rent.tsx';
//import Visit from './pages/Visit.tsx';
//import Reserv from './pages/Reserv.tsx';
//import Login from './pages/Login.tsx';

//export default function App() {
//  return (
//    <Routes>
//      <Route path='/' element={<Home/>}/>
//      <Route path='/Contact' element={<Contact/>}/>
//      <Route path='/Rent' element={<Rent/>}/>
//      <Route path='/Rent/Visit' element={<Visit/>}/>
//      <Route path='/Rent/Reserv' element={<Reserv/>}/>
//      <Route path='/Login' element={<Login/>}/>
//      
//    </Routes>
//  )
//}

import { Route ,Routes} from 'react-router-dom';
import Home from './pages/Home.tsx';
import Contact from './pages/Contact.tsx';
import Rent from './pages/Rent.tsx';
import Visit from './pages/Visit.tsx';
import Reserv from './pages/Reserv.tsx';
import Login from './pages/Login.tsx';
import PropertyDetail from './pages/PropertyDetail'; // <- este es tu nuevo componente

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/Contact' element={<Contact/>}/>
      <Route path='/Rent' element={<Rent/>}/>
      <Route path='/Rent/Visit' element={<Visit/>}/>
      <Route path='/Rent/Reserv' element={<Reserv/>}/>
      <Route path='/Login' element={<Login/>}/>
      <Route path='/propiedad/:id' element={<PropertyDetail />} /> {/* <- nueva ruta */}
    </Routes>
  )
}