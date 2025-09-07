<template>
  <nav class="security-demo-nav">
    <span class="logo">PulseSec</span>
    <ul>
      <li><router-link to="/security-demo1">Security Demo 1</router-link></li>
      <li><router-link to="/security-demo2">Security Demo 2</router-link></li>
      <li><router-link to="/security-demo3">Security Demo 3</router-link></li>
      <li><router-link to="/security-demo4">Security Demo 4</router-link></li>
    </ul>
  </nav>
</template>

<style scoped>
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
.security-demo-nav a.router-link-exact-active {
  color: #ff61a6;
  font-weight: bold;
}
.security-demo-nav a:hover {
  color: #ff61a6;
}
</style>
