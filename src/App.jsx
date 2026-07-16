import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Invest from "./pages/Invest.jsx";
import FirstHomeBuyers from "./pages/FirstHomeBuyers.jsx";
import BudgetDashboard from "./pages/BudgetDashboard.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/invest" element={<Invest />} />
      <Route path="/first-home-buyers" element={<FirstHomeBuyers />} />
      <Route path="/budget-dashboard" element={<BudgetDashboard />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
