import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./pages/ShopPage"
import Admin from "./pages/AdminPage"
import Login from "./pages/LoginPage"
import ReactDOM from "react-dom/client"
import SuperAdmin from "./pages/SuperAdmin"
import OrderTracking from "./pages/OrderTracking"
import ShopList from "./pages/ShopList";
import GroupOrder from "./pages/GroupOrder"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/shop/:slug" element={<App />} />
      <Route path="/admin/:slug" element={<Admin />} />
      <Route path="/login/:slug" element={<Login />} />
      <Route path="/super-admin" element={<SuperAdmin />} />
      <Route path="/shop/:slug/order/:id" element={<OrderTracking />} />
      <Route path="/shop" element={<ShopList />} />
      <Route path="/shop/:slug/group/:groupId" element={<GroupOrder />} />
    </Routes>
  </BrowserRouter>
)