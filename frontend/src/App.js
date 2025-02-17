import logo from './logo.svg';
import './App.css';
import ParentComponent from './Components/ParentComponent';
import { Callback } from './Components/Callback';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      {/* <nav>
        <a href="/">Home</a> | <a href="/about">About</a> | <a href="/tokenAcquire">Acquire Token</a>
      </nav> */}
      <Routes>
        <Route path="/spotify-playlist-migration" element={<ParentComponent />} />
        <Route path='/Redirect' element={<Callback />} />
        <Route path="*" element={<Navigate to="/spotify-playlist-migration" />} />
      </Routes>
    </Router>
  );
}

export default App;
