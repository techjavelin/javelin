<template>
  <div class="tms" :class="{ focused: isFocused, disabled }" @mousedown.prevent>
    <div class="tms-input-wrapper" @click="focusInput">
      <template v-for="token in modelValue" :key="token">
        <span class="tms-token" :class="{ removable: !disabled }">
          <span v-if="showColors && getItem(token)?.color" class="swatch" :style="{ background: getItem(token)?.color || undefined }" />
          {{ getItem(token)?.name || fallbackLabel(token) }}
          <button v-if="!disabled" type="button" class="remove" @click.stop="removeToken(token)" aria-label="Remove">×</button>
        </span>
      </template>
      <input
        ref="inputEl"
        v-model="query"
        :placeholder="placeholder"
        :disabled="disabled"
        @keydown.stop.prevent="onKeydown($event)"
        @input="onInput"
        @focus="handleFocus"
        @blur="handleBlur"
        aria-autocomplete="list"
  :aria-expanded="showList ? 'true' : 'false'"
        role="combobox"
        :aria-activedescendant="activeOptionId"
      />
    </div>
    <transition name="fade">
      <ul
        v-if="showList"
        class="tms-list"
        role="listbox"
        :id="listId"
        @mousedown.prevent
      >
        <li
          v-for="(item, idx) in filtered"
          :key="item.id"
          :class="{ active: idx === activeIndex, selected: modelValue.includes(item.id) }"
          role="option"
          :aria-selected="modelValue.includes(item.id) ? 'true' : 'false'"
          :id="optionId(idx)"
          @mouseenter="activeIndex = idx"
          @mousedown.prevent="toggleItem(item.id)"
        >
          <span v-if="showColors && item.color" class="swatch" :style="{ background: item.color }" />
          <span class="label">{{ item.name }}</span>
          <span v-if="modelValue.includes(item.id)" class="check">✓</span>
        </li>
        <li v-if="!filtered.length" class="empty">No matches</li>
      </ul>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';

interface Item { id: string; name: string; color?: string | null }

const props = defineProps<{
  items: Item[];
  modelValue: string[];
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  showColors?: boolean; // for potential future toggle
  filterKeys?: (keyof Item)[];
}>();

const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const query = ref('');
const isFocused = ref(false);
const activeIndex = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);
const listId = `tms-list-${Math.random().toString(36).slice(2)}`;
const activeOptionId = computed(() => filtered.value[activeIndex.value] ? `${listId}-opt-${activeIndex.value}` : undefined);
function optionId(i: number) { return `${listId}-opt-${i}`; }

const filterKeys = computed(() => props.filterKeys || ['name']);

const normalizedItems = computed(() => props.items || []);

const filtered = computed(() => {
  if (!query.value.trim()) return normalizedItems.value.slice(0, 50); // cap initial
  const q = query.value.toLowerCase();
  return normalizedItems.value.filter(it =>
    filterKeys.value.some(k => String((it as any)[k] || '').toLowerCase().includes(q))
  );
});

const showList = computed(() => isFocused.value && filtered.value.length >= 0);

function getItem(id: string) {
  return normalizedItems.value.find(i => i.id === id);
}

function fallbackLabel(id: string) { return id; }

function focusInput() {
  inputEl.value?.focus();
}

function addToken(id: string) {
  if (props.max && props.modelValue.length >= props.max) return;
  if (!props.modelValue.includes(id)) {
    emit('update:modelValue', [...props.modelValue, id]);
  }
  nextTickClear();
}

function removeToken(id: string) {
  emit('update:modelValue', props.modelValue.filter(v => v !== id));
}

function toggleItem(id: string) {
  if (props.modelValue.includes(id)) removeToken(id); else addToken(id);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Backspace' && !query.value && props.modelValue.length && !props.disabled) {
    removeToken(props.modelValue[props.modelValue.length - 1]);
    return;
  }
  if (e.key === 'ArrowDown') { activeIndex.value = (activeIndex.value + 1) % Math.max(filtered.value.length, 1); return; }
  if (e.key === 'ArrowUp') { activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % Math.max(filtered.value.length, 1); return; }
  if (e.key === 'Enter') {
    const item = filtered.value[activeIndex.value];
    if (item) toggleItem(item.id);
    return;
  }
  if (e.key === 'Escape') { query.value = ''; isFocused.value = false; inputEl.value?.blur(); return; }
  // Allow normal text input: preventDefault earlier, so manually append
  if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
    query.value += e.key;
  }
}

function onInput() { /* v-model already updates query */ }

function handleFocus() { isFocused.value = true; }
function handleBlur() { setTimeout(() => { isFocused.value = false; query.value=''; }, 120); }

function nextTickClear() { setTimeout(() => { query.value=''; activeIndex.value = 0; }, 0); }

watch(() => props.items, () => {
  // ensure activeIndex within range
  if (activeIndex.value >= filtered.value.length) activeIndex.value = 0;
});

onMounted(() => { /* focus mgmt optional */ });
</script>

<style scoped>
.tms { position: relative; border: 1px solid var(--border-color,#444); padding: 4px; border-radius: 6px; background: var(--bg-elevated,#1e1e1e); display:flex; flex-wrap:wrap; gap:4px; cursor:text; }
.tms.focused { outline: 2px solid var(--focus-color,#2b7cff); }
.tms.disabled { opacity: .6; cursor:not-allowed; }
.tms-input-wrapper { display:flex; flex-wrap:wrap; gap:4px; align-items:center; flex:1; }
.tms-token { display:inline-flex; align-items:center; gap:4px; background:var(--token-bg,#2a2a2a); padding:2px 6px; border-radius:4px; font-size:12px; line-height:1.2; }
.tms-token .remove { background:none; border:none; color:var(--fg,#ddd); cursor:pointer; padding:0 2px; font-size:14px; line-height:1; }
.tms-token .remove:hover { color:#fff; }
.tms-token .swatch { width:10px; height:10px; border-radius:2px; box-shadow:0 0 0 1px rgba(255,255,255,0.15); }
.tms input { flex:1; min-width:120px; border:none; outline:none; background:transparent; color:var(--fg,#eee); padding:4px; font-size:14px; }
.tms-list { position:absolute; left:0; top:100%; width:100%; max-height:240px; overflow:auto; background:var(--bg-popover,#222); border:1px solid var(--border-color,#444); border-radius:6px; margin:4px 0 0; list-style:none; padding:4px 0; z-index:10; box-shadow:0 6px 18px -4px rgba(0,0,0,.4); }
.tms-list li { padding:6px 10px; display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; }
.tms-list li.active { background:var(--active-bg,#333); }
.tms-list li.selected { font-weight:600; }
.tms-list li .swatch { width:14px; height:14px; border-radius:3px; box-shadow:0 0 0 1px rgba(255,255,255,0.15); }
.tms-list li .check { margin-left:auto; color:var(--accent,#2b7cff); font-weight:600; }
.tms-list li.empty { justify-content:center; opacity:.6; cursor:default; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>
