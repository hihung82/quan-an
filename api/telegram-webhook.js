import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {

    if (req.method !== "POST") {
      return res.status(200).send("ok")
    }

    const body = req.body

    /* ----------------------------
       1️⃣ xử lý nút bấm telegram
    ---------------------------- */

if (body.callback_query) {

  const action = body.callback_query.data
  const orderId = action.split("_")[1]

  if (action.startsWith("confirm")) {
    await supabase
      .from("orders")
      .update({ status: "preparing" })
      .eq("id", orderId)
  }

  if (action.startsWith("done")) {
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId)
  }

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: body.callback_query.id
    })
  })

  return res.status(200).send("ok")
}

    /* ----------------------------
       2️⃣ xử lý /start connect shop
    ---------------------------- */

    const message = body?.message

    if (!message) return res.status(200).send("ok")

    const chatId = message.chat.id
    const text = message.text

    console.log("CHAT ID:", chatId)
    console.log("TEXT:", text)

    if (text.startsWith("/start")) {

      const shopId = text.split(" ")[1]

      const { data, error } = await supabase
        .from("telegram_connections")
        .insert({
          shop_id: shopId,
          chat_id: chatId
        })

      console.log("SUPABASE:", data, error)

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Bot đã kết nối với hệ thống ✅"
        })
      })
    }

    return res.status(200).send("ok")

  } catch (err) {
    console.error(err)
    return res.status(200).send("ok")
  }
}