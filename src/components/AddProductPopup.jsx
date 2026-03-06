import { useState } from "react"
import { supabase } from "../services/supabase"
import { addProduct } from "../services/productService"

function AddProductPopup({ onClose, shop }) {

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)

  async function handleAddProduct() {

    if (!name || !price || !image) {
      alert("Nhập đủ thông tin")
      return
    }

    try {

      const fileName = Date.now() + "-" + image.name

      // upload ảnh
        const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image)

        if (uploadError) {
        console.error(uploadError)
        alert("Upload ảnh lỗi")
        return
        }

      // lấy link ảnh
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)

      const image_url = data.publicUrl

      // thêm product
    const { error } = await addProduct({
    name,
    price,
    description,
    image_url,
    shop_id: shop.id
    })


    if (error) {
    console.error(error)
    alert("Lỗi thêm product")
    return
    }

    alert("Thêm món thành công")
    onClose()

    } catch (err) {
      console.error(err)
      alert("Lỗi thêm món")
    }

  }

  return (
    <div className="overlay">
      <div className="popup">

        <h3>Thêm món</h3>

        <input
          placeholder="Tên món"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Giá"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          placeholder="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <button onClick={handleAddProduct}>
          Thêm
        </button>

        <button onClick={onClose}>
          Đóng
        </button>

      </div>
    </div>
  )
}

export default AddProductPopup
