import { Route ,Routes} from 'react-router-dom'
import Home from './pages/Home.tsx';
import Contact from './pages/Contact.tsx';
import Rent from './pages/rent.tsx';
import Visit from './pages/Visit.tsx';
import Reserv from './pages/Reserv.tsx';
import Login from './pages/Login.tsx';

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/Contact' element={<Contact/>}/>
      <Route path='/Rent' element={<Rent/>}/>
      <Route path='/Rent/Visit' element={<Visit/>}/>
      <Route path='/Rent/Reserv' element={<Reserv/>}/>
      <Route path='/Login' element={<Login/>}/>
      
    </Routes>
  )
}
