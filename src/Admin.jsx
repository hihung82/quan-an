import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_PASSWORD = "123456"; // đổi mật khẩu tại đây

function Admin() {
  const [input, setInput] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const dingSound = new Audio("/ding.mp3");

  useEffect(() => {
    if (isAuth) {
        dingSound.play();  
      fetchOrders();
    }
  }, [isAuth]);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setOrders(data || []);
  }

  async function completeOrder(id) {
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", id);

    fetchOrders();
  }

  function handleLogin() {
    if (input === ADMIN_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Sai mật khẩu");
    }
  }

  if (!isAuth) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Admin</h1>
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleLogin}>Đăng nhập</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Đơn hàng mới</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <h3>{order.customer_name}</h3>
          <p>{order.phone}</p>
          <p>{order.address}</p>
          {order.note && (
        <p style={{ marginTop: 8, fontStyle: "italic", color: "#555" }}>
        📝 Ghi chú: {order.note}
        </p>
             )}
          <p>
            <b>{order.total_price} đ</b>
          </p>
          <button onClick={() => completeOrder(order.id)}>
            Hoàn thành
          </button>
        </div>
      ))}
    </div>
  );
}

export default Admin;