import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_PASSWORD = "123456";

function Admin() {
  const [input, setInput] = useState("");
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("admin") === "true"
  );
  const [orders, setOrders] = useState([]);

  // 🔔 phát âm thanh
  const playSound = () => {
    const audio = new Audio("/ding.mp3");
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!isAuth) return;

    fetchOrders();

    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Đơn mới:", payload);
          setOrders((prev) => [payload.new, ...prev]); // thêm trực tiếp
          playSound(); // 🔔 kêu khi có đơn mới
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleLogin() {
    if (input === ADMIN_PASSWORD) {
      localStorage.setItem("admin", "true");  // ✅ lưu login
      setIsAuth(true);
    } else {
      alert("Sai mật khẩu");
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin");
    setIsAuth(false);
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
      <button onClick={handleLogout}>Đăng xuất</button>

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