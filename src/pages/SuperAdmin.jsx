import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"

function SuperAdmin(){

  const [stats,setStats] = useState([])
  const [timeFilter,setTimeFilter] = useState("day")

  async function fetchStats(){

    let date = new Date()

    if(timeFilter === "day"){
      date.setHours(0,0,0,0)
    }

    if(timeFilter === "week"){
      date.setDate(date.getDate()-7)
    }

    if(timeFilter === "month"){
      date.setMonth(date.getMonth()-1)
    }

    if(timeFilter === "year"){
      date.setFullYear(date.getFullYear()-1)
    }

    const {data,error} = await supabase
      .from("orders")
      .select(`
        total_amount,
        shop_id,
        created_at,
        shop(name)
      `)
      .eq("status","completed")
      .gte("created_at",date.toISOString())

    if(error){
      console.error(error)
      return
    }

    const map = {}

    data?.forEach(order=>{

      const shopName = order.shop?.name || "Unknown"

      if(!map[shopName]){
        map[shopName] = {
          shop: shopName,
          orders: 0,
          revenue: 0
        }
      }

      map[shopName].orders += 1
      map[shopName].revenue += order.total_amount
    })

    setStats(Object.values(map))
  }

  useEffect(()=>{
    fetchStats()
  },[timeFilter])

  return(
    <div style={{padding:30}}>

      <h1>Super Admin</h1>

      <div style={{marginBottom:20}}>

        <button onClick={()=>setTimeFilter("day")}>Hôm nay</button>

        <button onClick={()=>setTimeFilter("week")}>7 ngày</button>

        <button onClick={()=>setTimeFilter("month")}>30 ngày</button>

        <button onClick={()=>setTimeFilter("year")}>1 năm</button>

      </div>

      <table border="1" cellPadding="10">

        <thead>
          <tr>
            <th>Quán</th>
            <th>Số đơn</th>
            <th>Doanh thu</th>
          </tr>
        </thead>

        <tbody>

          {stats.map((s,i)=>(
            <tr key={i}>
              <td>{s.shop}</td>
              <td>{s.orders}</td>
              <td>{s.revenue} đ</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}

export default SuperAdmin