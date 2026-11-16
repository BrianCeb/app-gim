import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { DatosProvider } from './context/DatosContext';
import { AvisosProvider } from './context/AvisosContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import InicioPage from './pages/InicioPage';
import PanelPage from './pages/PanelPage';
import AlumnosPage from './pages/AlumnosPage';
import IngresosPage from './pages/IngresosPage';
import PagosPage from './pages/PagosPage';
import PersonalPage from './pages/PersonalPage';
import PlanesPage from './pages/PlanesPage';
import { Cargando, EstadoVacio } from './components/ui';
import './index.css';

// Los gráficos pesan bastante: se descargan solo al abrir Estadísticas
const EstadisticasPage = lazy(() => import('./pages/EstadisticasPage'));

function NoEncontrada() {
    return (
        <EstadoVacio titulo="Página no encontrada" descripcion="La dirección no existe.">
            <Link to="/" className="font-semibold text-slate-900 underline">
                Volver al panel
            </Link>
        </EstadoVacio>
    );
}

// Orden de los Providers: AuthProvider usa los avisos, por eso va adentro de AvisosProvider.
// DatosProvider va DENTRO de la parte protegida: solo carga datos y abre el socket
// cuando hay sesión, y al cerrarla se desmonta (y corta el socket).
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AvisosProvider>
                <AuthProvider>
                    <Routes>
                        {/* Pública: propuesta de valor + login */}
                        <Route path="/ingresar" element={<InicioPage />} />

                        {/* Todo lo demás exige sesión */}
                        <Route
                            element={
                                <RutaProtegida>
                                    <DatosProvider>
                                        <Layout />
                                    </DatosProvider>
                                </RutaProtegida>
                            }
                        >
                            <Route path="/" element={<PanelPage />} />
                            <Route path="/ingresos" element={<IngresosPage />} />
                            <Route path="/alumnos" element={<AlumnosPage />} />
                            <Route path="/pagos" element={<PagosPage />} />
                            <Route
                                path="/estadisticas"
                                element={
                                    <RutaProtegida permiso="estadisticas">
                                        <Suspense fallback={<Cargando />}>
                                            <EstadisticasPage />
                                        </Suspense>
                                    </RutaProtegida>
                                }
                            />
                            {/* Ajustes: dos pestañas, cada una con su ruta */}
                            <Route
                                path="/planes"
                                element={
                                    <RutaProtegida permiso="planes">
                                        <PlanesPage />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/personal"
                                element={
                                    <RutaProtegida permiso="personal">
                                        <PersonalPage />
                                    </RutaProtegida>
                                }
                            />
                            <Route path="*" element={<NoEncontrada />} />
                        </Route>
                    </Routes>
                </AuthProvider>
            </AvisosProvider>
        </BrowserRouter>
    </StrictMode>
);
