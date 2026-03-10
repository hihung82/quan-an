import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useCart } from "../features/cart/useCart"
import { getShopBySlug } from "../services/shopService"
import { getProductsByShop } from "../services/productService"
import { createOrderWithItems } from "../services/orderService"
import  ChatBot  from "../features/chatbot/ChatBot"
import "../index.css"
import { useNavigate } from "react-router-dom"
import { sendTelegram } from "../services/telegramService"

function App() {
  const { slug } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
  console.log("slug:", slug)
  }, [slug])
  
  const [products, setProducts] = useState([]);
  const { cart, addToCart, total, setCart } = useCart()
  const [showSuccess, setShowSuccess] = useState(false);
  const [shop, setShop] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: ""
  });

  // =============================
  // LOAD PRODUCTS
  // =============================
useEffect(() => {
  if (!slug) return

  async function load() {
    try {
      const shop = await getShopBySlug(slug)
      setShop(shop)


      const products = await getProductsByShop(shop.id)
      setProducts(products)
    } catch (err) {
      console.error(err)
    }
  }

  load()
}, [slug])



  // =============================
  // CREATE ORDER
  // =============================
  async function placeOrder() {

  if (!cart || cart.length === 0) {
    alert("Bạn chưa chọn món nào");
    return;
  }
  try {
    const order = await createOrderWithItems(shop, form, cart, total)
    localStorage.setItem("orderId", order.id)
    navigate(`/shop/${slug}/order/${order.id}`)
    const itemsText = cart
    .map(item => `${item.name} x${item.quantity}`)
    .join("\n")
  sendTelegram(
    shop.id,
    `
  🔔 Đơn hàng mới

  Quán: ${shop.name}
  Khách: ${form.name}
  SĐT: ${form.phone}
  Địa chỉ: ${form.address}

  Món:
  ${itemsText}

  Ghi chú: ${form.note || "Không có"}

  Tổng: ${total}đ
  `,
  order.id
  )
    setShowSuccess(true)
    setCart([])
  } catch (err) {
    alert("Lỗi tạo đơn")
  }
}

  // =============================
  // UI
  // =============================
 return (
  <div style={{ padding: 20 }}>
    <div className="header">
      <div className="top-bar">
        <div className="brand">
          <img src="/logo.png" alt="logo" className="logo" />
          <span className="brand-name">MONLEO</span>
        </div>

        <button
          onClick={() => navigate(`/login/${slug}`)}
          className="admin-btn"
        >
          Admin
        </button>
      </div>
    </div>

{shop && (
  <div className="shop-header">
    {shop.logo_url && (
      <img
        src={shop.logo_url}
        alt={shop.name}
        className="shop-logo"
      />
    )}
    <h2 className="shop-name">{shop.name}</h2>
  </div>
)}

<h1 className="menu-title">MENU</h1>

    <div className="menu-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={product.image_url} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><b>{product.price} đ</b></p>

          <button
            className="button"
            onClick={() => addToCart(product)}
          >
            Thêm vào giỏ
          </button>
        </div>
      ))}
    </div>

    <h2>Giỏ hàng</h2>

    {cart.length === 0 ? (
      <p style={{ color: "#888" }}>Vui lòng chọn món</p>
    ) : (
      cart.map(item => (
        <div key={item.id}>
          {item.name} x {item.quantity}
        </div>
      ))
    )}

    <h3>Tổng: {total} đ</h3>

    <h2>Thông tin đặt hàng</h2>

    <input
      placeholder="Tên"
      value={form.name}
      onChange={e => setForm({ ...form, name: e.target.value })}
    />
    <br />

    <input
      placeholder="Số điện thoại"
      value={form.phone}
      onChange={e => setForm({ ...form, phone: e.target.value })}
    />
    <br />

    <input
      placeholder="Địa chỉ"
      value={form.address}
      onChange={e => setForm({ ...form, address: e.target.value })}
    />
    <br />

    <textarea
      placeholder="Ghi chú"
      value={form.note}
      onChange={e => setForm({ ...form, note: e.target.value })}
    />
    <br />

    <button onClick={placeOrder}>
      Đặt món
    </button>

    {showSuccess && (
      <div className="overlay">
        <div className="popup">
          <h3>Đặt hàng thành công!</h3>
          <p>Quán sẽ chuẩn bị món ngay.</p>

          <button
            className="button"
            onClick={() => setShowSuccess(false)}
          >
            OK
          </button>
        </div>
      </div>
    )}

    <ChatBot shopId={shop?.id} />

  </div>
);
}

export default App;