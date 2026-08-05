import Header from "../../components/Header.tsx"
import Grid from "./Grid.tsx"
import Footer from "../../components/Footer.tsx"

export default function Rent() {
  return (
    <>
      <Header/>
      {/* El fondo lo pone la sección: antes acá había un degradado a un
          hex suelto que quedaba por debajo del arena-50 de la grilla y
          se veía como una banda de otro color. */}
      <Grid/>
      <Footer/>
    </>
  )
}
