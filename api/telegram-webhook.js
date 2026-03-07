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

    const data = req.body
    const message = data?.message

    if (message) {
      const chatId = message.chat.id
      const text = message.text

      console.log("CHAT ID:", chatId)

      if (text === "/start") {

        await supabase
          .from("telegram_connections")
          .insert({
            chat_id: chatId
          })

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
    }

    return res.status(200).send("ok")

  } catch (err) {
    console.error(err)
    return res.status(200).send("ok")
  }
}