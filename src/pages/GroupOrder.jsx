import { useEffect,useState } from "react"
import { supabase } from "../services/supabase"
import { useParams, useNavigate } from "react-router-dom"

function GroupOrder(){

  const { groupId } = useParams()
  const navigate = useNavigate()
  const { slug } = useParams()
    const [shopId,setShopId] = useState(null)
  const [items,setItems] = useState([])
const [name, setName] = useState("")
const [phone, setPhone] = useState("")
const [address, setAddress] = useState("")

  const inviteLink = `${window.location.origin}/shop/${slug}?group=${groupId}`

  async function fetchItems(){

    const { data, error } = await supabase
      .from("group_items")
      .select(`
        *,
        member_name,
        products(name)
      `)
      .eq("group_id", groupId)

    if (error) {
      console.log("SUPABASE ERROR:", error)
      return
    }

    setItems(data || [])
  }

  async function fetchGroup(){

  const { data } = await supabase
    .from("group_orders")
    .select("shop_id")
    .eq("id", groupId)
    .single()

  if(data){
    setShopId(data.shop_id)
  }
}

useEffect(()=>{

  if(groupId){
    fetchItems()
    fetchGroup()
  }

},[groupId])

 
async function placeGroupOrder(){

        if(!name || !phone || !address){
  alert("Vui lòng nhập đầy đủ thông tin")
  return
}

  if(!shopId){
    alert("Không tìm thấy shop")
    return
  }

  if(items.length === 0){
    alert("Chưa có món")
    return
  }


  const total = items.reduce(
    (sum,i)=>sum + i.price*i.quantity,
    0
  )

  const { data: order, error } = await supabase
    .from("orders")
  .insert({
    shop_id: shopId,
    customer_name: name,
    phone,
    address,
    total_amount: total,
    status: "pending"
  })
    .select()
    .single()

  if(error){
    console.log(error)
    alert("Lỗi tạo đơn")
    return
  }

  const orderItems = items.map(i=>({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
    member_name: i.member_name
  }))

  await supabase
    .from("order_items")
    .insert(orderItems)


  alert("Đặt đơn thành công!")
  navigate(`/shop/${slug}/order/${order.id}`)
}

const groupedItems = items.reduce((acc, item) => {
  const key = item.member_name || "Khách"

  if (!acc[key]) {
    acc[key] = []
  }

  acc[key].push(item)

  return acc
}, {})

  return(

    <div>

 <h1>Nhóm đặt món</h1>

{items.length === 0 && (
  <p>Chưa có ai thêm món</p>
)}

{Object.entries(groupedItems).map(([member, list]) => (
  <div key={member} style={{marginBottom:"10px"}}>

    <b>{member}</b>

    {list.map(i=>(
      <div key={i.id} style={{marginLeft:"10px"}}>
        - {i.products?.name} x{i.quantity}
      </div>
    ))}

  </div>
))}

<h3>
Tổng tiền: {items.reduce(
  (s,i)=>s+i.price*i.quantity,0
).toLocaleString("vi-VN")} đ
</h3>

<p>Link mời:</p>

<input
  value={inviteLink}
  readOnly
  style={{width:"300px"}}
/>

<br/><br/>

<button onClick={()=>navigate(`/shop/${slug}?group=${groupId}`)}>
Thêm món
</button>

<button
  onClick={() =>
    navigate(`/shop/${slug}?group=${groupId}&checkout=1`)
  }
>
Đặt đơn cho cả nhóm
</button>


    </div>

  )
}

export default GroupOrder