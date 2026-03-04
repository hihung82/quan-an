import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Link } from "react-router-dom";
import "./index.css";
import ChatBot from "./ChatBot";
import { useParams } from "react-router-dom"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import Login from "./Login";




function App() {
  const { slug } = useParams()
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shop, setShop] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: ""
  });

  // =============================
  // LOAD PRODUCTS
  // =============================
 useEffect(() => {
  if (!slug) return;

  async function fetchProducts() {
    console.log("Slug:", slug);

    const { data: shop, error: shopError } = await supabase
      .from("shop") // sửa ở đây
      .select("id")
      .eq("slug", slug)
      .single();

    if (shopError || !shop) {
      console.error("Không tìm thấy shop:", shopError);
      return;
    }
    setShop(shop);

    console.log("Shop ID:", shop.id);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shop.id);

    if (error) {
      console.error("Lỗi tải sản phẩm:", error);
      return;
    }

    console.log("Products:", data);

    setProducts(data || []);
  }

  fetchProducts();
}, [slug]);

  // =============================
  // CART LOGIC
  // =============================
  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      setCart(
        cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // =============================
  // CREATE ORDER
  // =============================
  async function placeOrder() {
    if (cart.length === 0) {
      alert("Vui lòng chọn món");
      return;
    }

    if (!form.name || !form.phone || !form.address) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // 1️⃣ Tạo order
   const { data: order, error } = await supabase
  .from("orders")
  .insert({
    shop_id: shop.id,
    customer_name: form.name,
    phone: form.phone,
    address: form.address,
    note: form.note,
    total_amount: total,
    status: "pending"
  })
  .select()
  .single();

    if (error) {
      console.error("Lỗi tạo đơn:", error);
      alert("Không thể tạo đơn hàng");
      return;
    }

    // 2️⃣ Thêm order_items
    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Lỗi thêm sản phẩm:", itemsError);
      alert("Lỗi khi thêm sản phẩm vào đơn");
      return;
    }

    // 3️⃣ Thành công
    setShowSuccess(true);
    setCart([]);
    setForm({
      name: "",
      phone: "",
      address: "",
      note: ""
    });
  }

  // =============================
  // UI
  // =============================
 return (
  <div style={{ padding: 20 }}>
    <div className="header">
      <div className="top-bar">
        <div className="brand">
          <img src="/logo.png" alt="logo" className="logo" />
          <span className="shop-name">CHỊ BÍCH BÁNH TRÁNG</span>
        </div>

        <button
          onClick={() => window.location.href = "/admin"}
          className="admin-btn"
        >
          Admin
        </button>
      </div>
    </div>

    <h1 className="menu-title">MENU</h1>

    <div className="menu-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={product.image_url} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><b>{product.price} đ</b></p>

          <button
            className="button"
            onClick={() => addToCart(product)}
          >
            Thêm vào giỏ
          </button>
        </div>
      ))}
    </div>

    <h2>Giỏ hàng</h2>

    {cart.length === 0 ? (
      <p style={{ color: "#888" }}>Vui lòng chọn món</p>
    ) : (
      cart.map(item => (
        <div key={item.id}>
          {item.name} x {item.quantity}
        </div>
      ))
    )}

    <h3>Tổng: {total} đ</h3>

    <h2>Thông tin đặt hàng</h2>

    <input
      placeholder="Tên"
      value={form.name}
      onChange={e => setForm({ ...form, name: e.target.value })}
    />
    <br />

    <input
      placeholder="Số điện thoại"
      value={form.phone}
      onChange={e => setForm({ ...form, phone: e.target.value })}
    />
    <br />

    <input
      placeholder="Địa chỉ"
      value={form.address}
      onChange={e => setForm({ ...form, address: e.target.value })}
    />
    <br />

    <textarea
      placeholder="Ghi chú"
      value={form.note}
      onChange={e => setForm({ ...form, note: e.target.value })}
    />
    <br />

    <button onClick={placeOrder}>
      Đặt món
    </button>

    {showSuccess && (
      <div className="overlay">
        <div className="popup">
          <h3>🎉 Đặt hàng thành công!</h3>
          <p>Quán sẽ chuẩn bị món ngay.</p>

          <button
            className="button"
            onClick={() => setShowSuccess(false)}
          >
            OK
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default App;