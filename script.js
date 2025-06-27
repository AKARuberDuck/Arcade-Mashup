const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const endScreen = document.getElementById("end-screen");
const roundPreview = document.getElementById("round-preview");
const roundNameEl = document.getElementById("round-name");

const usernameInput = document.getElementById("username-input");
const leaderboardList = document.getElementById("leaderboard-list");
const finalScoreText = document.getElementById("final-score");
const trophiesText = document.getElementById("trophies");

const themeSelect = document.getElementById("theme-select");
const invertToggle = document.getElementById("invert-controls");
const oneLifeToggle = document.getElementById("one-life");
const glitchToggle = document.getElementById("glitch-mode");

let username = "";
let score = 0;
let currentRound = 0;
let oneLifeFailed = false;

const baseMiniGames = [
  snakeGame, asteroidGame, spinDodgeGame, slalomGame,
  brickBreaker, lightThePath, magneticMaze, ladderClimb,
  bombDiffuse, stopTheCar
];

let miniGames = [];
let activeSettings = {
  inverted: false,
  oneLife: false,
  glitch: false,
  theme: "neon"
};
function startGame() {
  username = usernameInput.value.trim().toUpperCase();
  if (!username || username.length > 8) return alert("Enter 1–8 character name.");
  activeSettings = {
    inverted: invertToggle.checked,
    oneLife: oneLifeToggle.checked,
    glitch: glitchToggle.checked,
    theme: themeSelect.value
  };

  document.body.className = activeSettings.theme;
  miniGames = shuffle([...baseMiniGames]);
  startScreen.classList.add("hidden");
  runNextRound();
}

function runNextRound() {
  if (currentRound >= miniGames.length || (activeSettings.oneLife && oneLifeFailed)) {
    return endGame();
  }

  const label = miniGames[currentRound].name.replace(/([A-Z])/g, ' $1').trim();
  roundNameEl.textContent = `🎮 Now Playing: ${label}`;
  roundPreview.classList.remove("hidden");

  setTimeout(() => {
    roundPreview.classList.add("hidden");
    clearCanvas();
    miniGames[currentRound](
      () => {
        score++;
        currentRound++;
        runNextRound();
      },
      () => {
        if (activeSettings.oneLife) oneLifeFailed = true;
        currentRound++;
        runNextRound();
      },
      activeSettings
    );
  }, 1500);
}

function endGame() {
  clearCanvas();
  finalScoreText.textContent = `Score: ${score} / ${miniGames.length}`;
  const trophies = [];
  if (score === miniGames.length) trophies.push("🏆 Perfect Run");
  if (activeSettings.oneLife && !oneLifeFailed) trophies.push("❤️ Survived One-Life");
  if (score > 7) trophies.push("🔥 Arcade Pro");
  trophiesText.innerHTML = trophies.join(" ");
  saveScore(username, score);
  updateLeaderboard();
  endScreen.classList.remove("hidden");
}
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px monospace";
  ctx.fillStyle = "white";
}

function saveScore(name, score) {
  const board = JSON.parse(localStorage.getItem("leaderboard")) || [];
  board.push({ name, score });
  board.sort((a, b) => b.score - a.score);
  board.splice(10);
  localStorage.setItem("leaderboard", JSON.stringify(board));
}

function updateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardList.innerHTML = "";
  board.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} ${entry.name} — ${entry.score}`;
    if (entry.name === username && entry.score === score) li.style.color = "gold";
    leaderboardList.appendChild(li);
  });
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
function snakeGame(onWin, onLose, settings) {
  const box = 20;
  const cols = canvas.width / box;
  const rows = canvas.height / box;
  let dir = { x: 1, y: 0 };

  const portals = [
    { x: 2, y: 2, toX: cols - 3, toY: rows - 3 },
    { x: cols - 3, y: rows - 3, toX: 2, toY: 2 }
  ];

  let snake = [{ x: 10, y: 10 }];
  let food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
  let apples = 0;

  document.addEventListener("keydown", handler);
  let start = performance.now();
  let animationId;

  function handler(e) {
    const inv = settings.inverted ? -1 : 1;
    if (e.key === "ArrowUp" && dir.y === 0) dir = { x: 0, y: -1 * inv };
    if (e.key === "ArrowDown" && dir.y === 0) dir = { x: 0, y: 1 * inv };
    if (e.key === "ArrowLeft" && dir.x === 0) dir = { x: -1 * inv, y: 0 };
    if (e.key === "ArrowRight" && dir.x === 0) dir = { x: 1 * inv, y: 0 };
  }

  function loop(ts) {
    if (ts - start > 20000) return finish(true);
    if ((ts - start) % 200 < 20) {
      const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
      };

      // Portal check
      portals.forEach(p => {
        if (head.x === p.x && head.y === p.y) {
          head.x = p.toX;
          head.y = p.toY;
        }
      });

      if (
        head.x < 0 || head.x >= cols ||
        head.y < 0 || head.y >= rows ||
        snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)
      ) return finish(false);

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        apples++;
        if (apples >= 3) return finish(true);
        food = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows)
        };
      } else {
        snake.pop();
      }
    }

    draw();
    animationId = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "lime";
    snake.forEach(s => ctx.fillRect(s.x * box, s.y * box, box - 1, box - 1));

    ctx.fillStyle = "red";
    ctx.fillRect(food.x * box, food.y * box, box - 1, box - 1);

    ctx.fillStyle = "#00f";
    portals.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * box + box / 2, p.y * box + box / 2, box / 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = "white";
    ctx.fillText(`🍎 ${apples}/3`, 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(animationId);
    document.removeEventListener("keydown", handler);
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function asteroidGame(onWin, onLose, settings) {
  const ship = { x: canvas.width / 2, y: canvas.height - 30 };
  let bullets = [];
  let asteroids = [];
  let kills = 0;
  const targetKills = 5;
  let keys = {};

  const spawnAsteroids = () => {
    for (let i = 0; i < targetKills; i++) {
      asteroids.push({
        x: Math.random() * canvas.width,
        y: -20,
        dx: Math.random() * 2 - 1,
        dy: 1 + Math.random(),
        r: 20 + Math.random() * 10
      });
    }
  };

  const shoot = () => {
    bullets.push({ x: ship.x, y: ship.y });
  };

  const onKey = (e) => {
    keys[e.key] = true;
    if (e.key === " ") shoot();
  };

  const onKeyUp = (e) => (keys[e.key] = false);

  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKeyUp);
  spawnAsteroids();

  const start = performance.now();
  let frame;

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed >= 20000) return finish(kills >= targetKills);

    if (settings.inverted) {
      if (keys["ArrowLeft"]) ship.x += 4;
      if (keys["ArrowRight"]) ship.x -= 4;
    } else {
      if (keys["ArrowLeft"]) ship.x -= 4;
      if (keys["ArrowRight"]) ship.x += 4;
    }

    bullets.forEach((b) => (b.y -= 5));
    bullets = bullets.filter((b) => b.y > 0);

    asteroids.forEach((a) => {
      a.x += a.dx;
      a.y += a.dy;
    });

    bullets.forEach((b, bi) => {
      asteroids.forEach((a, ai) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.r) {
          kills++;
          bullets.splice(bi, 1);
          asteroids.splice(ai, 1);
        }
      });
    });

    asteroids = asteroids.filter((a) => a.y < canvas.height);
    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();
    if (settings.glitch && Math.random() < 0.01) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "yellow";
    bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));

    ctx.fillStyle = "gray";
    asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "white";
    ctx.fillText(`💥 ${kills}/${targetKills}`, 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKeyUp);
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function spinDodgeGame(onWin, onLose, settings) {
  const player = { x: 320, y: 400, r: 10, canTeleport: true };
  const portal = { x: 50, y: 50, r: 15 };
  const blades = [
    { x: 320, y: 240, radius: 100, angle: 0, speed: 0.04 },
    { x: 320, y: 240, radius: 70, angle: Math.PI / 2, speed: -0.06 }
  ];

  let keys = {};
  let start = performance.now();
  let frame;

  function onKey(e) {
    keys[e.key] = true;
  }

  function onKeyUp(e) {
    keys[e.key] = false;
  }

  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKeyUp);

  function teleport() {
    player.x = 320;
    player.y = 240;
    player.canTeleport = false;
  }

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed >= 20000) return finish(true);

    // Movement
    const speed = 3;
    const inv = settings.inverted ? -1 : 1;
    if (keys["ArrowLeft"]) player.x += speed * -inv;
    if (keys["ArrowRight"]) player.x += speed * inv;
    if (keys["ArrowUp"]) player.y += speed * -inv;
    if (keys["ArrowDown"]) player.y += speed * inv;

    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // Check portal teleport
    if (
      player.canTeleport &&
      Math.hypot(player.x - portal.x, player.y - portal.y) < portal.r + player.r
    ) {
      teleport();
    }

    // Blade updates
    blades.forEach((b) => (b.angle += b.speed));

    for (let b of blades) {
      const bx = b.x + b.radius * Math.cos(b.angle);
      const by = b.y + b.radius * Math.sin(b.angle);
      const dx = bx - player.x;
      const dy = by - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.r + 10) return finish(false);
    }

    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();

    if (settings.glitch && Math.random() < 0.01) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw blades
    blades.forEach((b) => {
      const bx = b.x + b.radius * Math.cos(b.angle);
      const by = b.y + b.radius * Math.sin(b.angle);
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Portal
    if (player.canTeleport) {
      ctx.strokeStyle = "#00f";
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#00f";
      ctx.fillText("⬇", portal.x - 5, portal.y + 4);
    }

    ctx.fillStyle = "white";
    ctx.fillText("Avoid the blades! Use portal once →", 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKeyUp);
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function slalomGame(onWin, onLose, settings) {
  const player = { x: canvas.width / 2, y: canvas.height - 40, w: 20, h: 20 };
  const flags = [];
  const totalFlags = 7;
  let keys = {};
  let passed = 0;
  let missed = false;
  let frame;

  for (let i = 0; i < totalFlags; i++) {
    flags.push({
      x: 50 + Math.random() * (canvas.width - 100),
      y: -100 * i - 60,
      passed: false
    });
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  const start = performance.now();

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed > 20000) return finish(!missed && passed >= totalFlags);

    if (settings.inverted) {
      if (keys["ArrowLeft"]) player.x += 4;
      if (keys["ArrowRight"]) player.x -= 4;
    } else {
      if (keys["ArrowLeft"]) player.x -= 4;
      if (keys["ArrowRight"]) player.x += 4;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    flags.forEach(f => {
      f.y += 2;
      if (!f.passed && f.y + 15 > player.y) {
        if (player.x > f.x - 25 && player.x < f.x + 25) {
          f.passed = true;
          passed++;
        } else {
          missed = true;
        }
      }
    });

    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();
    if (settings.glitch && Math.random() < 0.03) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);

    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    flags.forEach(f => {
      if (!f.passed) {
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(f.x - 20, f.y, 5, 25);
        ctx.fillRect(f.x + 20, f.y, 5, 25);
      }
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white";
    ctx.fillText(`⛷️ Passed: ${passed}/${totalFlags}`, 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function brickBreaker(onWin, onLose, settings) {
  const paddle = { x: canvas.width / 2 - 40, w: 80, h: 10 };
  const ball = { x: canvas.width / 2, y: 300, dx: 3, dy: -3, r: 8 };
  const bricks = [];
  const rows = 3, cols = 8;
  const brickW = 70, brickH = 20;
  const marginX = 40;
  let keys = {};
  let destroyed = 0;
  const goal = 10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({ x: marginX + c * brickW, y: 50 + r * brickH, hit: false });
    }
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  const start = performance.now();
  let frame;

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed > 20000) return finish(destroyed >= goal);

    if (settings.inverted) {
      if (keys["ArrowLeft"]) paddle.x += 5;
      if (keys["ArrowRight"]) paddle.x -= 5;
    } else {
      if (keys["ArrowLeft"]) paddle.x -= 5;
      if (keys["ArrowRight"]) paddle.x += 5;
    }

    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.dx *= -1;
    if (ball.y < ball.r) ball.dy *= -1;
    if (ball.y > canvas.height) return finish(false);

    if (
      ball.y + ball.r >= canvas.height - 30 &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.w
    ) {
      ball.dy *= -1;
    }

    bricks.forEach(b => {
      if (!b.hit &&
          ball.x > b.x && ball.x < b.x + brickW &&
          ball.y - ball.r < b.y + brickH && ball.y + ball.r > b.y) {
        b.hit = true;
        destroyed++;
        ball.dy *= -1;
      }
    });

    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();

    if (settings.glitch && Math.random() < 0.02) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);

    // Paddle
    ctx.fillStyle = "white";
    ctx.fillRect(paddle.x, canvas.height - 30, paddle.w, paddle.h);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Bricks
    bricks.forEach(b => {
      if (!b.hit) {
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(b.x, b.y, brickW - 2, brickH - 2);
      }
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white";
    ctx.fillText(`🧱 Broken: ${destroyed}/${goal}`, 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function lightThePath(onWin, onLose, settings) {
  const grid = [];
  const rows = 3, cols = 3;
  const size = 100;
  let pattern = [];
  let input = [];
  let clickable = false;
  const offsetX = 120, offsetY = 80;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push({
        x: offsetX + x * size,
        y: offsetY + y * size,
        id: y * cols + x
      });
    }
  }

  const highlightOrder = settings.glitch && Math.random() < 0.3
    ? [8, 4, 0, 6] // reversed hardcoded glitch pattern
    : Array.from({ length: 4 }, () =>
        grid[Math.floor(Math.random() * grid.length)].id
      );

  pattern = highlightOrder.slice();

  function showPattern() {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= pattern.length) {
        clearInterval(interval);
        clickable = true;
        draw();
        return;
      }
      draw(pattern[i]);
      i++;
    }, 500);
  }

  function handleClick(e) {
    if (!clickable) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let tile of grid) {
      if (
        mx > tile.x && mx < tile.x + size - 10 &&
        my > tile.y && my < tile.y + size - 10
      ) {
        input.push(tile.id);
        draw(); // update after click
        if (tile.id !== pattern[input.length - 1]) return finish(false);
        if (input.length === pattern.length) return finish(true);
        break;
      }
    }
  }

  function draw(activeId) {
    clearCanvas();
    ctx.font = "18px monospace";
    grid.forEach(tile => {
      let lit = pattern.includes(tile.id) && !clickable;
      if (activeId !== undefined && tile.id === activeId) lit = true;
      ctx.fillStyle = lit ? "#ffff80" : "#333";
      ctx.fillRect(tile.x, tile.y, size - 10, size - 10);
      ctx.strokeStyle = "white";
      ctx.strokeRect(tile.x, tile.y, size - 10, size - 10);
    });
    ctx.fillStyle = "white";
    ctx.fillText(`💡 Repeat the pattern`, 10, 20);
  }

  function finish(success) {
    canvas.removeEventListener("click", handleClick);
    success ? onWin() : onLose();
  }

  const timeout = setTimeout(() => finish(false), 15000);
  canvas.addEventListener("click", handleClick);
  draw();
  showPattern();
}
function magneticMaze(onWin, onLose, settings) {
  const ball = { x: 60, y: 60, r: 10, dx: 0, dy: 0 };
  const magnets = [
    { x: 320, y: 240, strength: 0.6, polarity: 1 },   // attract
    { x: 200, y: 320, strength: 0.4, polarity: -1 }   // repel
  ];
  const goal = { x: 580, y: 420, size: 30 };
  let keys = {};
  let frame;

  const start = performance.now();

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed > 20000) return finish(ball.x > goal.x && ball.y > goal.y);

    const inv = settings.inverted ? -1 : 1;
    if (keys["ArrowLeft"]) ball.dx -= 0.2 * inv;
    if (keys["ArrowRight"]) ball.dx += 0.2 * inv;
    if (keys["ArrowUp"]) ball.dy -= 0.2 * inv;
    if (keys["ArrowDown"]) ball.dy += 0.2 * inv;

    // Magnet physics
    magnets.forEach(m => {
      const dx = m.x - ball.x;
      const dy = m.y - ball.y;
      const dist = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      const force = (m.strength / dist) * m.polarity;
      ball.dx += (dx / dist) * force;
      ball.dy += (dy / dist) * force;
    });

    if (settings.glitch && Math.random() < 0.01) {
      ball.dx += (Math.random() - 0.5) * 4;
      ball.dy += (Math.random() - 0.5) * 4;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.x < 0 || ball.x > canvas.width || ball.y < 0 || ball.y > canvas.height) {
      return finish(false);
    }

    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f0";
    ctx.fillRect(goal.x, goal.y, goal.size, goal.size);

    magnets.forEach(m => {
      ctx.beginPath();
      ctx.fillStyle = m.polarity > 0 ? "#00f" : "#f00";
      ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "white";
    ctx.fillText("🧲 Reach the green exit box", 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function ladderClimb(onWin, onLose, settings) {
  const player = { x: 300, y: 400, w: 20, h: 20, vy: 0 };
  const gravity = 0.3;
  const platforms = [];
  const jumpForce = -6;
  const keys = {};
  let frame;

  for (let i = 0; i < 6; i++) {
    platforms.push({
      x: 80 + Math.random() * 400,
      y: canvas.height - i * 80,
      w: 100,
      h: 10
    });
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  const start = performance.now();

  function loop(ts) {
    const elapsed = ts - start;
    if (elapsed > 20000) return finish(player.y < 10);

    const inv = settings.inverted ? -1 : 1;
    if (keys["ArrowLeft"]) player.x -= 3 * inv;
    if (keys["ArrowRight"]) player.x += 3 * inv;

    if (settings.glitch && Math.random() < 0.005) {
      player.vy = -player.vy; // Reverse gravity
    }

    player.vy += gravity;
    player.y += player.vy;

    for (let p of platforms) {
      if (
        player.y + player.h > p.y &&
        player.y + player.h < p.y + p.h + 5 &&
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        player.vy > 0
      ) {
        player.vy = jumpForce;
      }
    }

    if (player.y > canvas.height) return finish(false);
    draw();
    frame = requestAnimationFrame(loop);
  }

  function draw() {
    clearCanvas();

    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#0f0";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    ctx.fillStyle = "white";
    ctx.fillText("🪜 Reach the top without falling", 10, 20);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop(performance.now());
}
function bombDiffuse(onWin, onLose, settings) {
  const code = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
  const input = [];
  let displayInput = "";
  let currentIndex = 0;

  let glitchMap = settings.glitch
    ? {
        "1": "7",
        "2": "5",
        "3": "9",
        "4": "0",
        "5": "2",
        "6": "1",
        "7": "4",
        "8": "3",
        "9": "6",
        "0": "8"
      }
    : null;

  function onKey(e) {
    if (input.length >= code.length) return;

    let key = e.key;
    if (!/^[0-9]$/.test(key)) return;

    let shown = key;
    if (glitchMap && glitchMap[key]) {
      key = glitchMap[key]; // Real value
      shown = glitchMap[key] + "?"; // Confusing display
    }

    input.push(Number(key));
    displayInput += shown;

    if (input[input.length - 1] !== code[input.length - 1]) return finish(false);
    if (input.length === code.length) return finish(true);

    draw();
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "white";
    ctx.fillText("💣 Enter the 3-digit code", 180, 100);
    ctx.fillStyle = "gray";
    ctx.fillText("Code: " + "* ".repeat(code.length), 220, 150);

    ctx.fillStyle = "lime";
    ctx.fillText("Input: " + displayInput.padEnd(code.length * 2, "_ "), 200, 200);
    ctx.fillStyle = "white";
  }

  function finish(success) {
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
    success ? onWin() : onLose();
  }

  draw();
  document.addEventListener("keydown", onKey);

  const start = Date.now();
  const timer = setInterval(() => {
    const now = Date.now();
    const remaining = 20 - Math.floor((now - start) / 1000);
    if (remaining <= 0) finish(false);

    ctx.fillStyle = "white";
    ctx.fillText(`⏱️ Time Left: ${remaining}s`, 10, 20);
  }, 1000);
}
function stopTheCar(onWin, onLose, settings) {
  let car = { x: 50, speed: 2.5, stopped: false };
  const stopLine = 540;
  let brakePressed = false;
  let frame;
  let glitchOffset = settings.glitch && Math.random() < 0.5 ? Math.random() * 30 - 15 : 0;
  const start = performance.now();

  function draw() {
    clearCanvas();
    if (settings.glitch && Math.random() < 0.02) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);

    // Stop Line
    ctx.fillStyle = "red";
    const lineX = stopLine + glitchOffset;
    ctx.fillRect(lineX, 0, 4, canvas.height);

    // Car
    ctx.fillStyle = "white";
    ctx.fillRect(car.x, canvas.height / 2 - 10, 50, 20);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillText("⏹ Press [SPACE] to Stop", 180, 30);
  }

  function loop(ts) {
    if (ts - start > 20000) return finish(false);

    if (!car.stopped) {
      car.x += car.speed;
    }

    draw();

    if (!car.stopped && brakePressed) {
      car.stopped = true;

      if (settings.glitch && Math.random() < 0.3) {
        // fake "braking delay" in glitch mode
        setTimeout(() => evaluateStop(), 500);
      } else {
        evaluateStop();
      }
    }

    if (car.x + 50 >= canvas.width) return finish(false);

    frame = requestAnimationFrame(loop);
  }

  function evaluateStop() {
    const finalX = car.x + 50;
    const threshold = 12;
    const delta = Math.abs(finalX - (stopLine + glitchOffset));
    if (delta <= threshold) finish(true);
    else finish(false);
  }

  function onKey(e) {
    if (e.code === "Space") brakePressed = true;
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", onKey);
    success ? onWin() : onLose();
  }

  document.addEventListener("keydown", onKey);
  loop(performance.now());
}
