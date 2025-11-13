import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PVTTask from './pages/PVTTask';
import FlankerTask from './pages/FlankerTask';
import EFSITask from './pages/EFSITask';
import VASTask from './pages/VASTask';
import AllTasksFlow from './pages/AllTasksFlow';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks/pvt" element={<PVTTask />} />
        <Route path="/tasks/flanker" element={<FlankerTask />} />
        <Route path="/tasks/efsi" element={<EFSITask />} />
        <Route path="/tasks/vas" element={<VASTask />} />
        <Route path="/tasks/all" element={<AllTasksFlow />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
