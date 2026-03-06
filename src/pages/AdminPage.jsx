import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { addProduct, getProductsByShop, deleteProduct } from "../services/productService"
import { getShopBySlug } from "../services/shopService"
import { useParams } from "react-router-dom"
import AddProductPopup from "../components/AddProductPopup"

function Admin() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const { slug } = useParams()
  const [showMenu, setShowMenu] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState([])
  const [products, setProducts] = useState([])
  const [shop, setShop] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [timeFilter, setTimeFilter] = useState("week") 
  console.log("Admin loaded")
console.log("slug:", slug)

async function fetchStats() {

  let date = new Date()

  if (timeFilter === "today") {
    date.setHours(0,0,0,0)
  }

  if (timeFilter === "week") {
    date.setDate(date.getDate() - 7)
  }

  if (timeFilter === "month") {
    date.setMonth(date.getMonth() - 1)
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      quantity,
      price,
      products (
        name
      ),
      orders (
        created_at,
        status
      )
    `)
    .gte("orders.created_at", date.toISOString())

  if (error) {
    console.error(error)
    return
  }

  const map = {}

  data.forEach(item => {

    if (item.orders?.status !== "completed") return

    const name = item.products?.name

    if (!map[name]) {
      map[name] = {
        name,
        quantity: 0,
        revenue: 0
      }
    }

    map[name].quantity += item.quantity
    map[name].revenue += item.quantity * item.price
  })

  setStats(Object.values(map))
}

  useEffect(() => {
  async function load() {
    const shop = await getShopBySlug(slug)
    setShop(shop)

    const products = await getProductsByShop(shop.id)
    setProducts(products)
  }

  load()
}, [slug])


  useEffect(() => {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}, []);

  // 🔔 phát âm thanh
  const playSound = () => {
    const audio = new Audio("/ding.mp3");
    audio.play().catch(() => {});
  };

  function flashTitle() {
    const originalTitle = document.title;
    let count = 0;

    const interval = setInterval(() => {
      document.title =
        document.title === "🔔 ĐƠN MỚI !!!"
          ? originalTitle
          : "🔔 ĐƠN MỚI !!!";

      count++;
      if (count >= 5) {
        clearInterval(interval);
        document.title = originalTitle;
      }
    }, 1000);
  }

  // 🔐 Kiểm tra đăng nhập
  useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    console.log("USER:", data.user);

    if (!data.user) {
       navigate(`/login/${slug}`);}
     else {
      setUser(data.user);
    }
  };


  checkUser();
}, []);

async function handleDelete(productId) {
  const ok = confirm("Xoá món?")

  if (!ok) return

  await deleteProduct(productId)

  setProducts(products.filter(p => p.id !== productId))
}

async function uploadImage() {
  if (!imageFile) return null

  const fileName = Date.now() + "_" + imageFile.name

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, imageFile)

  if (error) {
    console.error(error)
    alert("Upload ảnh lỗi")
    return null
  }

  const { data: publicUrl } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}

  // 📦 Lấy đơn hàng
  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (
            name
          )
        )
      `)
      .eq("shop_id", shop.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi lấy đơn:", error);
      return;
    }

    setOrders(data || []);
  }

  // 🚀 Realtime khi có đơn mới
 useEffect(() => {
  if (!user || !shop) return; 
  fetchOrders();

  const channel = supabase
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async (payload) => {

            // ❗ nếu đơn không phải của shop này thì bỏ qua
        if (payload.new?.shop_id !== shop.id) return


        console.log("Change detected:", payload);

        if (payload.eventType === "INSERT") {
          playSound();
          flashTitle();
        }

        // Luôn fetch lại để đảm bảo đúng trạng thái
        fetchOrders();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);

  // ✅ Hoàn thành đơn
 async function completeOrder(id) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  fetchOrders(); // luôn sync lại từ DB
}

async function handleAddProduct() {
  try {

  const safeName = image.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/\s+/g, "_") // thay khoảng trắng bằng _
    .replace(/[^\w.]/g, "") // xoá ký tự đặc biệt

  const fileName = Date.now() + "-" + safeName

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName)

    const image_url = data.publicUrl

    await addProduct({
      name,
      price,
      description,
      image_url,
      shop_id: shop.id
    })

    alert("Thêm món thành công")

  } catch (err) {
    console.error(err)
    alert("Lỗi thêm món")
  }
}

  // 🚪 Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate(`/login/${slug}`);
  }

  if (!user) return <div>Chưa đăng nhập</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Đơn hàng mới</h1>

    
{showMenu && (

  <div className="menu-grid">

    {products.map(product => (
      <div key={product.id} className="product-card">

        <button
          className="delete-btn"
          onClick={() => handleDelete(product.id)}
        >
          −
        </button>

        <img src={product.image_url} />
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <b>{product.price} đ</b>

      </div>
    ))}

    <div
      className="product-card add-card"
      onClick={() => setShowAdd(true)}
    >
      +
    </div>

  </div>

)}

{showAdd && (
  <AddProductPopup
  shop={shop}
  onClose={async () => {
    setShowAdd(false)

    const products = await getProductsByShop(shop.id)
    setProducts(products)
  }}
/>
)}

      <button onClick={handleLogout}>Đăng xuất</button>


      <button onClick={() => setShowMenu(!showMenu)}>
        {showMenu ? "Ẩn menu" : "Mở menu"}
      </button>
      
      <button
        onClick={() => {
          setShowStats(!showStats)
          fetchStats()
        }}
      >
        Doanh thu
      </button>

{showStats && (
  <div style={{marginTop:20}}>

    <h2>Thống kê doanh thu</h2>

    <div style={{marginBottom:10}}>
      <button onClick={()=>{
        setTimeFilter("today")
        fetchStats()
      }}>
        Hôm nay
      </button>

      <button onClick={()=>{
        setTimeFilter("week")
        fetchStats()
      }}>
        7 ngày
      </button>

      <button onClick={()=>{
        setTimeFilter("month")
        fetchStats()
      }}>
        30 ngày
      </button>
    </div>

    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>Món</th>
          <th>Số lượng bán</th>
          <th>Doanh thu</th>
        </tr>
      </thead>

      <tbody>
        {stats.map((s,i)=>(
          <tr key={i}>
            <td>{s.name}</td>
            <td>{s.quantity}</td>
            <td>{s.revenue} đ</td>
          </tr>
        ))}
      </tbody>
    </table>

  </div>
)}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <h3 style={{ fontStyle: "italic", color: "#555" }}>
            Khách hàng: {order.customer_name}
          </h3>

          <p style={{ fontStyle: "italic", color: "#555" }}>
            Số điện thoại: {order.phone}
          </p>

          <p style={{ fontStyle: "italic", color: "#555" }}>
            Địa chỉ: {order.address}
          </p>

          {order.note && (
            <p style={{ fontStyle: "italic", color: "#555" }}>
              📝 Ghi chú: {order.note}
            </p>
          )}

          <p>
            Tổng tiền: <b>{order.total_amount} đ</b>
          </p>

          <div style={{ marginTop: 10 }}>
            <b>Danh sách món:</b>
            {order.order_items?.map((item, index) => (
              <div key={index}>
                - {item.products?.name} x {item.quantity}
              </div>
            ))}
          </div>
    

          <button onClick={() => completeOrder(order.id)}>
            Hoàn thành
          </button>
        </div>
      ))}
    </div>
  );
}

export default Admin;