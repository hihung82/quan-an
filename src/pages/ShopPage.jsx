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
import "leaflet/dist/leaflet.css"
import { getDistance } from "../services/distanceService"
import LocationPicker from "../features/map/LocationPicker"
import { searchAddress } from "../services/geocodeService"

function App() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [showLocationWarning, setShowLocationWarning] = useState(false)
  useEffect(() => {
  console.log("slug:", slug)
  }, [slug])
  
  console.log(getDistance)

  const [products, setProducts] = useState([]);
  const { cart, addToCart, total, setCart, increase, decrease } = useCart()
  const [showSuccess, setShowSuccess] = useState(false);
  const [shop, setShop] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false)
  const [userLocation,setUserLocation] = useState(null)
  const [distance, setDistance] = useState(0)
  const [shipFee, setShipFee] = useState(0)
  const [suggestions, setSuggestions] = useState([])

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
      console.log("SHOP DATA:", shop)


const products = await getProductsByShop(shop.id)

products.sort((a,b)=>b.best_seller - a.best_seller)

setProducts(products)
    } catch (err) {
      console.error(err)
    }
  }

  load()
}, [slug])

useEffect(() => {

  if (!userLocation || !shop) return

  async function calc() {

    const d = await getDistance(
      { lat: shop.latitude, lng: shop.longitude },
      userLocation
    )

    setDistance(d)

  }

  calc()

}, [userLocation, shop])


useEffect(() => {

  if (!distance || !shop) return

  let fee = 0

  if (distance <= shop.free_ship_km) {
    fee = 0
  } else {
    const extraKm = distance - shop.free_ship_km
    fee = 10000 + extraKm * 3000
  }

  setShipFee(Math.round(fee))

}, [distance, shop])

  // =============================
  // CREATE ORDER
  // =============================
  async function placeOrder() {

  if (!cart || cart.length === 0) {
    alert("Bạn chưa chọn món nào");
    return;
  }

  if (!userLocation) {
    setShowLocationWarning(true)

    setTimeout(() => {
      setShowLocationWarning(false)
    }, 3000)
  }

  try {
    const order = await createOrderWithItems(shop, form, cart, total + shipFee)
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

  Tiền món: ${total.toLocaleString("vi-VN")}đ
  Ship: ${shipFee.toLocaleString("vi-VN")}đ

  Tổng: ${(total + shipFee).toLocaleString("vi-VN")}đ
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
<div className="shop-info">

<h2 className="shop-name">{shop.name}</h2>

<p className="shop-address">
📍 {shop.address}
</p>

<p className="shop-phone">
📞 {shop.phone}
</p>

<p className="shop-time">
🕒 {shop.open_time} - {shop.close_time}
</p>

</div>
  </div>
)}

<h1 className="menu-title">MENU</h1>

<div className="menu-grid">
  {products.map(product => (
    <div key={product.id} className="product-card">

      {product.best_seller && (
        <div className="best-badge">
          🔥 Best Seller
        </div>
      )}

      <img src={product.image_url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p><b>{product.price.toLocaleString("vi-VN")} đ</b></p>

          <button
            className="button"
            onClick={() => addToCart(product)}
          >
            Thêm vào giỏ
          </button>
        </div>
      ))}
    </div>

{showCheckout && (
  <div className="overlay">
    <div className="popup">

      <h2>Giỏ hàng</h2>

{cart.map(item => (
  <div key={item.id} className="cart-item">

    <div className="cart-left">
      <div>{item.name}</div>
      <div className="item-price">
        {item.price.toLocaleString("vi-VN")}đ x {item.quantity} = <b>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</b>
      </div>
    </div>

    <div className="qty-control">

      <button onClick={() => decrease(item.id)}>
        -
      </button>

      <span>{item.quantity}</span>

      <button onClick={() => increase(item.id)}>
        +
      </button>

    </div>

  </div>
))}

<p>Khoảng cách: {distance.toFixed(2)} km</p>

<p>Phí ship: {shipFee.toLocaleString("vi-VN")} đ</p>

<h3>Tổng: {(total + shipFee).toLocaleString("vi-VN")} đ</h3>

      <input
        placeholder="Tên"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <input
        placeholder="Số điện thoại"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />

<input
  placeholder="Địa chỉ"
  value={form.address}
  onChange={async (e) => {

    const value = e.target.value

    setForm({ ...form, address: value })

    if (value.length < 3) {
      setSuggestions([])
      return
    }

    const results = await searchAddress(value)

    setSuggestions(results)

  }}
/>

{suggestions.map((s, i) => (

  <div
    key={i}
    style={{
      padding: "6px",
      borderBottom: "1px solid #eee",
      cursor: "pointer"
    }}
    onClick={() => {

      setForm({ ...form, address: s.label })

      setUserLocation({
        lat: s.lat,
        lng: s.lng
      })

      setSuggestions([])

    }}
  >
    {s.label}
  </div>

))}

<div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
  📍 Chọn vị trí của bạn trên bản đồ để tính phí ship chính xác
</div>
{!userLocation && (
  <p style={{color:"red", fontSize:"14px"}}>
    ⚠️ Vui lòng chọn vị trí trên bản đồ để đặt hàng
  </p>
)}

<LocationPicker
  onSelect={(loc) => {
    setUserLocation(loc)
  }}
/>

      <textarea
        placeholder="Ghi chú"
        value={form.note}
        onChange={e => setForm({ ...form, note: e.target.value })}
      />

      <button
        className="button"
        onClick={placeOrder}
        disabled={!userLocation}
      >
        Gửi đơn
      </button>

      <button
        onClick={() => setShowCheckout(false)}
      >
        Hủy
      </button>

    </div>
  </div>
)}


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

{cart.length > 0 && !showCheckout && (
  <div className="cart-bar">

    <div>
      🛒 {cart.reduce((sum, i) => sum + i.quantity, 0)} món
      | {total.toLocaleString("vi-VN")} đ
    </div>

    <button
      className="button"
      onClick={() => setShowCheckout(true)}
    >
      Đặt hàng
    </button>

  </div>
)}

    <ChatBot shopId={shop?.id} phone={shop?.phone} />

  </div>
);
}

export default App;