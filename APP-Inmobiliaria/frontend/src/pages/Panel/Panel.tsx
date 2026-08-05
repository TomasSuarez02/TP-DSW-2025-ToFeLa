import { useState } from "react";
import Header from "../../components/Header";
import Propiedades from "./Propiedades";
import Clientes from "./Clientes";
import Visitas from "./Visitas";
import Senias from "./Senias.tsx";
import Documentacion from "./Documentacion";

// 1. Declaramos la interfaz para recibir la prop desde el Router
interface PanelProps {
  isAgent?: boolean;
}

export default function Panel({ isAgent = true }: PanelProps) {
  // 2. Si es cliente, la sección activa por defecto DEBE ser 'senias'
  const [activeSection, setActiveSection] = useState(isAgent ? 'propiedades' : 'senias');

  const sections = [
    { id: 'propiedades', name: 'Propiedades', icon: '🏠' },
    { id: 'clientes', name: 'Clientes', icon: '👥' },
    { id: 'visitas', name: 'Visitas', icon: '📅' },
    { id: 'senias', name: 'Señas', icon: '💰' },
    { id: 'documentacion', name: 'Documentación', icon: '📄' },
  ];

  const renderContent = () => {
    try {
      switch (activeSection) {
        case 'propiedades':
          return <Propiedades />;
        case 'clientes':
          return <Clientes />;
        case 'visitas':
          return <Visitas />;
        case 'senias':
          // 3. Le pasamos la condición al subcomponente para que filtre sus botones
          return <Senias isAgent={isAgent} />;
        case 'documentacion':
          return <Documentacion />;
        default:
          return isAgent ? <Propiedades /> : <Senias isAgent={isAgent} />;
      }
    } catch (error) {
      console.error('Error rendering section:', error);
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error al cargar la sección</p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af]">
        <div className="container mx-auto max-w-screen-2xl">
          <div className="flex">
            
            {/* 4. El Sidebar SOLO se renderiza si es Agente Administrador */}
            {isAgent && (
              <div className="w-64 bg-white shadow-lg min-h-screen relative"> {/* Cambié a relative para controlar el Info abajo */}
                <div className="p-6 border-b border-neutral-200">
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-wide">Panel Admin</h1>
                  <p className="text-sm text-neutral-600 mt-1">Sistema de gestión</p>
                </div>
                
                <nav className="mt-6">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#f2e5d8] text-neutral-900 border-r-3 border-[#dcc7af]'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <span className="text-xl mr-3">{section.icon}</span>
                      <span className="font-medium">{section.name}</span>
                    </button>
                  ))}
                </nav>

                {/* Info del usuario logueado en el Sidebar */}
                <div className="absolute bottom-0 w-64 p-6 border-t border-neutral-200 bg-white">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#dcc7af] rounded-full flex items-center justify-center text-sm font-medium">
                      A
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">Admin</p>
                      <p className="text-xs text-neutral-600">Administrador</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* 5. Si es cliente, le damos un título contextual arriba de la tabla ya que no tiene sidebar */}
              {!isAgent && (
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-neutral-900 tracking-wide">Mis Señas Realizadas</h1>
                  <p className="text-sm text-neutral-600 mt-1">Historial de reservas de propiedades y montos a favor</p>
                </div>
              )}
              {renderContent()}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}