<template>
  <div class="md-editor" :class="{ 'is-preview': showPreview }" @dragover.prevent @drop.prevent="handleDrop">
    <div class="md-toolbar">
      <div class="left-tools">
        <button type="button" class="tool-btn" @click="applyWrap('**')" title="Bold"><strong>B</strong></button>
        <button type="button" class="tool-btn" @click="applyWrap('_')" title="Italic"><em>I</em></button>
        <button type="button" class="tool-btn" @click="applyPrefix('# ')" title="Heading 1">H1</button>
        <button type="button" class="tool-btn" @click="applyPrefix('## ')" title="Heading 2">H2</button>
        <button type="button" class="tool-btn" @click="applyPrefix('### ')" title="Heading 3">H3</button>
        <button type="button" class="tool-btn" @click="applyPrefix('- ')" title="Bullet List">• List</button>
        <button type="button" class="tool-btn" @click="applyPrefix('1. ')" title="Numbered List">1.</button>
        <button type="button" class="tool-btn" @click="applyWrap('`')" title="Inline Code">{ }</button>
        <button type="button" class="tool-btn" @click="applyBlock('```\n','\n```')" title="Code Block">```</button>
        <button type="button" class="tool-btn" @click="applyLink" title="Link">🔗</button>
  <button v-if="enableImages" type="button" class="tool-btn" @click="triggerFile" title="Upload Image">🖼️</button>
        <button v-if="enableTables" type="button" class="tool-btn" @click="insertTable" title="Table">▦</button>
        <button v-if="enableHr" type="button" class="tool-btn" @click="insertHr" title="Horizontal Rule">―</button>
        <button v-if="enableTasks" type="button" class="tool-btn" @click="toggleTaskList" title="Task List">☑️</button>
      </div>
      <div class="right-tools">
        <button v-if="showOutlineToggle" type="button" class="tool-btn" @click="outlineVisible = !outlineVisible" :title="outlineVisible ? 'Hide Outline' : 'Show Outline'">{{ outlineVisible ? 'Outline−' : 'Outline+' }}</button>
        <button type="button" class="tool-btn" @click="togglePreview" :title="showPreview ? 'Edit' : 'Preview'">{{ showPreview ? 'Edit' : 'Preview' }}</button>
      </div>
    </div>
  <input v-if="enableImages" ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="handleFileSelect" />
  <div class="md-body">
      <div class="md-pane editor-pane" v-if="!showPreview">
        <textarea
          ref="textareaRef"
          class="md-textarea"
          :placeholder="placeholder"
          v-model="localValue"
          @input="handleInput"
          @paste="handlePaste"
        />
      </div>
      <div class="md-pane preview-pane" v-else v-html="renderedHtml"></div>
      <aside v-if="outlineVisible && !showPreview && headings.length" class="md-outline">
        <div class="outline-title">Outline</div>
        <ul>
          <li v-for="h in headings" :key="h.index" :class="'lvl-' + h.level">
            <button type="button" @click="jumpToHeading(h)">{{ h.text }}</button>
          </li>
        </ul>
      </aside>
    </div>
    <div v-if="showStats" class="char-counter">
      <span>{{ localValue.length }} chars</span>
      <span> · {{ wordCount }} words</span>
      <span v-if="wordCount"> · ~{{ readingTime }} min read</span>
      <span v-if="autosaveStatus" class="autosave-status"> · {{ autosaveStatus }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { marked } from 'marked';
import { useStorage } from '../composables/useStorage';
import { useToasts } from '../composables/useToasts';

interface Props {
  modelValue: string;
  placeholder?: string;
  charCount?: boolean;
  enableImages?: boolean;
  enableTables?: boolean;
  enableHr?: boolean;
  enableTasks?: boolean;
  autosaveKey?: string;
  autosaveIntervalMs?: number;
  showOutline?: boolean;
  showStats?: boolean;
  showOutlineToggle?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue || '');
const showPreview = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const outlineVisible = ref(!!props.showOutline);
const autosaveStatus = ref('');
let autosaveTimer: any = null;
let saveTimer: any = null;

const enableImages = props.enableImages !== false;
// Image upload helpers
const fileInput = ref<HTMLInputElement | null>(null);
const { uploadImage } = useStorage();
const { add: addToast } = useToasts();
const scopeId = computed(() => {
  // Derive scope from autosaveKey heuristic: if key contains 'post:' use that id
  if (!props.autosaveKey) return undefined;
  const m = props.autosaveKey.match(/post:(.+?):/);
  return m ? m[1] : undefined;
});
let draftId = localStorage.getItem('mdDraftId');
if (!draftId) { draftId = crypto.randomUUID(); localStorage.setItem('mdDraftId', draftId); }

function triggerFile() { fileInput.value?.click(); }

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement; if (!input.files || !input.files.length) return;
  const file = input.files[0];
  await processImageFile(file);
  input.value = '';
}

async function processImageFile(file: File) {
  if (!enableImages) return;
  if (!file.type.startsWith('image/')) { addToast({ title: 'Invalid Image', message: 'Unsupported type', type: 'error' }); return; }
  if (file.size > 2 * 1024 * 1024) { addToast({ title: 'Too Large', message: 'Image >2MB', type: 'error' }); return; }
  const placeholderId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const placeholder = `![uploading ${file.name}](uploading://${placeholderId})`;
  insertAtCursor(placeholder + '\n');
  const res = await uploadImage(file, { postId: scopeId.value, draftId: scopeId.value ? undefined : draftId || 'draft' });
  if (!res) {
    replacePlaceholder(placeholderId, `(upload failed)`);
    return;
  }
  const alt = file.name.replace(/\.[^.]+$/,'');
  replacePlaceholder(placeholderId, `![${alt}](${res.url})`);
}

function replacePlaceholder(id: string, replacement: string) {
  const token = new RegExp(`!\\[uploading [^\]]*\\]\\(uploading://${id}\\)`);
  localValue.value = localValue.value.replace(token, replacement);
  emitUpdate();
}
const enableTables = props.enableTables !== false;
const enableHr = props.enableHr !== false;
const enableTasks = props.enableTasks !== false;
const showStats = computed(() => props.showStats || props.charCount);
const showOutlineToggle = computed(() => props.showOutlineToggle !== false);

watch(() => props.modelValue, (v) => {
  if (v !== localValue.value) localValue.value = v || '';
});

function emitUpdate() {
  emit('update:modelValue', localValue.value);
  scheduleAutosave();
}

function togglePreview() { showPreview.value = !showPreview.value; }

function applyWrap(wrapper: string) {
  const ta = textareaRef.value; if (!ta) return;
  const start = ta.selectionStart; const end = ta.selectionEnd;
  const selected = localValue.value.slice(start, end);
  const before = localValue.value.slice(0, start);
  const after = localValue.value.slice(end);
  const newVal = `${before}${wrapper}${selected || 'text'}${wrapper}${after}`;
  localValue.value = newVal; emitUpdate();
  nextTickRestore(ta, start + wrapper.length, start + wrapper.length + (selected || 'text').length);
}

function applyPrefix(prefix: string) {
  const ta = textareaRef.value; if (!ta) return;
  const start = ta.selectionStart; const end = ta.selectionEnd;
  const lines = localValue.value.split('\n');
  let charCountAcc = 0;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    const lineStart = charCountAcc;
    const lineEnd = charCountAcc + line.length;
    if (lineEnd >= start && lineStart <= end) {
      if (!line.startsWith(prefix)) lines[i] = prefix + line.replace(/^#+\s+/,'');
    }
    charCountAcc += line.length + 1;
  }
  localValue.value = lines.join('\n'); emitUpdate();
}

function applyBlock(startToken: string, endToken: string) {
  const ta = textareaRef.value; if (!ta) return;
  const selStart = ta.selectionStart; const selEnd = ta.selectionEnd;
  const selected = localValue.value.slice(selStart, selEnd) || 'code';
  const before = localValue.value.slice(0, selStart);
  const after = localValue.value.slice(selEnd);
  localValue.value = `${before}${startToken}${selected}${endToken}${after}`;
  emitUpdate();
  nextTickRestore(ta, selStart + startToken.length, selStart + startToken.length + selected.length);
}

function applyLink() {
  const ta = textareaRef.value; if (!ta) return;
  const selStart = ta.selectionStart; const selEnd = ta.selectionEnd;
  const selected = localValue.value.slice(selStart, selEnd) || 'link-text';
  const before = localValue.value.slice(0, selStart);
  const after = localValue.value.slice(selEnd);
  const url = 'https://';
  localValue.value = `${before}[${selected}](${url})${after}`;
  emitUpdate();
  nextTickRestore(ta, selStart + 1, selStart + 1 + selected.length);
}

function insertAtCursor(text: string, selectLen = 0) {
  const ta = textareaRef.value; if (!ta) return;
  const start = ta.selectionStart; const end = ta.selectionEnd;
  const before = localValue.value.slice(0, start);
  const after = localValue.value.slice(end);
  localValue.value = before + text + after;
  emitUpdate();
  const pos = start + text.length - selectLen;
  nextTickRestore(ta, pos - selectLen, pos);
}

// Legacy URL insert with Shift+Click on toolbar button (optional enhancement)
function insertImagePrompt() {
  const url = window.prompt('Image URL (or cancel to skip):','https://');
  if (!url) return;
  const alt = window.prompt('Alt text:','image');
  insertAtCursor(`![${alt || 'image'}](${url})`);
}

async function handlePaste(e: ClipboardEvent) {
  if (!enableImages) return;
  const items = e.clipboardData?.items; if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile(); if (!file) continue;
      await processImageFile(file);
      e.preventDefault();
      break;
    }
  }
}

async function handleDrop(e: DragEvent) {
  if (!enableImages) return;
  const files = e.dataTransfer?.files; if (!files || !files.length) return;
  const file = files[0];
  if (!file.type.startsWith('image/')) return;
  await processImageFile(file);
}

function fileToDataUrl(file: File) { return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(r.error); r.readAsDataURL(file); }); }

function insertTable() {
  const tmpl = '\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Value 1  | Value 2  |\n';
  insertAtCursor(tmpl);
}

function insertHr() { insertAtCursor('\n\n---\n\n'); }

function toggleTaskList() {
  const ta = textareaRef.value; if (!ta) return;
  const start = ta.selectionStart; const end = ta.selectionEnd;
  const lines = localValue.value.split('\n');
  let acc = 0;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i]; const lineStart = acc; const lineEnd = acc + line.length;
    if (lineEnd >= start && lineStart <= end) {
      if (/^- \[[ xX]\] /.test(line)) {
        lines[i] = line.replace(/^- \[ \]/,'- [x]').replace(/^- \[[xX]\]/,'- [ ]');
      } else if (/^- /.test(line)) {
        lines[i] = line.replace(/^- /,'- [ ] ');
      } else if (line.trim().length) {
        lines[i] = '- [ ] ' + line;
      }
    }
    acc += line.length + 1;
  }
  localValue.value = lines.join('\n');
  emitUpdate();
}

interface Heading { level: number; text: string; index: number; pos: number }
const headings = computed<Heading[]>(() => {
  const hs: Heading[] = [];
  const lines = localValue.value.split(/\n/);
  let pos = 0;
  lines.forEach((line, idx) => {
    const m = /^(#{1,6})\s+(.*)/.exec(line);
    if (m) {
      hs.push({ level: m[1].length, text: m[2].replace(/[#*_`]+/g,'').trim(), index: idx, pos });
    }
    pos += line.length + 1;
  });
  return hs;
});

function jumpToHeading(h: Heading) {
  const ta = textareaRef.value; if (!ta) return;
  ta.focus();
  ta.setSelectionRange(h.pos, h.pos);
  ta.scrollTop = h.pos; // approximation
}

function scheduleAutosave() {
  if (!props.autosaveKey) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(`mdDraft:${props.autosaveKey}` , localValue.value);
      autosaveStatus.value = 'saved';
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => autosaveStatus.value = '', 2000);
    } catch {}
  }, props.autosaveIntervalMs || 1200);
}

const wordCount = computed(() => {
  const text = localValue.value
    .replace(/`{3}[\s\S]*?`{3}/g,' ')
    .replace(/`[^`]+`/g,' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g,' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g,' ')
    .replace(/[#>*_~`-]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').length;
});
const readingTime = computed(() => Math.max(1, Math.round(wordCount.value / 200)));

function handleInput() { emitUpdate(); }

function nextTickRestore(ta: HTMLTextAreaElement, s: number, e: number) {
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s, e); });
}

const renderedHtml = computed(() => {
  try { return marked.parse(localValue.value || ''); }
  catch { return '<p style="color:#dc2626">Render error</p>'; }
});

onMounted(() => {
  if (textareaRef.value) textareaRef.value.setAttribute('autocomplete','off');
  if (props.autosaveKey && !localValue.value) {
    try {
      const saved = localStorage.getItem(`mdDraft:${props.autosaveKey}`);
      if (saved) {
        localValue.value = saved;
        emitUpdate();
        autosaveStatus.value = 'draft restored';
        setTimeout(() => autosaveStatus.value = '', 3000);
      }
    } catch {}
  }
});
</script>

<style scoped>
.md-editor { border:1px solid var(--color-border); border-radius:12px; background:var(--color-card-light); display:flex; flex-direction:column; position:relative; }
.hidden-file { display:none; }
[data-theme="dark"] .md-editor { background:var(--color-card-light); border-color:#2c3848; }
.md-toolbar { display:flex; justify-content:space-between; padding:0.4rem 0.5rem; border-bottom:1px solid var(--color-border); flex-wrap:wrap; gap:0.4rem; }
[data-theme="dark"] .md-toolbar { border-color:#2c3848; }
.tool-btn { background:#f1f5f9; border:1px solid var(--color-border); border-radius:6px; padding:0.3rem 0.55rem; font-size:0.7rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem; }
.tool-btn:hover { background:#e2e8f0; }
[data-theme="dark"] .tool-btn { background:#1f2735; border-color:#2c3848; color:var(--color-text-light); }
[data-theme="dark"] .tool-btn:hover { background:#273142; }
.md-body { display:flex; min-height:240px; position:relative; }
.md-pane { flex:1; display:flex; }
.editor-pane { border-right:1px solid var(--color-border); }
[data-theme="dark"] .editor-pane { border-color:#2c3848; }
.md-textarea { width:100%; border:none; resize:vertical; padding:0.75rem; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; background:transparent; color:inherit; line-height:1.45; }
.md-textarea:focus { outline:none; }
.preview-pane { padding:0.75rem 0.9rem; width:100%; overflow:auto; font-size:0.9rem; line-height:1.5; }
.preview-pane :deep(code) { background:rgba(0,0,0,0.06); padding:0.15rem 0.35rem; border-radius:4px; font-size:0.75rem; }
[data-theme="dark"] .preview-pane :deep(code) { background:#1f2735; }
.preview-pane :deep(pre) { background:rgba(0,0,0,0.08); padding:0.65rem 0.75rem; border-radius:8px; overflow:auto; }
[data-theme="dark"] .preview-pane :deep(pre) { background:#1f2735; }
.md-outline { width:180px; border-left:1px solid var(--color-border); padding:0.5rem; font-size:0.65rem; overflow:auto; background:rgba(0,0,0,0.02); }
[data-theme="dark"] .md-outline { background:#1f2735; border-color:#2c3848; }
.md-outline .outline-title { font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.35rem; }
.md-outline ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.15rem; }
.md-outline li button { background:none; border:none; color:inherit; cursor:pointer; text-align:left; padding:2px 4px; width:100%; border-radius:4px; }
.md-outline li button:hover { background:rgba(0,0,0,0.07); }
[data-theme="dark"] .md-outline li button:hover { background:#273142; }
.md-outline li.lvl-2 button { padding-left:10px; }
.md-outline li.lvl-3 button { padding-left:18px; }
.md-outline li.lvl-4 button { padding-left:26px; }
.char-counter { align-self:flex-end; font-size:0.6rem; opacity:0.65; padding:0.25rem 0.5rem; display:flex; gap:0.4rem; flex-wrap:wrap; }
.char-counter .autosave-status { color: var(--color-primary); }
@media (max-width: 900px) { .md-body { flex-direction:column; } .editor-pane { border-right:none; border-bottom:1px solid var(--color-border); } .md-outline { order:3; width:100%; border-left:none; border-top:1px solid var(--color-border); display:flex; flex-direction:column; } }
</style>
