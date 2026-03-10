import { supabase } from "./supabase"

export async function sendTelegram(shopId, message, orderId) {

  const { data } = await supabase
    .from("telegram_connections")
    .select("chat_id")
    .eq("shop_id", shopId)

  if (!data || data.length === 0) return

  for (let row of data) {

    await fetch("/api/send-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
        body: JSON.stringify({
        shop_id: shopId,
        order_text: message,
        order_id: orderId
        })
    })

  }
}