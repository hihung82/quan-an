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
import { supabase } from "../services/supabase"

function App() {
  const { slug } = useParams()
  const params = new URLSearchParams(window.location.search)
  const groupId = params.get("group")
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [showLocationWarning, setShowLocationWarning] = useState(false)

const checkout = params.get("checkout")
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
  const categories = ["all", ...new Set(products.map(p => p.category))]

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: ""
  });

  useEffect(() => {
  if (checkout === "1") {
    setShowCheckout(true)
  }
}, [checkout])

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

  async function loadGroupCart(){

    if(!groupId) return

    const { data } = await supabase
      .from("group_items")
      .select("*")
      .eq("group_id", groupId)

    if(data){
const groupCart = data.map(i=>({
  id: i.id,              // dùng id của database
  product_id: i.product_id,
  quantity: i.quantity,
  price: i.price,
  member_name: i.member_name
}))

      setCart(groupCart)
    }

  }

  loadGroupCart()

},[groupId])

async function createGroupOrder() {

  const name = prompt("Tên của bạn")

  const { data, error } = await supabase
    .from("group_orders")
    .insert({
      shop_id: shop.id,
      host_name: name
    })
    .select()
    .single()

  if(error){
    console.error(error)
    return
  }

  navigate(`/shop/${slug}/group/${data.id}`)
}

async function addGroupItem(product){

  const name = prompt("Tên bạn")

  const { data: existing } = await supabase
    .from("group_items")
    .select("*")
    .eq("group_id", groupId)
    .eq("product_id", product.id)
    .eq("member_name", name)
    .maybeSingle()

  if(existing){

    const { error } = await supabase
      .from("group_items")
      .update({
        quantity: existing.quantity + 1
      })
      .eq("id", existing.id)

    if(error){
      console.error(error)
      alert("Lỗi cập nhật món")
    }

  }else{

    const { error } = await supabase
      .from("group_items")
      .insert({
        group_id: groupId,
        member_name: name,
        product_id: product.id,
        quantity: 1,
        price: product.price
      })

    if(error){
      console.error(error)
      alert("Lỗi thêm món")
    }

  }

}


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

if (!groupId && (!cart || cart.length === 0)) {
  alert("Bạn chưa chọn món nào");
  return;
}

  if (!userLocation) {
    setShowLocationWarning(true)

    setTimeout(() => {
      setShowLocationWarning(false)
    }, 3000)
    return
  }

  let finalCart = cart
  let finalTotal = total

  // nếu là đơn nhóm
  if (groupId) {

    const { data: items } = await supabase
      .from("group_items")
      .select("*")
      .eq("group_id", groupId)

const groupCart = items.map(i => ({
  id: i.id,
  product_id: i.product_id,
  quantity: i.quantity,
  price: i.price,
  member_name: i.member_name
}))

    finalCart = groupCart

    finalTotal = groupCart.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    )

    setCart(groupCart)
  }

  try {

let cleanCart = finalCart


const merged = {}

finalCart.forEach(item => {

  const key = `${item.product_id}_${item.member_name || "single"}`

  if (!merged[key]) {

merged[key] = {
  product_id: item.product_id || item.id,
  quantity: item.quantity,
  price: Number(item.price),
  member_name: item.member_name
}

  } else {

    merged[key].quantity += item.quantity

  }

})

cleanCart = Object.values(merged)

    const order = await createOrderWithItems(
      shop,
      form,
      cleanCart,
      finalTotal + shipFee
    )

    localStorage.setItem("orderId", order.id)

    navigate(`/shop/${slug}/order/${order.id}`)

const telegramMerged = {}

cleanCart.forEach(item => {

  const key = item.product_id

  if (!telegramMerged[key]) {

    telegramMerged[key] = {
      product_id: item.product_id,
      quantity: item.quantity
    }

  } else {

    telegramMerged[key].quantity += item.quantity

  }

})

const itemsText = Object.values(telegramMerged)
  .map(item => {

    const product = products.find(p => p.id === item.product_id)

    return `${product?.name} x${item.quantity}`

  })
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

Tiền món: ${finalTotal.toLocaleString("vi-VN")}đ
Ship dự kiến: ${shipFee.toLocaleString("vi-VN")}đ

Tổng: ${(finalTotal + shipFee).toLocaleString("vi-VN")}đ
`,
      order.id
    )

    setShowSuccess(true)
    setCart([])

  } catch (err) {
    console.log(err)
    alert("Lỗi tạo đơn")
  }
}


const mergedCart = Object.values(
  cart.reduce((acc, item) => {

    const key = item.product_id || item.id

    if (!acc[key]) {
      acc[key] = { ...item }
    } else {
      acc[key].quantity += item.quantity
    }

    return acc

  }, {})
)

const displayTotal = mergedCart.reduce(
  (sum, i) => sum + i.price * i.quantity,
  0
);

const filteredProducts = products.filter((p) => {

  const matchSearch = p.name
    .toLowerCase()
    .includes(search.toLowerCase())

  const matchCategory =
    category === "all" || p.category === category

  return matchSearch && matchCategory

})

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

{!groupId && (
<button 
  className="group-btn"
  onClick={createGroupOrder}
>
  Đặt theo nhóm
</button>
)}

{groupId && (
  <button
    onClick={() => navigate(`/shop/${slug}/group/${groupId}`)}
  >
    Xem đơn nhóm
  </button>
)}

<h1 className="menu-title">MENU</h1>

<input
  type="text"
  placeholder="🔎 Tìm món..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="search-box"
/>

<div className="category-filter">
  {categories.map((c) => (
    <button
      key={c}
      onClick={() => setCategory(c)}
      className={category === c ? "active" : ""}
    >
      {c === "all" ? "Tất cả" : c}
    </button>
  ))}
</div>

{groupId && (
  <div style={{
    background:"#fff3cd",
    padding:"10px",
    marginBottom:"10px",
    borderRadius:"8px"
  }}>
    👥 Bạn đang đặt món trong đơn nhóm
  </div>
)}

<div className="menu-grid">
  {filteredProducts.map(product => (
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
            onClick={() => {

  if(groupId){
    addGroupItem(product)
  }else{
    addToCart(product)
  }

}}
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

{mergedCart.map((item) => {
  const product = products.find(
    (p) => p.id === (item.product_id || item.id)
  );

  return (
    <div key={item.id} className="cart-item">
      <div className="cart-left">
        <div>{product?.name}</div>

        <div className="item-price">
          {item.price.toLocaleString("vi-VN")}đ x {item.quantity} =
          <b>
            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
          </b>
        </div>
      </div>

      <div className="qty-control">
        <button onClick={() => decrease(item.id)}>-</button>

        <span>{item.quantity}</span>

        <button onClick={() => increase(item.id)}>+</button>
      </div>
    </div>
  );
})}

<p>Khoảng cách: {distance.toFixed(2)} km</p>

<p>Phí ship dự kiến: {shipFee.toLocaleString("vi-VN")} đ</p>

<h3>Tổng: {(displayTotal + shipFee).toLocaleString("vi-VN")} đ</h3>

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
  📍 Chọn vị trí của bạn trên bản đồ để dự đoán phí ship
</div>
{!userLocation && (
  <p style={{color:"red", fontSize:"14px"}}>
    ⚠️ Vui lòng chọn vị trí trên bản đồ để đặt hàng
  </p>
)}

{shop && (
  <LocationPicker
    shop={shop}
    position={userLocation}
    onSelect={(loc) => {
      setUserLocation(loc)
    }}
  />
)}

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

{!groupId && cart.length > 0 && !showCheckout && (
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