export async function getDistance(shop, user) {

  const url =
  `https://router.project-osrm.org/route/v1/driving/${shop.lng},${shop.lat};${user.lng},${user.lat}?overview=false`

  console.log("OSRM URL:", url)

  const res = await fetch(url)
  const data = await res.json()

  console.log("OSRM DATA:", data)

  if (!data.routes || data.routes.length === 0) {
    return 0
  }

  return data.routes[0].distance / 1000
}