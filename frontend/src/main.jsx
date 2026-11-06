import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { DatosProvider } from './context/DatosContext';
import { AvisosProvider } from './context/AvisosContext';
import Layout from './components/Layout';
import PanelPage from './pages/PanelPage';
import AlumnosPage from './pages/AlumnosPage';
import IngresosPage from './pages/IngresosPage';
import PagosPage from './pages/PagosPage';
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

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AvisosProvider>
                <DatosProvider>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<PanelPage />} />
                            <Route path="/ingresos" element={<IngresosPage />} />
                            <Route path="/alumnos" element={<AlumnosPage />} />
                            <Route path="/pagos" element={<PagosPage />} />
                            <Route
                                path="/estadisticas"
                                element={
                                    <Suspense fallback={<Cargando />}>
                                        <EstadisticasPage />
                                    </Suspense>
                                }
                            />
                            <Route path="*" element={<NoEncontrada />} />
                        </Route>
                    </Routes>
                </DatosProvider>
            </AvisosProvider>
        </BrowserRouter>
    </StrictMode>
);
