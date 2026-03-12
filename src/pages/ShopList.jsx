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
      maxWidth: "1100px",
      margin: "auto",
      padding: "20px"
    }}>

        <div className="brand-header">

  <div className="brand-row">
    <img 
      src="/logo.png"
      alt="MONLEO"
      className="brand-logo"
    />

    <h1 className="brand-title">
      MONLEO
    </h1>
  </div>

</div>
      
      <h1 style={{
        marginBottom: "30px",
        textAlign: "center"
      }}>
        Chọn quán
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))",
        gap: "25px"
      }}>

        {shops.map((shop) => (
          <Link
            key={shop.id}
            to={`/shop/${shop.slug}`}
            style={{ textDecoration: "none", color: "black" }}
          >

            <div
              style={{
                border: "1px solid #eee",
                borderRadius: "14px",
                background: "white",
                padding: "20px",
                transition: "0.25s",
                cursor: "pointer",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e)=>{
                e.currentTarget.style.transform="translateY(-5px)"
                e.currentTarget.style.boxShadow="0 8px 20px rgba(0,0,0,0.1)"
              }}
              onMouseLeave={(e)=>{
                e.currentTarget.style.transform="translateY(0)"
                e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"
              }}
            >

              {/* LOGO */}
              <img
                src={shop.logo_url || "https://via.placeholder.com/120"}
                alt=""
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "10px"
                }}
              />

              {/* NAME */}
              <h2 style={{
                margin: "5px 0",
                fontSize: "18px"
              }}>
                {shop.name}
              </h2>

              {/* DESCRIPTION */}
              <p style={{
                color: "#666",
                fontSize: "14px",
                minHeight: "40px"
              }}>
                {shop.description || "Quán ăn"}
              </p>

              {/* ADDRESS */}
              {shop.address && (
                <p style={{
                  fontSize: "13px",
                  color: "#888"
                }}>
                  📍 {shop.address}
                </p>
              )}

              {/* OPEN TIME */}
              {shop.open_time && (
                <p style={{
                  fontSize: "13px",
                  color: "#888"
                }}>
                  🕒 {shop.open_time} - {shop.close_time}
                </p>
              )}

            </div>

          </Link>
        ))}

      </div>

    </div>
  );
}

export default ShopList;