export async function convertCurrency(amount, from = "INR", to = "USD") {
  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`
    );
    const data = await res.json();
    return data.result ?? amount;
  } catch (err) {
    console.error("Currency conversion failed:", err);
    return amount;
  }
}
