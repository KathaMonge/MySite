import { submitScore, getTopScores } from './supabase';

interface Pos {
  x: number;
  y: number;
}

export function init(): void {
  const c = document.getElementById('snake-canvas') as HTMLCanvasElement;
  if (!c) return;
  const ctx = c.getContext('2d')!;
  const scoreEl = document.getElementById('snake-score')!;
  const restartBtn = document.getElementById('snake-restart')!;
  const fullscreenBtn = document.getElementById('snake-fullscreen')!;
  const card = document.getElementById('snake-card')!;
  const overlay = document.getElementById('snake-overlay')!;
  const playBtn = document.getElementById('snake-play-btn')!;
  const dialog = document.getElementById('name-dialog') as HTMLDialogElement;
  const nameInput = document.getElementById('name-input') as HTMLInputElement;
  const nameSubmit = document.getElementById('name-submit')!;
  const nameSkip = document.getElementById('name-skip')!;
  const dialogScore = document.getElementById('dialog-score')!;
  const lbEntries = document.getElementById('leaderboard-entries')!;

  const SZ = 25;
  const COLS = 20;
  let snake: Pos[] = [{ x: 10, y: 10 }];
  let dir: Pos = { x: 1, y: 0 };
  const food: Pos = { x: 15, y: 15 };
  let nextDir: Pos = { x: 1, y: 0 };
  let score = 0;
  let over = false;
  let playing = false;
  let id: number | undefined;

  let touchStartX = 0;
  let touchStartY = 0;

  function randFood(): void {
    food.x = Math.floor(Math.random() * COLS);
    food.y = Math.floor(Math.random() * COLS);
    for (let i = 0; i < snake.length; i++)
      if (snake[i].x === food.x && snake[i].y === food.y) {
        randFood();
        return;
      }
  }

  function setDir(dx: number, dy: number): void {
    if (over || !playing) return;
    if (
      (dx !== 0 && nextDir.x !== 0 && dx === -nextDir.x) ||
      (dy !== 0 && nextDir.y !== 0 && dy === -nextDir.y)
    )
      return;
    nextDir = { x: dx, y: dy };
  }

  function update(): void {
    if (over) return;
    dir.x = nextDir.x;
    dir.y = nextDir.y;
    const head: Pos = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y,
    };
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = COLS - 1;
    if (head.y >= COLS) head.y = 0;
    for (let i = 1; i < snake.length; i++)
      if (snake[i].x === head.x && snake[i].y === head.y) {
        over = true;
        return;
      }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = '\u{1F353} ' + score;
      randFood();
    } else snake.pop();
  }

  function draw(): void {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(26, 60, 26, 1)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.25)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * SZ, 0);
      ctx.lineTo(i * SZ, c.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * SZ);
      ctx.lineTo(c.width, i * SZ);
      ctx.stroke();
    }
    ctx.fillStyle = '#FF8F00';
    ctx.shadowColor = '#FF8F00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(food.x * SZ + SZ / 2, food.y * SZ + SZ / 2, SZ / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      if (i === 0) {
        const cx = s.x * SZ + SZ / 2;
        const cy = s.y * SZ + SZ / 2;
        ctx.fillStyle = '#FF8F00';
        ctx.shadowColor = '#FF8F00';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, SZ / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00C853';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 4, cy - 5, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#FFB300' : '#1a3c1a';
        ctx.fillRect(s.x * SZ + 3, s.y * SZ + 3, SZ - 6, SZ - 6);
        ctx.strokeStyle = '#FF8F00';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(s.x * SZ + 3, s.y * SZ + 3, SZ - 6, SZ - 6);
      }
    }
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#FF8F00';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F4A5} GAME OVER', c.width / 2, c.height / 2 - 14);
      ctx.fillStyle = '#C8E6C9';
      ctx.font = '16px system-ui';
      ctx.fillText('Score: ' + score, c.width / 2, c.height / 2 + 16);
    }
  }

  let dialogOpen = false;

  async function refreshLeaderboard(): Promise<void> {
    try {
      const scores = await getTopScores(20);
      if (scores.length === 0) {
        lbEntries.innerHTML = '<span class="lb-empty">No scores yet \u2014 be the first!</span>';
        return;
      }
      lbEntries.innerHTML = scores
        .map(
          (s, i) =>
            `<div class="lb-row">
              <span class="lb-rank">${i + 1}</span>
              <span class="lb-name">${escHtml(s.name)}</span>
              <span class="lb-score">\u{1F353} ${s.score}</span>
            </div>`,
        )
        .join('');
    } catch {
      lbEntries.innerHTML = '<span class="lb-empty">Leaderboard unavailable</span>';
    }
  }

  function escHtml(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function showHighScoreDialog(): void {
    if (dialogOpen) return;
    dialogOpen = true;
    dialogScore.textContent = String(score);
    nameInput.value = '';
    dialog.showModal();
  }

  function closeHighScoreDialog(): void {
    dialogOpen = false;
    dialog.close();
  }

  nameSubmit.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name || name.length < 1 || name.length > 20) return;
    try {
      await submitScore(name, score);
    } catch {
      /* silent */
    }
    closeHighScoreDialog();
    refreshLeaderboard();
  });

  nameSkip.addEventListener('click', closeHighScoreDialog);

  dialog.addEventListener('close', () => {
    dialogOpen = false;
  });

  nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') nameSubmit.click();
  });

  function drawInitial(): void {
    randFood();
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#FF8F00';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('â–¶ Press Play', c.width / 2, c.height / 2);
    ctx.fillStyle = '#81C784';
    ctx.font = '12px system-ui';
    ctx.fillText('Arrow keys Â· Swipe on mobile', c.width / 2, c.height / 2 + 26);
  }

  function tick(): void {
    update();
    draw();
    if (over && score > 0 && !dialogOpen) {
      showHighScoreDialog();
    }
    if (!over) id = window.setTimeout(tick, 130);
  }

  function start(): void {
    if (playing) return;
    playing = true;
    overlay.classList.add('hidden');
    if (over) {
      restart();
    } else {
      tick();
    }
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (over || !playing) return;
    const k = e.key;
    if (k === 'ArrowUp') {
      e.preventDefault();
      setDir(0, -1);
    } else if (k === 'ArrowDown') {
      e.preventDefault();
      setDir(0, 1);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      setDir(-1, 0);
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      setDir(1, 0);
    }
  });

  c.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true },
  );

  c.addEventListener(
    'touchend',
    (e: TouchEvent) => {
      if (over || !playing) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return;
      if (absDx > absDy) {
        setDir(dx > 0 ? 1 : -1, 0);
      } else {
        setDir(0, dy > 0 ? 1 : -1);
      }
    },
    { passive: true },
  );

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      const el = card as HTMLElement & {
        webkitRequestFullscreen?: () => void;
        msRequestFullscreen?: () => void;
      };
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      const doc = document as Document & {
        webkitExitFullscreen?: () => void;
        msExitFullscreen?: () => void;
      };
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
    }
  });

  function restart(): void {
    if (id) clearTimeout(id);
    snake = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    over = false;
    dialogOpen = false;
    scoreEl.textContent = '\u{1F353} 0';
    if (playing) {
      randFood();
      tick();
    } else {
      drawInitial();
      overlay.classList.remove('hidden');
    }
  }

  playBtn.addEventListener('click', start);
  overlay.addEventListener('click', start);
  restartBtn.addEventListener('click', restart);
  refreshLeaderboard();
  drawInitial();
}
