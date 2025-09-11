import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Login from './components/Login';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';

function ProtectedDashboard(){
    const chatOpen = useSelector((state: RootState) => state.system.chatOpen);
    return (
        <div className="flex flex-row gap-2 px-4">
            <Sidebar />
            <Dashboard />
            {chatOpen && <Chat />}
        </div>
    )
}

function App() {
    const { isAuthenticated } = useAuth();
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
                <Route path="/dashboard" element={isAuthenticated ? <ProtectedDashboard /> : <Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;