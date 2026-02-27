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

  function flashTitle() {
  const originalTitle = document.title;
  let count = 0;

  const interval = setInterval(() => {
    if (document.title === "🔔 ĐƠN MỚI !!!") {
      document.title = originalTitle;
    } else {
      document.title = "🔔 ĐƠN MỚI !!!";
    }

    count++;

    // Sau 5 lần thì dừng
    if (count >= 5) {
      clearInterval(interval);
      document.title = originalTitle;
    }
  }, 1000);
}

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
  const newOrder = payload.new;

async (payload) => {
  playSound();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🔔 Đơn hàng mới!", {
      body: `${payload.new.customer_name} - ${payload.new.total_price} đ`,
      icon: "/logo.png",
      tag: "new-order"
    });
  }

  flashTitle();

  // 🔥 QUAN TRỌNG: gọi lại fetch để có danh sách món
  await fetchOrders();
}}
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuth]);

  async function fetchOrders() {
  const { data } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        quantity,
        price,
        products (
          name
        )
      )
    `)
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
    localStorage.setItem("admin", "true");
    setIsAuth(true);

    // xin quyền thông báo
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // mở quyền âm thanh
    const audio = new Audio("/ding.mp3");
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {});
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
          <div style={{ marginTop: 10 }}>
  <b>Danh sách món:</b>
  {order.order_items?.map((item, index) => (
    <div key={index}>
      - {item.products?.name} x {item.quantity}
    </div>
  ))}
</div>

          <button onClick={() => completeOrder(order.id)}>
            Hoàn thành
          </button>
        </div>
      ))}
    </div>
  );
}

export default Admin;