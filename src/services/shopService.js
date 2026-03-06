import { supabase } from "./supabase";


export async function getShopBySlug(slug) {
  const { data, error } = await supabase
    .from("shop")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) throw error
  return data
}