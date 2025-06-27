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
