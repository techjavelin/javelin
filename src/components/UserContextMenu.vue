<template>
  <transition name="ucm-scale-fade">
    <div
      class="user-context-menu popover-surface"
      v-if="visible"
      role="menu"
      aria-label="User menu"
      :id="menuId"
      ref="menuEl"
      @keydown.down.prevent="focusNext()"
      @keydown.up.prevent="focusPrev()"
      @keydown.home.prevent="focusFirst()"
      @keydown.end.prevent="focusLast()"
    >
      <ul>
        <li v-for="(item,i) in items" :key="item.key" :class="item.cls">
          <component
            :is="item.component"
            v-bind="item.props"
            :ref="setItemRef"
            class="ucm-item"
            role="menuitem"
            tabindex="-1"
            @click="item.onClick && item.onClick()"
          >{{ item.label }}</component>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUpdate } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps({ visible: Boolean, menuId: { type: String, default: undefined } })

const { logout } = useAuth()

const menuEl = ref(null)
const itemRefs = ref<HTMLElement[]>([])
function setItemRef(el: HTMLElement | null){ if(el) itemRefs.value.push(el) }
// Clear refs before each v-for re-render to prevent accumulation
onBeforeUpdate(()=>{ itemRefs.value = [] })
const items = computed(()=>[
  { key:'home', label:'Home', component:'router-link', props:{ to:'/' } },
  { key:'profile', label:'Profile', component:'router-link', props:{ to:'/profile' } },
  { key:'preferences', label:'Preferences', component:'router-link', props:{ to:'/preferences' } },
  { key:'logout', label:'Logout', component:'a', props:{ href:'#' }, cls:'danger', onClick:()=>logout() }
])

function focusFirst(){ focusIndex(0) }
function focusLast(){ focusIndex(itemRefs.value.length-1) }
function focusNext(){ const idx=currentIndex(); focusIndex((idx+1)%itemRefs.value.length) }
function focusPrev(){ const idx=currentIndex(); focusIndex((idx-1+itemRefs.value.length)%itemRefs.value.length) }
function currentIndex(){ return itemRefs.value.findIndex(el=>document.activeElement===el) }
function focusIndex(i){ const el=itemRefs.value[i]; if(el) el.focus() }

onMounted(()=>{ if(props.visible) nextTick(()=>focusFirst()) })
</script>

<style scoped>
.user-context-menu { position:absolute; left:0; bottom:calc(100% + 8px); }
.user-context-menu ul { list-style:none; margin:0; padding:0; }
.user-context-menu li { margin:0; }
.user-context-menu li + li { margin-top:.55rem; }
.user-context-menu a, .user-context-menu :deep(a) {
  color:#e2e8f0; text-decoration:none; font-size:.8rem; font-weight:500; display:block; padding:.4rem .55rem; border-radius:6px; transition:background .18s,color .18s; line-height:1.1;
}
.user-context-menu a:hover { background:rgba(255,255,255,0.08); color:#fff; }
.user-context-menu li.danger a { color:#f87171; }
.user-context-menu li.danger a:hover { background:rgba(248,113,113,0.12); color:#fff; }
/* Transition */
.ucm-scale-fade-enter-active, .ucm-scale-fade-leave-active { transition: opacity .18s ease, transform .18s ease; transform-origin: bottom left; }
.ucm-scale-fade-enter-from, .ucm-scale-fade-leave-to { opacity:0; transform: scale(.92) translateY(6px); }
</style>
