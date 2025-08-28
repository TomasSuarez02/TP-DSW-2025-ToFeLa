import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Header />
      <main className="mx-auto">
        <Hero />
        {/* …resto de secciones… */}
      </main>
      <Footer />
    </>
  )
}
