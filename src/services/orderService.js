import { supabase } from "./supabase";



const API_URL = "http://localhost:8206";

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`)

  if (!res.ok) {
    throw new Error("Failed to fetch orders")
  }

  return await res.json()
}

export async function createOrder(order) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  })

  if (!res.ok) {
    throw new Error("Failed to create order")
  }

  return await res.json()
}

export async function createOrderWithItems(shop, form, cart, total ) {

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
    .single()

  if (error) throw error

  const orderItems = cart.map(item => ({
    order_id: order.id,
    product_id: item.product_id || item.id,
    quantity: item.quantity,
    price: item.price,
    member_name: item.member_name || form.name
  }))

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)

  if (itemsError) throw itemsError

  return order
}