import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AdminApprovals } from "./pages/admin/AdminApprovals";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminListings } from "./pages/admin/AdminListings";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { ListingFormPage } from "./pages/ListingFormPage";
import { MarketLayout } from "./pages/MarketLayout";
import { MarketPage } from "./pages/MarketPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { OrdersPage } from "./pages/OrdersPage";
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
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="listings" element={<MyListingsPage />} />
          <Route path="listings/new" element={<ListingFormPage />} />
          <Route path="listings/:productId" element={<ListingFormPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
