import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import Room from "./pages/Room";
import SocketProvider from "./providers/SocketProvider";

function App() {
    return (
        <div>
            <BrowserRouter>
                <SocketProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/room/:roomId/:userType" element={<Room />} />
                    </Routes>
                </SocketProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
