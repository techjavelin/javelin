<script setup lang="ts">
import AmplifyAuthenticator from '@aws-amplify/ui-vue'
import AmplifySignIn from '@aws-amplify/ui-vue'
import '../../src/assets/high-contrast-saas.css'
</script>

<template>
  <div class="terminal" style="min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#181818;">
    <div class="terminal-header" style="margin-bottom:2rem;">
      <span class="terminal-dot" style="width:8px; height:8px; margin-right:5px;"></span>
      <span class="terminal-title" style="font-size:0.8rem; color:#ff2e88;">jTerm 0.0.1</span>
    </div>
    <img src="/javelin-logo.png" alt="Javelin Logo" style="display:block; margin:0 auto 2rem auto; max-width:400px;" />
    <h1 style="font-size:1.2rem; color:#00ff99; font-family:'Fira Mono',monospace; letter-spacing:2px; margin-bottom:0.5rem;">Javelin Login</h1>
    <amplify-authenticator>
      <template v-slot:sign-in>
        <amplify-sign-in />
      </template>
    </amplify-authenticator>
  </div>
</template>
