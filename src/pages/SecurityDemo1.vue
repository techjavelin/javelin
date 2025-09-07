<template>
  <div class="security-demo-bg">
    <nav class="security-demo-nav">
      <span class="logo">PulseSec</span>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Features</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
    <main class="security-demo-main">
      <h1 class="security-demo-title">Enterprise Security, Startup Simplicity</h1>
      <div class="security-hero">
        <svg width="220" height="60"><polyline points="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30" fill="none" stroke="#00c6fb" stroke-width="4"><animate attributeName="points" values="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30;0,30 20,40 40,20 60,30 80,10 100,40 120,20 140,50 160,30 180,40 200,20 220,40" dur="2s" repeatCount="indefinite"/></polyline></svg>
        <div class="security-lock">
          <svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="16" r="6" fill="#00c6fb" opacity="0.15"/><rect x="7" y="12" width="10" height="7" rx="3.5" fill="#fff" stroke="#00c6fb" stroke-width="2"/><rect x="10" y="8" width="4" height="6" rx="2" fill="#fff" stroke="#00c6fb" stroke-width="2"/><circle cx="12" cy="16" r="1.2" fill="#00c6fb"/></svg>
        </div>
      </div>
      <div class="security-demo-card">
        <h2>PulseSec for Startups</h2>
        <p>Enterprise-grade security, compliance, and monitoring—now accessible to fast-moving teams and founders.</p>
      </div>
      <button class="security-demo-btn">Get Started Securely</button>
    </main>
  </div>
</template>

<style scoped>
.security-demo-bg {
  min-height: 100vh;
  background: #f4f8fb;
  color: #1a2a6c;
  display: flex;
  flex-direction: column;
}
.security-demo-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
}
.security-demo-nav .logo {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
.security-demo-nav ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.security-demo-nav a {
  color: #00c6fb;
  text-decoration: none;
  position: relative;
}
.security-demo-nav a:hover {
  color: #ff61a6;
}
.security-demo-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}
.security-demo-title {
  color: #00c6fb;
  font-size: 2.2rem;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.security-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}
.security-lock {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 16px rgba(0,198,251,0.08);
  width: 56px;
  height: 56px;
}
.security-demo-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,198,251,0.08);
  padding: 2rem 3rem;
  margin-bottom: 2rem;
  text-align: center;
}
.security-demo-btn {
  background: linear-gradient(90deg, #00c6fb, #ff61a6);
  color: #fff;
  border: none;
  border-radius: 32px;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  box-shadow: 0 2px 16px rgba(0,198,251,0.18);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
}
.security-demo-btn:hover {
  box-shadow: 0 4px 32px rgba(255,97,166,0.18);
  background: linear-gradient(90deg, #ff61a6, #00c6fb);
}
</style>
