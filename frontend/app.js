// const API_BASE = "http://localhost:5000/api";
const API_BASE = "https://ledger-u9p6.onrender.com/api";
// const API_BASE = import.meta.env.VITE_API_URL + "/api";
let token = "";

function print(data) {
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  token = data?.data?.token || "";
  print(data);
}

async function getSummary() {
  const response = await fetch(`${API_BASE}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  print(await response.json());
}

async function createRecord() {
  const body = {
    amount: Number(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    record_date: document.getElementById("record_date").value,
    notes: document.getElementById("notes").value || null
  };

  const response = await fetch(`${API_BASE}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  print(await response.json());
}
