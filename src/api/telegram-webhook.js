import { supabase } from "../src/services/supabase"

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).send("ok")
  }

  console.log("TELEGRAM DATA:", req.body)

  const message = req.body?.message
  if (!message) return res.status(200).send("ok")

  const chatId = message.chat.id
  const text = message.text || ""

  if (text.startsWith("/start")) {

    const shopId = text.split(" ")[1]

    if (shopId) {
      await supabase
        .from("telegram_connections")
        .insert({
          shop_id: shopId,
          chat_id: chatId
        })
    }

  }
/* note*/
  res.status(200).send("ok")
}