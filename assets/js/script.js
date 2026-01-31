const API = "http://127.0.0.1:5000";

// ---------- REGISTER ----------
async function registerUser(e){
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if(res.ok){
    alert("Account Created Successfully!");
    window.location.href = "login.html";
  } else {
    alert(data.error || "Registration Failed");
  }
}

// ---------- LOGIN ----------
async function loginUser(e){
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if(res.ok){
    window.location.href = "dashboard.html";
  } else {
    alert(data.error || "Invalid Email or Password");
  }
}

// ---------- DASHBOARD STATS ----------
async function loadDashboard(){
  const res = await fetch(API + "/dashboard-stats");
  const data = await res.json();

  document.getElementById("total").innerText = data.total;
  document.getElementById("pending").innerText = data.pending;
  document.getElementById("progress").innerText = data.in_progress;
  document.getElementById("resolved").innerText = data.resolved;
}

// ---------- SUBMIT COMPLAINT (ONLY IMAGE PART ADDED) ----------
async function submitComplaint(e){
  e.preventDefault();

  const category = document.getElementById("category").value;
  const subject = document.getElementById("subject").value;
  const description = document.getElementById("description").value;
  const image = document.getElementById("image").files[0];

  const fd = new FormData();
  fd.append("category", category);
  fd.append("subject", subject);
  fd.append("description", description);

  if(image){
    fd.append("image", image);
  }

  const res = await fetch(API + "/submit", {
    method: "POST",
    body: fd
  });

  const data = await res.json();

  if(res.ok){
    alert("Complaint Registered Successfully!\nComplaint ID: " + data.complaint_id);
    window.location.href = "track.html";
  } else {
    alert("Complaint Submit Failed");
  }
}

// ---------- TRACK COMPLAINT ----------
async function trackComplaint(e){
  e.preventDefault();

  const cid = document.getElementById("cid").value;

  const res = await fetch(API + "/track/" + cid);
  const data = await res.json();

  const box = document.getElementById("track-result");

  if(res.ok){
    box.innerHTML = `
      <b>Status:</b> ${data.status} <br>
      <b>Category:</b> ${data.category} <br>
      <b>Subject:</b> ${data.subject} <br>
      <b>Description:</b> ${data.description}
    `;
  } else {
    box.innerHTML = "Invalid Complaint ID";
  }
}
// ---------- RECENT COMPLAINTS ----------
async function loadRecentComplaints(){
  try{
    const res = await fetch(API + "/recent-complaints");
    const data = await res.json();

    const tbody = document.getElementById("recentComplaints");
    tbody.innerHTML = "";

    if(data.length === 0){
      tbody.innerHTML = `<tr><td colspan="4" class="loading">No complaints found</td></tr>`;
      return;
    }

    data.forEach(c => {
      let cls = "status-pending";
      if(c.status === "In Progress") cls = "status-progress";
      if(c.status === "Resolved") cls = "status-resolved";

      tbody.innerHTML += `
        <tr>
          <td>${c.id}</td>
          <td>${c.subject}</td>
          <td class="${cls}">${c.status}</td>
          <td>${c.date}</td>
        </tr>
      `;
    });

  }catch(e){
    document.getElementById("recentComplaints").innerHTML =
      `<tr><td colspan="4" class="loading">Unable to load data</td></tr>`;
  }
}
/* ===== DASHBOARD BAR CHART ===== */

let statusChart;

function initChart(){
  const ctx = document.getElementById("statusChart");

  if(!ctx) return;

 statusChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Total", "Pending", "In Progress", "Resolved"],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: "#2563eb",
      borderRadius:6,
      barThickness:30       // 🔥 bars patle
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a"
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#e5e7eb" }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255,255,255,0.15)"   // 🔥 soft grid
        },
        ticks: {
          stepSize: 5,
          color: "#e5e7eb"
        }
      }
    }
  }
});
}

/* Update chart when dashboard stats load */
async function loadDashboard(){
  const res = await fetch(API + "/dashboard-stats");
  const data = await res.json();

  document.getElementById("total").innerText = data.total;
  document.getElementById("pending").innerText = data.pending;
  document.getElementById("progress").innerText = data.in_progress;
  document.getElementById("resolved").innerText = data.resolved;

  if(statusChart){
    statusChart.data.datasets[0].data = [
      data.total,
      data.pending,
      data.in_progress,
      data.resolved
    ];
    statusChart.update();
  }
}