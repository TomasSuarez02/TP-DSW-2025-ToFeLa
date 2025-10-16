import { useState } from "react";
import Header from "../../components/Header";
import Propiedades from "./Propiedades";
import Clientes from "./Clientes";

export default function Panel() {
  const [activeSection, setActiveSection] = useState('propiedades');

  const sections = [
    { id: 'propiedades', name: 'Propiedades', icon: '🏠' },
    { id: 'clientes', name: 'Clientes', icon: '👥' },
    { id: 'agentes', name: 'Agentes', icon: '👤' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'propiedades':
        return <Propiedades />;
      case 'clientes':
        return <Clientes />;
      case 'agentes':
        return <div className="p-6"><h2 className="text-2xl font-semibold">Gestión de Agentes</h2><p className="text-neutral-600 mt-2"></p></div>;
      default:
        return <Propiedades/>;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f8f6f3] via-[#f2e5d8] to-[#dcc7af]">
        <div className="container mx-auto max-w-screen-2xl">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg min-h-screen">
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

              {/* User info */}
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

            {/* Main Content */}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
