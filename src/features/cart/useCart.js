import { useState, useMemo } from "react"
export function useCart() {
  const [cart, setCart] = useState([])

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  )

  function increase(id) {
  setCart(cart.map(item =>
    item.id === id
      ? { ...item, quantity: item.quantity + 1 }
      : item
  ))
}

function decrease(id) {
  setCart(
    cart
      .map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter(item => item.quantity > 0)
  )
}

return {
  cart,
  addToCart,
  total,
  setCart,
  increase,
  decrease
}
}

