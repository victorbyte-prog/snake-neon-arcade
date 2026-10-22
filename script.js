const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const overlay = document.getElementById("overlay");
const diffButtons = document.querySelectorAll(".diff-btn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = Number(localStorage.getItem("snakeArcadeHighScore")) || 0;
let running = false;
let paused = false;
let gameTimer = null;
let currentDifficulty = "easy";

const difficulties = {
  easy: { interval: 150, label: "Fácil" },
  normal: { interval: 110, label: "Médio" },
  hard: { interval: 80, label: "Difícil" }
};

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
}

function playTone(frequency, duration, volume = 0.04, type = "sine") {
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.value = volume;
  gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime + duration, 0.03);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function updateHighScore() {
  highScoreEl.textContent = highScore;
  localStorage.setItem("snakeArcadeHighScore", String(highScore));
}

function randomFoodPosition() {
  let valid = false;

  while (!valid) {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };

    valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

function setDifficulty(level) {
  currentDifficulty = level;
  diffButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.difficulty === level);
  });

  if (running && !paused) {
    clearInterval(gameTimer);
    gameTimer = setInterval(loopGame, difficulties[level].interval);
  }
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = "0";
  randomFoodPosition();
  draw();
}

function startGame() {
  initAudio();

  if (!running) {
    running = true;
    paused = false;
    overlay.classList.add("hidden");
    clearInterval(gameTimer);
    gameTimer = setInterval(loopGame, difficulties[currentDifficulty].interval);
  } else if (paused) {
    paused = false;
    overlay.classList.add("hidden");
    clearInterval(gameTimer);
    gameTimer = setInterval(loopGame, difficulties[currentDifficulty].interval);
  }

  pauseBtn.textContent = "Pausar";
}

function pauseGame() {
  if (!running) return;

  if (paused) {
    paused = false;
    overlay.classList.add("hidden");
    clearInterval(gameTimer);
    gameTimer = setInterval(loopGame, difficulties[currentDifficulty].interval);
    pauseBtn.textContent = "Pausar";
  } else {
    paused = true;
    overlay.classList.remove("hidden");
    clearInterval(gameTimer);
    pauseBtn.textContent = "Continuar";
  }
}

function endGame() {
  clearInterval(gameTimer);
  running = false;
  paused = false;

  if (score > highScore) {
    highScore = score;
    updateHighScore();
  }

  playTone(120, 0.18, 0.06, "sawtooth");
  setTimeout(() => playTone(80, 0.22, 0.06, "square"), 120);

  alert("Game Over! Pontuação: " + score);
  resetGame();
  overlay.classList.remove("hidden");
  pauseBtn.textContent = "Pausar";
  startBtn.textContent = "Iniciar";
}

function loopGame() {
  if (!running || paused) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall =
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount;

  const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = String(score);

    if (score > highScore) {
      highScore = score;
      updateHighScore();
    }

    playTone(680, 0.08, 0.05, "square");

    const level = Math.min(1 + Math.floor(score / 4), 6);
    const speed = Math.max(55, difficulties[currentDifficulty].interval - (level * 10));
    clearInterval(gameTimer);
    gameTimer = setInterval(loopGame, speed);

    randomFoodPosition();
  } else {
    snake.pop();
  }

  draw();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 30,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  gradient.addColorStop(0, "rgba(15, 118, 110, 0.12)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }
}

function drawFood() {
  ctx.fillStyle = "#f43f5e";
  ctx.shadowColor = "rgba(244, 63, 94, 0.9)";
  ctx.shadowBlur = 16;
  ctx.fillRect(food.x * gridSize + 5, food.y * gridSize + 5, gridSize - 10, gridSize - 10);
  ctx.shadowBlur = 0;
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * gridSize + 1;
    const y = segment.y * gridSize + 1;

    ctx.fillStyle = index === 0 ? "#4ade80" : "#22c55e";
    ctx.shadowColor = index === 0 ? "rgba(74, 222, 128, 0.9)" : "rgba(34, 197, 94, 0.7)";
    ctx.shadowBlur = 12;
    ctx.fillRect(x, y, gridSize - 2, gridSize - 2);

    if (index === 0) {
      ctx.fillStyle = "#dcfce7";
      ctx.fillRect(x + 5, y + 5, 4, 4);
      ctx.fillRect(x + gridSize - 10, y + 5, 4, 4);
    }
  });

  ctx.shadowBlur = 0;
}

function draw() {
  drawGrid();
  drawFood();
  drawSnake();
}

function handleDirectionRequest(next) {
  const isOpposite = next.x === -direction.x && next.y === -direction.y;
  if (!isOpposite) {
    nextDirection = next;
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 }
  };

  if (map[key]) {
    handleDirectionRequest(map[key]);
  }
});

startBtn.addEventListener("click", () => {
  startGame();
  resetGame();
  startGame();
});

pauseBtn.addEventListener("click", () => {
  pauseGame();
});

document.querySelectorAll("[data-dir]").forEach(button => {
  button.addEventListener("click", () => {
    const dir = button.getAttribute("data-dir");
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    if (map[dir]) {
      handleDirectionRequest(map[dir]);
    }
  });
});

diffButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setDifficulty(btn.dataset.difficulty);
  });
});

highScoreEl.textContent = String(highScore);
resetGame();
draw();
overlay.classList.remove("hidden");
