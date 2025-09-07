<template>
  <div class="demo2-bg">
    <nav class="demo2-nav">
      <span class="logo">Pulse</span>
      <ul>
        <li><a href="#">Overview</a></li>
        <li><a href="#">Data Grid</a></li>
        <li><a href="#">Reports</a></li>
      </ul>
    </nav>
    <main class="demo2-main">
      <h1 class="demo2-title">Data Grid Minimal</h1>
      <div class="demo2-table-card">
        <table class="demo2-table">
          <thead>
            <tr><th>Name</th><th>Status</th><th>Pulse</th></tr>
          </thead>
          <tbody>
            <tr><td>Alpha</td><td><span class="status live">Live</span></td><td><span class="pulse-dot"></span></td></tr>
            <tr><td>Beta</td><td><span class="status idle">Idle</span></td><td><span class="pulse-dot pulse-dot-idle"></span></td></tr>
            <tr><td>Gamma</td><td><span class="status error">Error</span></td><td><span class="pulse-dot pulse-dot-error"></span></td></tr>
          </tbody>
        </table>
      </div>
      <button class="demo2-btn">Export Data</button>
    </main>
  </div>
</template>

<style scoped>
.demo2-bg {
  min-height: 100vh;
  background: #0f172a;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.demo2-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
}
.demo2-nav .logo {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
.demo2-nav ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.demo2-nav a {
  color: #00ffc6;
  text-decoration: none;
  position: relative;
}
.demo2-nav a:hover {
  color: #f9d423;
}
.demo2-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}
.demo2-title {
  color: #00ffc6;
  font-size: 2.2rem;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.demo2-table-card {
  background: #181e2a;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,255,198,0.08);
  padding: 2rem 3rem;
  margin-bottom: 2rem;
}
.demo2-table {
  width: 400px;
  border-collapse: collapse;
  color: #fff;
}
.demo2-table th, .demo2-table td {
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #222;
  text-align: left;
}
.status {
  padding: 0.2rem 0.7rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
}
.status.live {
  background: #00ffc6;
  color: #0f172a;
}
.status.idle {
  background: #f9d423;
  color: #0f172a;
}
.status.error {
  background: #ff4b2b;
  color: #fff;
}
.pulse-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00ffc6;
  box-shadow: 0 0 8px #00ffc6, 0 0 2px #fff;
  animation: pulse 1.2s infinite alternate;
}
.pulse-dot-idle {
  background: #f9d423;
  box-shadow: 0 0 8px #f9d423, 0 0 2px #fff;
  animation: pulse 2s infinite alternate;
}
.pulse-dot-error {
  background: #ff4b2b;
  box-shadow: 0 0 8px #ff4b2b, 0 0 2px #fff;
  animation: pulse 0.7s infinite alternate;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0.7; }
}
.demo2-btn {
  background: #00ffc6;
  color: #0f172a;
  border: none;
  border-radius: 32px;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  box-shadow: 0 2px 16px rgba(0,255,198,0.18);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
}
.demo2-btn:hover {
  box-shadow: 0 4px 32px rgba(249,212,35,0.18);
  background: #f9d423;
  color: #0f172a;
}
</style>
