import anime from 'animejs';

const wrapper = document.getElementById('tiles');
let columns = 0;
let rows = 0;
let toggled = false;

const TARGET_TILE_SIZE = 80;

function toggle(): void {
  toggled = !toggled;
  document.getElementById('hero')?.classList.toggle('toggled');
}

function handleOnClick(index: number): void {
  toggle();
  anime({
    targets: '.tile',
    opacity: toggled ? 0 : 1,
    delay: anime.stagger(50, {
      grid: [columns, rows],
      from: index,
    }),
  });
}

function createTile(index: number): HTMLElement {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.style.setProperty('--tile-index', String(index));
  tile.style.opacity = toggled ? '0' : '1';
  tile.onclick = () => handleOnClick(index);
  return tile;
}

function createTiles(quantity: number): void {
  Array.from({ length: quantity }, (_, index) => {
    wrapper?.appendChild(createTile(index));
  });
}

function createGrid(): void {
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  const actualCols = Math.max(4, Math.round(containerWidth / TARGET_TILE_SIZE));
  const actualRows = Math.max(4, Math.round(containerHeight / TARGET_TILE_SIZE));

  rows = actualRows;
  columns = actualCols;

  wrapper.style.setProperty('--tile-cols', String(actualCols));
  wrapper.style.setProperty('--tile-rows', String(actualRows));

  createTiles(columns * rows);
}

export function init(): void {
  createGrid();
  window.addEventListener('resize', () => createGrid());
}