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
    member_name,
    products (
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

  const grouped = items.reduce((acc, item) => {

  const name = item.member_name || "Khách"

  if (!acc[name]) {
    acc[name] = []
  }

  acc[name].push(item)

  return acc

}, {})

  return (
    <div style={{ padding: 20 }}>

      <h2>Trạng thái đơn hàng</h2>

      <h3>{text}</h3>

      <p>Khách: {order.customer_name}</p>
      <p>SĐT: {order.phone}</p>
      <p>Địa chỉ: {order.address}</p>
      <p>📝 Ghi chú: {order.note}</p>
        <p>Tổng tiền dự kiến: <b>{order.total_amount.toLocaleString("vi-VN")} đ</b></p>

        <h3>Món đã đặt</h3>

{Object.entries(grouped).map(([member, list]) => (

  <div key={member} style={{marginBottom:"10px"}}>

    <b>👤 {member}</b>

    {list.map((i, idx)=>(
      <div key={idx} style={{marginLeft:"10px"}}>
        - {i.products?.name} x{i.quantity}
      </div>
    ))}

  </div>

))}

    </div>
  )
}
export default OrderTracking;