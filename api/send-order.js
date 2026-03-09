import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).send("send-order api working")
  }

  const { shop_id, order_text } = req.body

  // lấy chat_id của shop
  const { data } = await supabase
    .from("telegram_connections")
    .select("chat_id")
    .eq("shop_id", shop_id)
    .single()

  if (!data) {
    return res.status(400).json({ error: "Shop chưa connect telegram" })
  }

  const chatId = data.chat_id

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: order_text
    })
  })

  res.status(200).json({ ok: true })
}