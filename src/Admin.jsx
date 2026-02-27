import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function Admin() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Đơn hàng mới</h1>

      {orders.map(order => (
        <div key={order.id} style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          <h3>{order.customer_name}</h3>
          <p>{order.phone}</p>
          <p>{order.address}</p>
          <p><b>{order.total_price} đ</b></p>
          <button onClick={() => completeOrder(order.id)}>
            Hoàn thành
          </button>
        </div>
      ))}
    </div>
  );
}

export default Admin;