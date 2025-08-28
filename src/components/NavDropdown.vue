<template>
  <div 
    ref="dropdownRef"
    class="nav-dropdown" 
    @mouseenter="handleMouseEnter" 
    @mouseleave="handleMouseLeave"
  >
    <!-- Main navigation link -->
    <router-link 
      :to="to" 
      class="nav-dropdown-link"
      :class="{ 'has-dropdown': items && items.length > 0, 'is-active': isOpen }"
      @click.prevent="handleLinkClick"
    >
      {{ label }}
      <span v-if="items && items.length > 0" class="dropdown-arrow">▼</span>
    </router-link>

    <!-- Dropdown menu -->
    <div 
      v-if="items && items.length > 0" 
      class="dropdown-menu" 
      :class="{ 'is-open': isOpen }"
      @click.stop
    >
      <template v-for="item in items" :key="item.to || item.label">
        <!-- Regular link -->
        <router-link 
          v-if="!item.items" 
          :to="item.to" 
          class="dropdown-item"
          @click="handleItemClick(item)"
        >
          <svg 
            v-if="item.icon" 
            class="dropdown-icon" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path :d="item.icon"/>
          </svg>
          {{ item.label }}
          <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
        </router-link>

        <!-- Nested submenu (future enhancement) -->
        <div v-else class="dropdown-submenu">
          <span class="dropdown-item dropdown-submenu-trigger">
            <svg 
              v-if="item.icon" 
              class="dropdown-icon" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path :d="item.icon"/>
            </svg>
            {{ item.label }}
            <span class="submenu-arrow">▶</span>
          </span>
        </div>

        <!-- Divider -->
        <div v-if="item.divider" class="dropdown-divider"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // Main link destination
  to: {
    type: String,
    required: true
  },
  // Main link label
  label: {
    type: String,
    required: true
  },
  // Dropdown menu items
  items: {
    type: Array,
    default: () => []
  },
  // Position of dropdown menu
  position: {
    type: String,
    default: 'left', // 'left', 'right', 'center'
    validator: (value) => ['left', 'right', 'center'].includes(value)
  },
  // Dropdown width
  minWidth: {
    type: String,
    default: '220px'
  },
  // Interaction mode
  mode: {
    type: String,
    default: 'hover', // 'hover', 'click', 'both'
    validator: (value) => ['hover', 'click', 'both'].includes(value)
  }
})

const emit = defineEmits(['item-click', 'open', 'close'])

const isOpen = ref(false)
const dropdownRef = ref(null)
let hoverTimer = null

// Handle mouse interactions (for hover mode)
function handleMouseEnter() {
  if (props.mode === 'hover' || props.mode === 'both') {
    clearTimeout(hoverTimer)
    if (!isOpen.value) {
      isOpen.value = true
      emit('open')
    }
  }
}

function handleMouseLeave() {
  if (props.mode === 'hover' || props.mode === 'both') {
    hoverTimer = setTimeout(() => {
      if (isOpen.value) {
        isOpen.value = false
        emit('close')
      }
    }, 100) // Small delay to prevent flickering
  }
}

// Handle click interactions (for click mode)
function handleLinkClick(event) {
  if (props.items && props.items.length > 0) {
    if (props.mode === 'click' || props.mode === 'both') {
      event.preventDefault()
      toggleDropdown()
    } else if (props.mode === 'hover') {
      // For hover mode, still navigate to the link
      return true
    }
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    emit('open')
  } else {
    emit('close')
  }
}

function closeDropdown() {
  if (isOpen.value) {
    isOpen.value = false
    emit('close')
  }
}

// Handle click outside
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

function handleItemClick(item) {
  emit('item-click', item)
  closeDropdown()
}

// Setup click outside listener
onMounted(() => {
  if (props.mode === 'click' || props.mode === 'both') {
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(hoverTimer)
})

// Expose methods for parent component
defineExpose({
  closeDropdown,
  isOpen: () => isOpen.value
})
</script>

<style scoped>
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.nav-dropdown-link {
  color: #2566af;
  text-decoration: none;
  font-weight: 500;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-dropdown-link:hover {
  background: #eaf2fb;
}

.nav-dropdown-link.is-active {
  background: #eaf2fb;
  color: #174a7c;
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.nav-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border-radius: 6px;
  min-width: v-bind(minWidth);
  z-index: 1000;
  padding: 0.5rem 0;
  border: 1px solid #e0e0e0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
}

.dropdown-menu.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #2566af;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  gap: 0.75rem;
  position: relative;
}

.dropdown-item:hover {
  background: #eaf2fb;
  color: #174a7c;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.item-badge {
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  margin-left: auto;
}

.dropdown-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0.25rem 0;
}

.dropdown-submenu {
  position: relative;
}

.dropdown-submenu-trigger {
  cursor: pointer;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 0.7rem;
}

/* Position variations */
.nav-dropdown[data-position="right"] .dropdown-menu {
  left: auto;
  right: 0;
}

.nav-dropdown[data-position="center"] .dropdown-menu {
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
}

.nav-dropdown[data-position="center"] .dropdown-menu.is-open {
  transform: translateX(-50%) translateY(0);
}

/* Dark mode styles */
[data-theme="dark"] .nav-dropdown-link {
  color: #e0e0e0;
}

[data-theme="dark"] .nav-dropdown-link:hover {
  background: #333;
  color: #64b5f6;
}

[data-theme="dark"] .dropdown-menu {
  background: #2d2d2d;
  border-color: #404040;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

[data-theme="dark"] .dropdown-item {
  color: #64b5f6;
}

[data-theme="dark"] .dropdown-item:hover {
  background: #404040;
  color: #90caf9;
}

[data-theme="dark"] .dropdown-divider {
  background: #404040;
}
</style>
