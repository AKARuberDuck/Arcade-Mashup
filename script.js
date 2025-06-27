const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const usernameInput = document.getElementById("username-input");
const promptDiv = document.getElementById("prompt");
const scoreboardDiv = document.getElementById("scoreboard");
const finalScoreText = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");

let currentRound = 0;
let score = 0;
let username = "";

const totalRounds = 10;

const miniGames = [
  snakeGame,
  asteroidGame,
  spinDodgeGame,
  slalomGame,
  brickBreaker,
  lightThePath,
  magneticMaze,
  ladderClimb,
  bombDiffuse,
  stopTheCar
];

// Prompt for username at launch
window.onload = () => {
  promptDiv.classList.remove("hidden");
};

// Start Game
function startGame() {
  username = usernameInput.value.trim().toUpperCase();
  if (!username || username.length < 1 || username.length > 8) {
    alert("Enter initials (1–8 characters).");
    return;
  }

  promptDiv.classList.add("hidden");
  nextRound();
}

// Core Game Flow
function nextRound() {
  if (currentRound >= totalRounds) {
    showScoreboard();
    return;
  }

  clearCanvas();
  miniGames[currentRound](() => {
    score++;
    currentRound++;
    setTimeout(nextRound, 1000);
  }, () => {
    currentRound++;
    setTimeout(nextRound, 1000);
  });
}

// Placeholder Mini-Games — replace these with full versions!
function snakeGame(onWin, onLose) {
  const box = 20;
  const cols = canvas.width / box;
  const rows = canvas.height / box;

  let snake = [{ x: 10, y: 10 }];
  let dir = { x: 1, y: 0 };
  let food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
  let applesEaten = 0;

  let interval = setInterval(gameLoop, 100);
  document.addEventListener("keydown", keyHandler);

  function keyHandler(e) {
    if (e.key === "ArrowUp" && dir.y === 0) dir = { x: 0, y: -1 };
    else if (e.key === "ArrowDown" && dir.y === 0) dir = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft" && dir.x === 0) dir = { x: -1, y: 0 };
    else if (e.key === "ArrowRight" && dir.x === 0) dir = { x: 1, y: 0 };
  }

  function gameLoop() {
    const head = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y
    };

    // Check wall collision
    if (
      head.x < 0 || head.x >= cols ||
      head.y < 0 || head.y >= rows
    ) return end(false);

    // Check self collision
    if (snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)) return end(false);

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      applesEaten++;
      if (applesEaten >= 3) return end(true);

      food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "lime";
    snake.forEach(s => ctx.fillRect(s.x * box, s.y * box, box - 1, box - 1));

    ctx.fillStyle = "red";
    ctx.fillRect(food.x * box, food.y * box, box - 1, box - 1);

    ctx.fillStyle = "white";
    ctx.fillText(`🍎 ${applesEaten} / 3`, 10, 20);
  }

  function end(success) {
    clearInterval(interval);
    document.removeEventListener("keydown", keyHandler);
    success ? onWin() : onLose();
  }
}

function asteroidGame(onWin, onLose) {
  let bullets = [];
  let asteroids = [];
  let kills = 0;
  const ship = { x: canvas.width / 2, y: canvas.height - 30 };

  function shoot() {
    bullets.push({ x: ship.x, y: ship.y });
  }

  function spawnAsteroids() {
    for (let i = 0; i < 5; i++) {
      asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 200,
        r: 20 + Math.random() * 20,
        dx: Math.random() * 2 - 1,
        dy: 1 + Math.random()
      });
    }
  }

  let keys = {};
  document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === " ") shoot();
  });
  document.addEventListener("keyup", e => keys[e.key] = false);

  spawnAsteroids();
  let frame;

  function loop() {
    clearCanvas();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, 10, 0, Math.PI * 2);
    ctx.fill();

    if (keys["ArrowLeft"]) ship.x -= 4;
    if (keys["ArrowRight"]) ship.x += 4;

    bullets.forEach(b => b.y -= 5);
    bullets = bullets.filter(b => b.y > 0);

    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));

    asteroids.forEach(a => {
      a.x += a.dx;
      a.y += a.dy;
      ctx.beginPath();
      ctx.fillStyle = "gray";
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Collision
    bullets.forEach((b, bi) => {
      asteroids.forEach((a, ai) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < a.r) {
          kills++;
          asteroids.splice(ai, 1);
          bullets.splice(bi, 1);
        }
      });
    });

    ctx.fillStyle = "white";
    ctx.fillText(`💥 ${kills} / 5`, 10, 20);

    if (kills >= 5) return finish(true);
    if (asteroids.some(a => a.y > canvas.height)) return finish(false);

    frame = requestAnimationFrame(loop);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop();
}

// 🎯 MINI-GAME 1: Spin Dodge
function spinDodgeGame(onWin, onLose) {
  const blades = [{x: 320, y: 240, radius: 100, angle: 0}];
  const player = {x: 320, y: 400, r: 10};
  const keys = {};

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  let time = 10000;
  let start = performance.now();

  function update(timestamp) {
    const elapsed = timestamp - start;
    if (elapsed >= time) {
      cancelAnimationFrame(animationId);
      onWin();
      return;
    }

    if (keys["ArrowLeft"]) player.x -= 4;
    if (keys["ArrowRight"]) player.x += 4;
    if (keys["ArrowUp"]) player.y -= 4;
    if (keys["ArrowDown"]) player.y += 4;

    // Clamp to bounds
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // Update blades
    blades.forEach(b => b.angle += 0.05);

    // Collision check
    for (const b of blades) {
      const bx = b.x + b.radius * Math.cos(b.angle);
      const by = b.y + b.radius * Math.sin(b.angle);
      const dx = bx - player.x;
      const dy = by - player.y;
      if (Math.sqrt(dx*dx + dy*dy) < player.r + 10) {
        cancelAnimationFrame(animationId);
        onLose();
        return;
      }
    }

    drawSpinGame(player, blades);
    animationId = requestAnimationFrame(update);
  }

  animationId = requestAnimationFrame(update);
}

// 🖼️ DRAW SPIN DODGE
function drawSpinGame(player, blades) {
  clearCanvas();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "red";
  blades.forEach(b => {
    const bx = b.x + b.radius * Math.cos(b.angle);
    const by = b.y + b.radius * Math.sin(b.angle);
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "gray";
  ctx.fillText(`Round ${currentRound + 1}`, 10, 20);
}
function slalomGame(onWin, onLose) {
  let player = { x: canvas.width / 2, y: canvas.height - 60 };
  let flags = [];
  let passed = 0;
  const totalFlags = 5;
  const keys = {};
  let frame;

  for (let i = 0; i < totalFlags; i++) {
    flags.push({
      x: 50 + Math.random() * (canvas.width - 100),
      y: -100 * i,
      passed: false
    });
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  function loop() {
    clearCanvas();

    if (keys["ArrowLeft"]) player.x -= 4;
    if (keys["ArrowRight"]) player.x += 4;

    player.x = Math.max(0, Math.min(canvas.width, player.x));

    ctx.fillStyle = "white";
    ctx.fillRect(player.x - 10, player.y, 20, 20);

    ctx.fillStyle = "cyan";
    flags.forEach(f => {
      f.y += 2;
      ctx.fillRect(f.x - 20, f.y, 5, 30);
      ctx.fillRect(f.x + 20, f.y, 5, 30);

      if (!f.passed && f.y > player.y) {
        if (player.x > f.x - 20 && player.x < f.x + 20) {
          f.passed = true;
          passed++;
        } else {
          return finish(false);
        }
      }
    });

    ctx.fillStyle = "white";
    ctx.fillText(`⛷️ Flags: ${passed}/${totalFlags}`, 10, 20);

    if (passed >= totalFlags) return finish(true);

    frame = requestAnimationFrame(loop);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop();
}

function brickBreaker(onWin, onLose) {
  let paddle = { x: canvas.width / 2 - 40, w: 80, h: 10 };
  let ball = { x: canvas.width / 2, y: 300, dx: 3, dy: -3, r: 8 };
  let bricks = [];
  const rows = 2, cols = 7;
  const brickW = 80, brickH = 20;
  let destroyed = 0;
  const goal = 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({ x: 50 + c * brickW, y: 50 + r * brickH, hit: false });
    }
  }

  let keys = {};
  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  let frame;
  function loop() {
    clearCanvas();

    if (keys["ArrowLeft"]) paddle.x -= 5;
    if (keys["ArrowRight"]) paddle.x += 5;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision
    if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.dx *= -1;
    if (ball.y < ball.r) ball.dy *= -1;
    if (ball.y > canvas.height) return finish(false);

    // Paddle bounce
    if (
      ball.y + ball.r > canvas.height - 30 &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.w
    ) {
      ball.dy *= -1;
    }

    // Brick collision
    bricks.forEach(b => {
      if (!b.hit &&
          ball.x > b.x && ball.x < b.x + brickW &&
          ball.y - ball.r < b.y + brickH && ball.y + ball.r > b.y) {
        b.hit = true;
        ball.dy *= -1;
        destroyed++;
      }
    });

    // Draw
    ctx.fillStyle = "white";
    ctx.fillRect(paddle.x, canvas.height - 30, paddle.w, paddle.h);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    bricks.forEach(b => {
      if (!b.hit) {
        ctx.fillStyle = "orange";
        ctx.fillRect(b.x, b.y, brickW - 2, brickH - 2);
      }
    });

    ctx.fillStyle = "white";
    ctx.fillText(`🧱 Bricks: ${destroyed}/${goal}`, 10, 20);

    if (destroyed >= goal) return finish(true);

    frame = requestAnimationFrame(loop);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop();
}

function lightThePath(onWin, onLose) {
  const grid = [];
  const rows = 3, cols = 3;
  const size = 100;
  let pattern = [];
  let input = [];
  let showing = true;
  let clickable = false;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push({ x: x * size + 120, y: y * size + 100, id: y * cols + x });
    }
  }

  pattern = Array.from({ length: 4 }, () =>
    grid[Math.floor(Math.random() * grid.length)].id
  );

  let index = 0;

  function draw() {
    clearCanvas();
    ctx.font = "20px monospace";
    grid.forEach(tile => {
      ctx.fillStyle = pattern.includes(tile.id) && showing
        ? "#ffd700"
        : "#333";
      ctx.fillRect(tile.x, tile.y, size - 10, size - 10);
      ctx.strokeStyle = "white";
      ctx.strokeRect(tile.x, tile.y, size - 10, size - 10);
    });
  }

  function clickHandler(e) {
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
        if (tile.id !== pattern[input.length - 1]) {
          finish(false);
          return;
        }
        if (input.length === pattern.length) {
          finish(true);
        }
        break;
      }
    }
  }

  function finish(success) {
    canvas.removeEventListener("click", clickHandler);
    success ? onWin() : onLose();
  }

  draw();
  setTimeout(() => {
    showing = false;
    clickable = true;
    draw();
    canvas.addEventListener("click", clickHandler);
  }, 1500);
}

function magneticMaze(onWin, onLose) {
  const ball = { x: 60, y: 60, r: 10 };
  const goal = { x: 560, y: 400 };
  const magnets = [
    { x: 320, y: 240, strength: 0.2, polarity: 1 },
    { x: 180, y: 320, strength: 0.3, polarity: -1 }
  ];
  let keys = {};

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  let dx = 0, dy = 0;
  let frame;

  function loop() {
    if (keys["ArrowLeft"]) dx -= 0.1;
    if (keys["ArrowRight"]) dx += 0.1;
    if (keys["ArrowUp"]) dy -= 0.1;
    if (keys["ArrowDown"]) dy += 0.1;

    magnets.forEach(m => {
      const mx = m.x - ball.x;
      const my = m.y - ball.y;
      const dist = Math.sqrt(mx * mx + my * my);
      const force = m.strength / (dist || 1);
      dx += (mx / dist) * force * m.polarity;
      dy += (my / dist) * force * m.polarity;
    });

    ball.x += dx;
    ball.y += dy;

    clearCanvas();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "blue";
    ctx.fillRect(goal.x, goal.y, 30, 30);

    ctx.fillStyle = "magenta";
    magnets.forEach(m =>
      ctx.beginPath(),
      ctx.arc(m.x, m.y, 10, 0, Math.PI * 2),
      ctx.fill()
    );

    if (ball.x > goal.x && ball.x < goal.x + 30 &&
        ball.y > goal.y && ball.y < goal.y + 30) return finish(true);

    if (ball.x < 0 || ball.x > canvas.width ||
        ball.y < 0 || ball.y > canvas.height) return finish(false);

    frame = requestAnimationFrame(loop);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop();
}

function ladderClimb(onWin, onLose) {
  const player = { x: 300, y: 400, w: 20, h: 20, vy: 0 };
  const platforms = [];
  let keys = {};
  let frame;

  for (let i = 0; i < 5; i++) {
    platforms.push({
      x: 100 + Math.random() * 400,
      y: 440 - i * 80,
      w: 100,
      h: 10
    });
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  function loop() {
    if (keys["ArrowLeft"]) player.x -= 3;
    if (keys["ArrowRight"]) player.x += 3;

    player.vy += 0.2;
    player.y += player.vy;

    for (let p of platforms) {
      if (
        player.y + player.h > p.y &&
        player.y + player.h < p.y + p.h + 10 &&
        player.x + player.w > p.x && player.x < p.x + p.w &&
        player.vy > 0
      ) {
        player.vy = -5;
      }
    }

    clearCanvas();
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "green";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    if (player.y < 10) return finish(true);
    if (player.y > canvas.height) return finish(false);

    frame = requestAnimationFrame(loop);
  }

  function finish(success) {
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", () => {});
    document.removeEventListener("keyup", () => {});
    success ? onWin() : onLose();
  }

  loop();
}

function bombDiffuse(onWin, onLose) {
  const code = Array.from({ length: 3 }, () => Math.floor(Math.random() * 9));
  const input = [];
  let index = 0;
  let timer = 8;
  const interval = setInterval(() => {
    timer--;
    if (timer <= 0) finish(false);
  }, 1000);

  document.addEventListener("keydown", handler);
  draw();

  function handler(e) {
    const digit = parseInt(e.key);
    if (isNaN(digit)) return;
    input.push(digit);
    index++;
    draw();
    if (code[index - 1] !== digit) finish(false);
    if (input.length === code.length) finish(true);
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "white";
    ctx.fillText(`💣 Diffuse Code: ${code.join(" ")}`, 150, 150);
    ctx.fillText(`Your Input: ${input.join(" ")}`, 150, 190);
    ctx.fillText(`⏱️ ${timer}s`, 10, 20);
  }

  function finish(success) {
    clearInterval(interval);
    document.removeEventListener("keydown", handler);
    success ? onWin() : onLose();
  }
}

function stopTheCar(onWin, onLose) {
  let car = { x: 100, speed: 2 };
  let stopped = false;
  const stopLine = 500;

  function loop() {
    clearCanvas();
    if (!stopped) car.x += car.speed;

    ctx.fillStyle = "red";
    ctx.fillRect(stopLine, 0, 5, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(car.x, canvas.height / 2 - 10, 40, 20);

    ctx.fillText("Press SPACE to stop!", 200, 30);

    if (car.x + 40 >= stopLine && !stopped) finish(false);
    if (stopped) {
      if (car.x + 40 < stopLine + 5 && car.x + 40 > stopLine - 5) finish(true);
      else finish(false);
    } else {
      requestAnimationFrame(loop);
    }
  }

  function finish(success) {
    document.removeEventListener("keydown", keyHandler);
    success ? onWin() : onLose();
  }

  function keyHandler(e) {
    if (e.code === "Space") {
      stopped = true;
    }
  }

  document.addEventListener("keydown", keyHandler);
  loop();
}

// Clear Canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px monospace";
}

// Scoreboard
function showScoreboard() {
  clearCanvas();
  finalScoreText.innerText = `Your Score: ${score} / ${totalRounds}`;
  saveScore(username, score);
  updateLeaderboard();
  scoreboardDiv.classList.remove("hidden");
}

// Save Score Locally
function saveScore(name, score) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.splice(10);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

// Update Leaderboard UI
function updateLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardList.innerHTML = "";

  leaderboard.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} ${entry.name} – ${entry.score}`;
    if (entry.name === username && entry.score === score) {
      li.style.color = "gold";
    }
    leaderboardList.appendChild(li);
  });
}
