import { supabase } from "./supabase";


export async function getProductsByShop(shopId) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)

  if (error) throw error
  return data
}

export async function addProduct(product) {

  const { data, error } = await supabase
    .from("products")
    .insert([product])

  return { data, error }
}


export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) throw error
}