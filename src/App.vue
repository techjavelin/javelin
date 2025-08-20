<script setup lang="ts">
import AmplifyAuthenticator from '@aws-amplify/ui-vue'
import AmplifySignIn from '@aws-amplify/ui-vue'
import '../src/assets/high-contrast-saas.css'
</script>

<template>
  <nav>
    <router-link to="/" class="active">Home</router-link>
    <router-link to="/services">Services</router-link>
    <router-link to="/about">About</router-link>
    <router-link to="/contact">Contact</router-link>
    <router-link to="/login">Login</router-link>
  </nav>
  <div class="terminal">
    <div class="terminal-header">
  <span class="terminal-dot" style="width:8px; height:8px; margin-right:5px;"></span>
  <span class="terminal-title" style="font-size:0.8rem; color:#ff2e88;">jTerm 0.0.1</span>
    </div>
  <img src="/src/assets/javelin-logo.png" alt="Javelin Logo" style="display:block; margin:0 auto 2rem auto; max-width:600px;" />
  <h1 style="font-size:1.2rem; color:#00ff99; font-family:'Fira Mono',monospace; letter-spacing:2px; margin-bottom:0.5rem;">Javelin</h1>
  <p style="font-size:0.9rem; color:#f8f8f2; font-family:'Fira Mono',monospace; margin-top:0.2rem; margin-bottom:1.2rem; background:#232323; padding:0.7rem 1.2rem; border-radius:6px; border:1px solid #00ff99; box-shadow:0 0 8px #00ff99;">Welcome to <span style="color:#00ff99">Javelin</span>, a SaaS product by <span style="color:#ff2e88">Tech Javelin Ltd</span> (<a href="https://techjavelin.com" target="_blank" style="color:#00ff99; text-decoration:underline;">techjavelin.com</a>) providing information, application, and social security services to clients.</p>
  <amplify-authenticator>
    <template v-slot:sign-in>
      <amplify-sign-in />
    </template>
  </amplify-authenticator>
  </div>
</template>

