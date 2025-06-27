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
function snakeGame(win, lose) {
  ctx.fillStyle = "lime";
  ctx.fillText("🐍 Snake! Collect 3 apples", 100, 240);
  setTimeout(win, 2000); // Fake win
}

function asteroidGame(win, lose) {
  ctx.fillStyle = "white";
  ctx.fillText("🪐 Shoot 5 asteroids", 100, 240);
  setTimeout(win, 2000);
}

function spinDodgeGame(win, lose) {
  ctx.fillStyle = "red";
  ctx.fillText("🌀 Dodge the spinning blades!", 100, 240);
  setTimeout(lose, 2000);
}

function slalomGame(win, lose) {
  ctx.fillStyle = "cyan";
  ctx.fillText("⛷️ Navigate flags!", 100, 240);
  setTimeout(win, 2000);
}

function brickBreaker(win, lose) {
  ctx.fillStyle = "orange";
  ctx.fillText("🧱 Break 7 bricks!", 100, 240);
  setTimeout(win, 2000);
}

function lightThePath(win, lose) {
  ctx.fillStyle = "yellow";
  ctx.fillText("💡 Click the tiles in order!", 100, 240);
  setTimeout(win, 2000);
}

function magneticMaze(win, lose) {
  ctx.fillStyle = "magenta";
  ctx.fillText("🧲 Avoid magnets!", 100, 240);
  setTimeout(win, 2000);
}

function ladderClimb(win, lose) {
  ctx.fillStyle = "green";
  ctx.fillText("🪜 Climb to the top!", 100, 240);
  setTimeout(win, 2000);
}

function bombDiffuse(win, lose) {
  ctx.fillStyle = "white";
  ctx.fillText("💣 Solve the 3-symbol puzzle!", 100, 240);
  setTimeout(lose, 2000);
}

function stopTheCar(win, lose) {
  ctx.fillStyle = "red";
  ctx.fillText("🛑 Stop before the line!", 100, 240);
  setTimeout(win, 2000);
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
