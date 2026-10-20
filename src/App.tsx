import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
function Empty() {
  return <div style={{ background: '#161826', color: '#e9e9ed', minHeight: '100vh' }}><h1>Em breve</h1></div>;
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/catalogo" element={<Empty />} />
        <Route path="/operacoes" element={<Empty />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
