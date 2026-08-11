import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Identify from "./pages/Identify";
import Reports from "./pages/Reports";
import Pickups from "./pages/Pickups";
import Training from "./pages/Training";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Driver from "./pages/Driver";

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/pickups" element={<Pickups />} />
          <Route path="/training" element={<Training />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/driver" element={<Driver />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;