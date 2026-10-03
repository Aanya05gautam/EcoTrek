import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Identify from "./pages/Identify";
import Recommendation from "./pages/Recommendation";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import ReportDetails from "./pages/ReportDetails";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/report/:id" element={<ReportDetails />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
