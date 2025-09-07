<template>
  <div class="demo1-bg">
    <nav class="demo1-nav glass">
      <span class="logo">Pulse</span>
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Analytics</a></li>
        <li><a href="#">Settings</a></li>
      </ul>
    </nav>
    <main class="demo1-main">
      <h1 class="pulse-title">Futuristic Pulse Dashboard</h1>
      <div class="pulse-card glass">
        <div class="pulse-chart">
          <svg width="180" height="60"><polyline points="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20" fill="none" stroke="#00c6fb" stroke-width="4"><animate attributeName="points" values="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20;0,30 20,40 40,20 60,30 80,10 100,40 120,20 140,50 160,30 180,40" dur="2s" repeatCount="indefinite"/></polyline></svg>
        </div>
        <div class="pulse-info">
          <h2>Live Pulse</h2>
          <p>Real-time platform activity visualized as a pulse waveform.</p>
        </div>
      </div>
      <button class="pulse-btn">Start Pulse</button>
    </main>
  </div>
</template>

<style scoped>
.demo1-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2a6c 0%, #00c6fb 100%);
  display: flex;
  flex-direction: column;
}
.demo1-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
  color: #fff;
}
.demo1-nav .logo {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
.demo1-nav ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.demo1-nav a {
  color: #fff;
  text-decoration: none;
  position: relative;
}
.demo1-nav a::after {
  content: '';
  display: block;
  width: 0;
  height: 2px;
  background: #00c6fb;
  transition: width 0.3s;
}
.demo1-nav a:hover::after {
  width: 100%;
}
.glass {
  background: rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
  backdrop-filter: blur(8px);
  border-radius: 16px;
}
.demo1-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}
.pulse-title {
  color: #fff;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.pulse-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem 3rem;
  margin-bottom: 2rem;
}
.pulse-chart {
  min-width: 180px;
}
.pulse-info h2 {
  color: #00c6fb;
  margin: 0 0 0.5rem 0;
}
.pulse-btn {
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
.pulse-btn:hover {
  box-shadow: 0 4px 32px rgba(255,97,166,0.18);
  background: linear-gradient(90deg, #ff61a6, #00c6fb);
}
</style>
