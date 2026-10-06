import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthPage } from "./pages/AuthPage";
import { MarketLayout } from "./pages/MarketLayout";
import { MarketPage } from "./pages/MarketPage";
import { ProductPage } from "./pages/ProductPage";
import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/market" element={<MarketLayout />}>
          <Route index element={<MarketPage />} />
          <Route path="product/:productId" element={<ProductPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
