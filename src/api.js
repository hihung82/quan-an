const API_URL = "http://localhost:8206";

export async function getFoods() {
  const res = await fetch(`${API_URL}/foods`);
  return res.json();
}

export async function createOrder(order) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  return res.json();
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`);
  return res.json();
}