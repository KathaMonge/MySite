interface CardData {
  id: string;
  title: string;
}

interface ListData {
  id: string;
  title: string;
  cards: CardData[];
}

type BoardData = ListData[];

const STORAGE_KEY = 'my-site-trello';
const DEFAULT_BOARD: BoardData = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'c1', title: '!hello' },
    ],
  },
  {
    id: 'progress',
    title: 'In Progress',
    cards: [],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [],
  },
];

let board: BoardData = [];
let draggedCard: HTMLElement | null = null;
let draggedCardId: string | null = null;
let draggedFromListId: string | null = null;
let containerEl: HTMLElement | null = null;
let dragRaf: number | undefined;

function loadBoard(): BoardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BoardData;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* fall through */ }
  return structuredClone(DEFAULT_BOARD);
}

function saveBoard(listId?: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  if (listId) {
    updateListCount(listId);
  } else {
    updateAllListCounts();
  }
}

function exportBackup(): void {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trello-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file: File): void {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string) as BoardData;
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      board = parsed;
      saveBoard();
      renderBoard();
    } catch {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function updateListCount(listId: string): void {
  const badge = document.querySelector(`[data-list-id="${listId}"] .trello-count`);
  const idx = findListIndex(listId);
  if (badge && idx !== -1) badge.textContent = `${board[idx].cards.length}`;
}

function updateAllListCounts(): void {
  board.forEach(list => {
    const badge = document.querySelector(`[data-list-id="${list.id}"] .trello-count`);
    if (badge) badge.textContent = `${list.cards.length}`;
  });
}

function findListIndex(listId: string): number {
  return board.findIndex(l => l.id === listId);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createCardElement(card: CardData, listId: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'trello-card';
  el.draggable = true;
  el.dataset.cardId = card.id;
  el.dataset.listId = listId;

  el.innerHTML = `
    <span class="trello-card-text">${escapeHtml(card.title)}</span>
    <button class="trello-card-del" aria-label="Delete card">×</button>
  `;

  el.addEventListener('dragstart', () => {
    draggedCard = el;
    draggedCardId = card.id;
    draggedFromListId = listId;
    el.classList.add('dragging');
  });

  el.addEventListener('dragend', () => {
    if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = undefined; }
    el.classList.remove('dragging');
    document.querySelectorAll('.trello-list').forEach(l => l.classList.remove('drag-over'));
    document.querySelectorAll('.drag-insert-before').forEach(c => c.classList.remove('drag-insert-before'));
    document.querySelectorAll('.trello-cards.drag-insert-end').forEach(c => c.classList.remove('drag-insert-end'));
  });

  el.querySelector('.trello-card-del')!.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteCard(listId, card.id);
  });

  const textSpan = el.querySelector('.trello-card-text')!;
  textSpan.addEventListener('dblclick', () => {
    const group = document.createElement('div');
    group.className = 'trello-input-group';

    const input = document.createElement('input');
    input.className = 'trello-inline-edit';
    input.value = card.title;
    input.maxLength = 120;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'trello-input-confirm';
    confirmBtn.textContent = '✓';
    confirmBtn.type = 'button';

    group.appendChild(input);
    group.appendChild(confirmBtn);
    textSpan.replaceWith(group);
    input.focus();
    input.select();

    const finish = () => {
      if (!input.parentNode) return;
      const val = input.value.trim();
      if (val) {
        card.title = val;
        saveBoard(listId);
      }
      const span = document.createElement('span');
      span.className = 'trello-card-text';
      span.textContent = card.title;
      group.replaceWith(span);
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { input.removeEventListener('blur', finish); finish(); }
      if (ev.key === 'Escape') { input.value = card.title; input.removeEventListener('blur', finish); finish(); }
    });
    confirmBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.removeEventListener('blur', finish);
      finish();
    });
  });

  return el;
}

function createListElement(list: ListData): HTMLElement {
  const el = document.createElement('div');
  el.className = 'trello-list';
  el.dataset.listId = list.id;

  el.innerHTML = `
    <div class="trello-list-header">
      <span class="trello-list-title">${escapeHtml(list.title)}</span>
      <span class="trello-count">${list.cards.length}</span>
      <button class="trello-list-del" aria-label="Delete list">×</button>
    </div>
    <div class="trello-cards"></div>
    <div class="trello-add-card">
      <button class="trello-add-card-btn">+ Add card</button>
    </div>
  `;

  const cardsContainer = el.querySelector('.trello-cards')!;
  list.cards.forEach(c => cardsContainer.appendChild(createCardElement(c, list.id)));

  el.addEventListener('dragenter', (e: Event) => {
    const related = (e as DragEvent).relatedTarget;
    if (!el.contains(related as Node)) {
      el.classList.add('drag-over');
    }
  });

  el.addEventListener('dragover', (e: Event) => {
    const de = e as DragEvent;
    de.preventDefault();
    if (dragRaf) cancelAnimationFrame(dragRaf);
    dragRaf = requestAnimationFrame(() => {
      dragRaf = undefined;
      if (!el.classList.contains('drag-over')) return;

      const afterEl = getDragAfterElement(cardsContainer, de.clientY);

      cardsContainer.querySelectorAll('.drag-insert-before').forEach(c => c.classList.remove('drag-insert-before'));
      cardsContainer.classList.remove('drag-insert-end');

      if (afterEl) {
        afterEl.classList.add('drag-insert-before');
      } else {
        cardsContainer.classList.add('drag-insert-end');
      }
    });
  });

  el.addEventListener('dragleave', (e: Event) => {
    const related = (e as DragEvent).relatedTarget;
    if (!el.contains(related as Node)) {
      el.classList.remove('drag-over');
      cardsContainer.querySelectorAll('.drag-insert-before').forEach(c => c.classList.remove('drag-insert-before'));
      cardsContainer.classList.remove('drag-insert-end');
    }
  });

  el.addEventListener('drop', (e: Event) => {
    (e as DragEvent).preventDefault();
    el.classList.remove('drag-over');
    cardsContainer.querySelectorAll('.drag-insert-before').forEach(c => c.classList.remove('drag-insert-before'));
    cardsContainer.classList.remove('drag-insert-end');

    if (!draggedCard || !draggedCardId || !draggedFromListId) return;

    const de = e as DragEvent;
    const afterEl = getDragAfterElement(cardsContainer, de.clientY);
    if (afterEl) {
      cardsContainer.insertBefore(draggedCard, afterEl);
    } else {
      cardsContainer.appendChild(draggedCard);
    }

    if (draggedFromListId === list.id) {
      persistCardOrder(list.id);
      return;
    }

    const srcIdx = findListIndex(draggedFromListId);
    const dstIdx = findListIndex(list.id);
    if (srcIdx === -1 || dstIdx === -1) return;
    const cardData = board[srcIdx].cards.find(c => c.id === draggedCardId);
    if (!cardData) return;
    board[srcIdx].cards = board[srcIdx].cards.filter(c => c.id !== draggedCardId);
    board[dstIdx].cards.push(cardData);
    draggedCard.dataset.listId = list.id;

    saveBoard(list.id);
    updateListCount(draggedFromListId);
    persistCardOrder(list.id);
  });

  el.querySelector('.trello-list-del')!.addEventListener('click', () => deleteList(list.id));

  const addBtn = el.querySelector('.trello-add-card-btn')!;
  addBtn.addEventListener('click', () => showAddCardInput(el, list.id));

  return el;
}

function persistCardOrder(listId: string): void {
  const listEl = containerEl!.querySelector(`[data-list-id="${listId}"]`);
  if (!listEl) return;
  const cardEls = listEl.querySelectorAll('.trello-card');
  const idx = findListIndex(listId);
  if (idx === -1) return;
  const ordered: string[] = [];
  cardEls.forEach(el => {
    const id = (el as HTMLElement).dataset.cardId;
    if (id) ordered.push(id);
  });
  board[idx].cards.sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id));
  saveBoard(listId);
}

function showAddCardInput(listEl: Element, listId: string): void {
  const addArea = listEl.querySelector('.trello-add-card')!;
  const btn = addArea.querySelector('.trello-add-card-btn') as HTMLElement;
  btn.style.display = 'none';

  const group = document.createElement('div');
  group.className = 'trello-input-group';

  const input = document.createElement('input');
  input.className = 'trello-inline-edit trello-input-enter';
  input.placeholder = 'Enter card title...';
  input.maxLength = 120;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'trello-input-confirm';
  confirmBtn.textContent = '✓';
  confirmBtn.type = 'button';

  group.appendChild(input);
  group.appendChild(confirmBtn);
  addArea.insertBefore(group, btn);

  input.focus();

  const commit = () => {
    if (!input.parentNode) return;
    const val = input.value.trim();
    if (val) {
      addCard(listId, val);
    }
    input.remove();
    confirmBtn.remove();
    btn.style.display = '';
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') commit();
    if (ev.key === 'Escape') { input.value = ''; commit(); }
  });
  confirmBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    commit();
  });
}

function getDragAfterElement(container: Element, y: number): HTMLElement | null {
  const cards = [...container.querySelectorAll('.trello-card:not(.dragging):not(.trello-card-removing)')];
  return cards.reduce<{ offset: number; element: HTMLElement | null }>(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child as HTMLElement };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null },
  ).element;
}

function addCard(listId: string, title: string): void {
  const idx = findListIndex(listId);
  if (idx === -1) return;
  const card: CardData = { id: generateId(), title };
  board[idx].cards.push(card);
  const listEl = containerEl!.querySelector(`[data-list-id="${listId}"]`);
  if (listEl) {
    const cardsContainer = listEl.querySelector('.trello-cards')!;
    cardsContainer.appendChild(createCardElement(card, listId));
  }
  saveBoard(listId);
}

function deleteCard(listId: string, cardId: string): void {
  const idx = findListIndex(listId);
  if (idx === -1) return;
  board[idx].cards = board[idx].cards.filter(c => c.id !== cardId);
  const cardEl = containerEl!.querySelector(`[data-card-id="${cardId}"]`);
  if (cardEl) {
    cardEl.classList.add('trello-card-removing');
    setTimeout(() => cardEl.remove(), 250);
  }
  saveBoard(listId);
}

function addList(): void {
  const addListEl = containerEl!.querySelector('.trello-add-list') as HTMLElement;
  const btn = addListEl.querySelector('.trello-add-list-btn') as HTMLElement;
  btn.style.display = 'none';

  const group = document.createElement('div');
  group.className = 'trello-input-group';

  const input = document.createElement('input');
  input.className = 'trello-inline-edit trello-input-enter';
  input.placeholder = 'Enter list title...';
  input.maxLength = 60;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'trello-input-confirm';
  confirmBtn.textContent = '✓';
  confirmBtn.type = 'button';

  group.appendChild(input);
  group.appendChild(confirmBtn);
  addListEl.insertBefore(group, btn);
  input.focus();

  const commit = () => {
    if (!input.parentNode) return;
    const val = input.value.trim();
    if (val) {
      const list: ListData = { id: generateId(), title: val, cards: [] };
      board.push(list);
      const listEl = createListElement(list);
      addListEl.parentNode!.insertBefore(listEl, addListEl);
      saveBoard();
    }
    input.remove();
    confirmBtn.remove();
    btn.style.display = '';
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); input.removeEventListener('blur', commit); commit(); }
    if (ev.key === 'Escape') { input.value = ''; input.removeEventListener('blur', commit); commit(); }
  });
  confirmBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.removeEventListener('blur', commit);
    commit();
  });
}

function deleteList(listId: string): void {
  const idx = findListIndex(listId);
  if (idx === -1) return;
  board.splice(idx, 1);
  const listEl = containerEl!.querySelector(`[data-list-id="${listId}"]`);
  if (listEl) {
    listEl.classList.add('trello-list-removing');
    setTimeout(() => listEl.remove(), 300);
  }
  saveBoard();
}

function renderBoard(): void {
  const el = containerEl;
  if (!el) return;
  el.innerHTML = '';
  board.forEach(list => {
    el.appendChild(createListElement(list));
  });
  const addListEl = document.createElement('div');
  addListEl.className = 'trello-add-list';
  addListEl.innerHTML = `<button class="trello-add-list-btn">+ New List</button>`;
  addListEl.querySelector('.trello-add-list-btn')!.addEventListener('click', addList);
  el.appendChild(addListEl);
}

export function init(): void {
  containerEl = document.getElementById('trello-board-container');
  if (!containerEl) return;

  board = loadBoard();
  renderBoard();

  const exportBtn = document.getElementById('trello-export');
  const importInput = document.getElementById('trello-import-input') as HTMLInputElement;
  const importBtn = document.getElementById('trello-import');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportBackup);
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', () => {
      if (importInput.files && importInput.files[0]) {
        importBackup(importInput.files[0]);
        importInput.value = '';
      }
    });
  }
}
