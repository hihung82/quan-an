import { useState, useEffect } from "react"
import { supabase } from "../../services/supabase"

export default function ChatBot({ shopId, phone }) {

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [responses, setResponses] = useState([])

  // load responses của quán
  useEffect(() => {
    if (!shopId) return

    async function load() {
      const { data } = await supabase
        .from("chatbot_responses")
        .select("*")
        .eq("shop_id", shopId)

      setResponses(data || [])
    }

    load()
  }, [shopId])

  const handleSend = () => {

    if (!input.trim()) return

    const userMessage = { text: input, sender: "user" }

    let reply = `Vui lòng gọi số ${phone} để được hỗ trợ trực tiếp.`

    for (let r of responses) {
      if (input.toLowerCase().includes(r.keyword)) {
        reply = r.response
        break
      }
    }

    const botMessage = { text: reply, sender: "bot" }

    setMessages([...messages, userMessage, botMessage])
    setInput("")
  }

  return (
    <>
      {/* Nút mở chat */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "#ff6600",
          color: "white",
          padding: 15,
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        💬
      </div>

      {/* Hộp chat */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 300,
            height: 400,
            background: "white",
            border: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: "#ff6600",
              color: "white",
              padding: 10,
              textAlign: "center",
            }}
          >
            Hỗ trợ khách hàng
          </div>

          {/* messages */}
          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  marginBottom: 8,
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* input */}
          <div style={{ display: "flex" }}>
            <input
              style={{ flex: 1, padding: 10, border: "none" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập tin nhắn..."
            />

            <button onClick={handleSend}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  )
}