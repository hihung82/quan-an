import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../services/supabase"

function OrderTracking() {

  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    loadOrder()

    const channel = supabase
      .channel("order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`
        },
        (payload) => {
          setOrder(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])

  async function loadOrder() {

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    setOrder(data)

    const { data: itemsData } = await supabase
    .from("order_items")
    .select(`
        quantity,
        product:product_id (
        name
        )
    `)
    .eq("order_id", id)

    setItems(itemsData)
  }

  if (!order) return <p>Loading...</p>

  let text = ""

  if (order.status === "pending") text = "⏳ Chờ shop xác nhận"
  if (order.status === "preparing") text = "🍳 Shop đang làm"
  if (order.status === "completed") text = "🚚 Đang giao"

  return (
    <div style={{ padding: 20 }}>

      <h2>Trạng thái đơn hàng</h2>

      <h3>{text}</h3>

      <p>Khách: {order.customer_name}</p>
      <p>SĐT: {order.phone}</p>
      <p>Địa chỉ: {order.address}</p>
      <p>📝 Ghi chú: {order.note}</p>

        <h3>Món đã đặt</h3>

        {items?.map((i, index) => (
        <div key={index}>
            {i.product?.name} x{i.quantity}
        </div>
        ))}

    </div>
  )
}
export default OrderTracking;