<template>
  <div class="demo3-bg">
    <nav class="demo3-nav">
      <span class="logo">Pulse</span>
      <ul>
        <li><a href="#">Organizations</a></li>
        <li><a href="#">Network</a></li>
        <li><a href="#">Settings</a></li>
      </ul>
    </nav>
    <main class="demo3-main">
      <h1 class="demo3-title">Signal Intelligence</h1>
      <div class="demo3-card">
        <svg class="network-graph" width="180" height="100">
          <circle cx="90" cy="50" r="30" fill="#43e97b" opacity="0.2" />
          <circle cx="90" cy="50" r="10" fill="#43e97b" />
          <line x1="90" y1="50" x2="30" y2="30" stroke="#ff4b2b" stroke-width="3" />
          <line x1="90" y1="50" x2="150" y2="30" stroke="#f9d423" stroke-width="3" />
          <circle cx="30" cy="30" r="8" fill="#ff4b2b" />
          <circle cx="150" cy="30" r="8" fill="#f9d423" />
        </svg>
        <div class="network-info">
          <h2>Org Network</h2>
          <p>Visualize relationships and signal flow between organizations.</p>
        </div>
      </div>
      <button class="demo3-btn">Analyze Network</button>
    </main>
  </div>
</template>

<style scoped>
.demo3-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #232526 0%, #0f2027 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
}
.demo3-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
}
.demo3-nav .logo {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
.demo3-nav ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.demo3-nav a {
  color: #43e97b;
  text-decoration: none;
  position: relative;
}
.demo3-nav a:hover {
  color: #ff4b2b;
}
.demo3-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}
.demo3-title {
  color: #43e97b;
  font-size: 2.2rem;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.demo3-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: #181e2a;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(67,233,123,0.08);
  padding: 2rem 3rem;
  margin-bottom: 2rem;
}
.network-graph {
  min-width: 180px;
}
.network-info h2 {
  color: #43e97b;
  margin: 0 0 0.5rem 0;
}
.demo3-btn {
  background: linear-gradient(90deg, #43e97b, #f9d423);
  color: #0f2027;
  border: none;
  border-radius: 32px;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  box-shadow: 0 2px 16px rgba(67,233,123,0.18);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
}
.demo3-btn:hover {
  box-shadow: 0 4px 32px rgba(255,75,43,0.18);
  background: linear-gradient(90deg, #ff4b2b, #43e97b);
}
</style>
