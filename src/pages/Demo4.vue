<template>
  <div class="demo4-bg">
    <nav class="demo4-nav">
      <span class="logo">Pulse</span>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Features</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
    <main class="demo4-main">
      <h1 class="demo4-title">Pulse Light</h1>
      <div class="demo4-hero">
        <svg width="220" height="60"><polyline points="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30" fill="none" stroke="#00c6fb" stroke-width="4"><animate attributeName="points" values="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30;0,30 20,40 40,20 60,30 80,10 100,40 120,20 140,50 160,30 180,40 200,20 220,40" dur="2s" repeatCount="indefinite"/></polyline></svg>
        <div class="pulse-dots">
          <span class="dot dot-blue"></span>
          <span class="dot dot-pink"></span>
          <span class="dot dot-green"></span>
        </div>
      </div>
      <div class="demo4-card">
        <h2>Welcome to Pulse Platform</h2>
        <p>Bright, clean, and playful UI for the next generation of data-driven applications.</p>
      </div>
      <button class="demo4-btn">Get Started</button>
    </main>
  </div>
</template>

<style scoped>
.demo4-bg {
  min-height: 100vh;
  background: #f4f8fb;
  color: #1a2a6c;
  display: flex;
  flex-direction: column;
}
.demo4-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
}
.demo4-nav .logo {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
.demo4-nav ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.demo4-nav a {
  color: #00c6fb;
  text-decoration: none;
  position: relative;
}
.demo4-nav a:hover {
  color: #ff61a6;
}
.demo4-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}
.demo4-title {
  color: #00c6fb;
  font-size: 2.2rem;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.demo4-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}
.pulse-dots {
  display: flex;
  gap: 0.5rem;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  animation: pulse-dot 1.2s infinite alternate;
}
.dot-blue { background: #00c6fb; }
.dot-pink { background: #ff61a6; animation-delay: 0.4s; }
.dot-green { background: #43e97b; animation-delay: 0.8s; }
@keyframes pulse-dot {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0.7; }
}
.demo4-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,198,251,0.08);
  padding: 2rem 3rem;
  margin-bottom: 2rem;
  text-align: center;
}
.demo4-btn {
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
.demo4-btn:hover {
  box-shadow: 0 4px 32px rgba(255,97,166,0.18);
  background: linear-gradient(90deg, #ff61a6, #00c6fb);
}
</style>
