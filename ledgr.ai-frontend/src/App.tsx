import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

function App() {
    const chatOpen = useSelector((state: RootState) => state.system.chatOpen);
    return (
        <div className="flex flex-row gap-2 px-4">
            <Sidebar />
            <Dashboard />
            {chatOpen && <Chat />}
        </div>
    );
}

export default App;