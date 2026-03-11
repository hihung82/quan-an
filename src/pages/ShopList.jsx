import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";

function ShopList() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from("shop")
        .select("*");

      if (!error) {
        setShops(data);
      }
    }

    fetchShops();
  }, []);

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "auto",
      padding: "20px"
    }}>
      
      <h1 style={{ marginBottom: "30px" }}>
        Chọn quán
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))",
        gap: "20px"
      }}>

        {shops.map((shop) => (
          <Link
            key={shop.id}
            to={`/shop/${shop.slug}`}
            style={{ textDecoration: "none", color: "black" }}
          >

            <div style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              overflow: "hidden",
              background: "white",
              transition: "0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={(e)=>{
              e.currentTarget.style.transform="scale(1.03)"
            }}
            onMouseLeave={(e)=>{
              e.currentTarget.style.transform="scale(1)"
            }}
            >

              <img
                src={shop.logo_url || "https://via.placeholder.com/300x150"}
                alt=""
                style={{
                  width: "80%",
                  height: "150px",
                  objectFit: "cover"
                }}
              />

              <div style={{ padding: "15px" }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "18px"
                }}>
                  {shop.name}
                </h2>

                <p style={{
                  marginTop: "8px",
                  color: "#666",
                  fontSize: "14px"
                }}>
                  {shop.description || "Quán ăn"}
                </p>
              </div>

            </div>

          </Link>
        ))}

      </div>

    </div>
  );
}

export default ShopList;