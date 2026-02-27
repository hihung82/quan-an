import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
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
      <h1>MENU QUÁN ĂN</h1>

      {products.map(product => (
        <div key={product.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <img src={product.image_url} width="200" />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><b>{product.price} đ</b></p>
          <button onClick={() => addToCart(product)}>
            Thêm vào giỏ
          </button>
        </div>
      ))}

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
    </div>
  );
}

export default App;