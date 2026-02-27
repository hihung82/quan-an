import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Link } from "react-router-dom";
import "./index.css";


function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*");
    setProducts(data || []);
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const { data: order } = await supabase
      .from("orders")
      .insert({
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note,
        total_price: total
      })
      .select()
      .single();

      setShowSuccess(true);
setCart([]);

    for (let item of cart) {
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      });
    }

    alert("Đặt hàng thành công!");
    setCart([]);
    setForm({ name: "", phone: "", address: "", note: "" });
  }

  return (
    <div style={{ padding: 20 }}>
      <div className="header">
  <div className="top-bar">
  <div className="brand">
    <img src="/logo.png" alt="logo" className="logo" />
    <span className="shop-name">CHỊ BÍCH BÁNH TRÁNG</span>
  </div>

  <Link to="/admin">
    <button className="admin-btn">Admin</button>
  </Link>
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
      {cart.map(item => (
        <div key={item.id}>
          {item.name} x {item.quantity}
        </div>
      ))}

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
      <button onClick={placeOrder}>Đặt hàng</button>

      {showSuccess && (
  <div className="overlay">
    <div className="popup">
      <h3>🎉 Đặt hàng thành công!</h3>
      <p style={{ margin: "15px 0" }}>
        Quán sẽ chuẩn bị món ngay.
      </p>

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