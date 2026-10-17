import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from '@/lib';
import Login from './pages/Login';
import Layout from './Layout';
import TripsIndex from './pages/TripsIndex';
import TripDetail from './pages/TripDetail';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Drivers from './pages/Drivers';
import Payments from './pages/Payments';
import RoutePlanner from './pages/RoutePlanner';

const RequireAuth = ({ children }: { children: React.ReactNode }) =>
  getToken() ? <>{children}</> : <Navigate to="/login" replace />;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<TripsIndex />} />
        <Route path="trips/:id" element={<TripDetail />} />
        <Route path="routes/new" element={<RoutePlanner />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="payments" element={<Payments />} />
      </Route>
      <Route path="trips/new" element={<Navigate to="/routes/new" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
