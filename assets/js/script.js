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

// ---------- SUBMIT COMPLAINT ----------
async function submitComplaint(e){
  e.preventDefault();

  const category = document.getElementById("category").value;
  const subject = document.getElementById("subject").value;
  const description = document.getElementById("description").value;

  const res = await fetch(API + "/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, subject, description })
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
