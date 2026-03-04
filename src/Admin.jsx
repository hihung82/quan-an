import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}, []);

  // 🔔 phát âm thanh
  const playSound = () => {
    const audio = new Audio("/ding.mp3");
    audio.play().catch(() => {});
  };

  function flashTitle() {
    const originalTitle = document.title;
    let count = 0;

    const interval = setInterval(() => {
      document.title =
        document.title === "🔔 ĐƠN MỚI !!!"
          ? originalTitle
          : "🔔 ĐƠN MỚI !!!";

      count++;
      if (count >= 5) {
        clearInterval(interval);
        document.title = originalTitle;
      }
    }, 1000);
  }

  // 🔐 Kiểm tra đăng nhập
  useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    console.log("USER:", data.user);

    if (!data.user) {
      navigate("/login");
    } else {
      setUser(data.user);
    }
  };

  checkUser();
}, []);

  // 📦 Lấy đơn hàng
  async function fetchOrders() {
    const { data, error } = await supabase
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

    if (error) {
      console.error("Lỗi lấy đơn:", error);
      return;
    }

    setOrders(data || []);
  }

  // 🚀 Realtime khi có đơn mới
 useEffect(() => {
  if (!user) return;

  fetchOrders();

  const channel = supabase
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async (payload) => {
        console.log("Change detected:", payload);

        if (payload.eventType === "INSERT") {
          playSound();
          flashTitle();
        }

        // Luôn fetch lại để đảm bảo đúng trạng thái
        fetchOrders();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);

  // ✅ Hoàn thành đơn
 async function completeOrder(id) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  fetchOrders(); // luôn sync lại từ DB
}

  // 🚪 Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (!user) return <div>Chưa đăng nhập</div>;

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
          <h3 style={{ fontStyle: "italic", color: "#555" }}>
            Khách hàng: {order.customer_name}
          </h3>

          <p style={{ fontStyle: "italic", color: "#555" }}>
            Số điện thoại: {order.phone}
          </p>

          <p style={{ fontStyle: "italic", color: "#555" }}>
            Địa chỉ: {order.address}
          </p>

          {order.note && (
            <p style={{ fontStyle: "italic", color: "#555" }}>
              📝 Ghi chú: {order.note}
            </p>
          )}

          <p>
            Tổng tiền: <b>{order.total_amount} đ</b>
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