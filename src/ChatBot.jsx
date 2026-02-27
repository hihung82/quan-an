import React, { useState } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const responses = {
    "mở cửa": "Quán mở cửa từ 14h đến 23h tối.",
    "địa chỉ": "Quán ở 03 Đường Nguyễn Văn Linh, Vĩnh Phúc.",
    "ship": "Quán có giao hàng trong bán kính 5km.",
    "menu": "Bạn có thể xem menu ngay trên trang chủ nhé!",
    "bán chạy": "Món bán chạy nhất là bánh tráng nướng và bánh tráng trộn."
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    let reply = "Xin lỗi, vui lòng gọi 09xxxxxxxx để được hỗ trợ.";

    for (let key in responses) {
      if (input.toLowerCase().includes(key)) {
        reply = responses[key];
        break;
      }
    }

    const botMessage = { text: reply, sender: "bot" };

    setMessages([...messages, userMessage, botMessage]);
    setInput("");
  };

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

          <div style={{ display: "flex" }}>
            <input
              style={{ flex: 1, padding: 10, border: "none" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
