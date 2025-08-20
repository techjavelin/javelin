import { defineComponent, ref } from 'vue'
import { Auth } from 'aws-amplify'

export default defineComponent({
  name: 'AmplifyLogin',
  setup() {
    const username = ref('')
    const password = ref('')
    const step = ref<'username' | 'password' | 'authenticating' | 'error' | 'success'>('username')
    const error = ref('')

    const handleUsername = (e: KeyboardEvent) => {
      if ((e as KeyboardEvent).key === 'Enter' && username.value) {
        step.value = 'password'
      }
    }
    const handlePassword = async (e: KeyboardEvent) => {
      if ((e as KeyboardEvent).key === 'Enter' && password.value) {
        step.value = 'authenticating'
        error.value = ''
        try {
          await Auth.signIn(username.value, password.value)
          step.value = 'success'
        } catch (err: any) {
          error.value = err.message || 'Login failed'
          step.value = 'error'
        }
      }
    }
    return { username, password, step, error, handleUsername, handlePassword }
  },
  template: `
    <div style="font-family:'Fira Mono',monospace; color:#00ff99; font-size:0.95rem;">
      <span>login@javelin:~$ <span style='color:#ff2e88'>login</span></span><br>
      <span v-if="step === 'username'">
        Username: <input type="text" v-model="username" @keyup="handleUsername" style="background:#232323; color:#00ff99; border:none; border-bottom:1px solid #00ff99; font-family:'Fira Mono',monospace; font-size:0.95rem; width:60%; outline:none;" autocomplete="username" />
      </span>
      <span v-else-if="step === 'password'">
        Password: <input type="password" v-model="password" @keyup="handlePassword" style="background:#232323; color:#00ff99; border:none; border-bottom:1px solid #00ff99; font-family:'Fira Mono',monospace; font-size:0.95rem; width:60%; outline:none;" autocomplete="current-password" />
      </span>
      <span v-else-if="step === 'authenticating'" style="color:#ff2e88; display:block; margin-top:1rem;">Authenticating...</span>
      <span v-else-if="step === 'error'" style="color:#ff2e88; display:block; margin-top:1rem;">{{ error }}</span>
      <span v-else-if="step === 'success'" style="color:#00ff99; display:block; margin-top:1rem;">Login successful!</span>
    </div>
  `
})
