const checkoutBtn = document.querySelector("#checkout-btn");
checkoutBtn.addEventListener("click", checkout);

async function checkout() {
  try {
    const res = await fetch(`http://localhost:3001/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          { id: 1, quantity: 1 },
          { id: 2, quantity: 4 },
          { id: 3, quantity: 2 },
          { id: 4, quantity: 6 },
        ],
      }),
    });

    let data;

    if (res.ok) {
      data = await res.json();
    }

    window.location = data.url;
  } catch (error) {
    console.log(error);
  }
}
