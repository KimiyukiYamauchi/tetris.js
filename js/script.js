"use strict";

const GRID_HEIGHT = 20;
const GRID_WIDTH = 10;
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');

let cells = [];
let currentBlockIndex;
let currentBlock = null;
let currentPosition = 4;
let currentRotation = 0;
let timerId;
let score = 0;
let isPaused = false; // ゲームが一時停止中かどうか

const tetrominoes = [
    [   // I
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, GRID_WIDTH * 3 + 1],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH + 3]
    ],
    [   // O
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1]
    ],
    [   // T
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2],
        [0, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2],
        [0, 1, 2, GRID_WIDTH + 1],
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1],
    ]
    // Add other tetromino shapes
];

function createGrid() {
    for (let i = 0; i < GRID_HEIGHT * GRID_WIDTH; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        grid.appendChild(cell);
        cells.push(cell);
    }
}

function drawBlock() {
    currentBlock.forEach(index => {
        cells[currentPosition + index].classList.add('active');
    });
}

function undrawBlock() {
    currentBlock.forEach(index => {
        cells[currentPosition + index].classList.remove('active');
    });
}

function moveDown() {
    if (!isPaused) {
        undrawBlock();
        currentPosition += GRID_WIDTH;
        drawBlock();
        freeze();
    }
}

function dropBlock() {
    if (!isPaused) {
        while (!currentBlock.some(index => cells[currentPosition + index + GRID_WIDTH]?.classList.contains('taken') || currentPosition + index + GRID_WIDTH >= GRID_WIDTH * GRID_HEIGHT)) {
            undrawBlock();
            currentPosition += GRID_WIDTH;
        }
        drawBlock();
        freeze();
    }
}

function moveLeft() {
  if (!isPaused) {
    undrawBlock();
    const isAtLeftEdge = currentBlock.some(index => (currentPosition + index) % GRID_WIDTH === 0);
    if (!isAtLeftEdge) currentPosition -= 1;
    drawBlock();
  }
}

function moveRight() {
  if (!isPaused) {
    undrawBlock();
    const isAtRightEdge = currentBlock.some(index => (currentPosition + index) % GRID_WIDTH === GRID_WIDTH - 1);
    if (!isAtRightEdge) currentPosition += 1;
    drawBlock();
  }
}

function rotateBlock() {
    if (!isPaused) {
        undrawBlock();
        const nextRotation = (currentRotation + 1) % tetrominoes[currentBlockIndex].length;
        const nextBlock = tetrominoes[currentBlockIndex][nextRotation];

        const isValidRotation = nextBlock.every(index => {
            const newPos = currentPosition + index;
            const isWithinBounds = newPos >= 0 && newPos < GRID_HEIGHT * GRID_WIDTH;
            const isNotAtEdge = (newPos % GRID_WIDTH >= 0) && (newPos % GRID_WIDTH < GRID_WIDTH);
            const isFree = !cells[newPos]?.classList.contains('taken');
            return isWithinBounds && isNotAtEdge && isFree;
        });

        if (isValidRotation) {
            currentRotation = nextRotation;
            currentBlock = nextBlock;
        }
        drawBlock();
    }
}


function freeze() {
    if (currentBlock.some(index => cells[currentPosition + index + GRID_WIDTH]?.classList.contains('taken') ||
        currentPosition + index + GRID_WIDTH >= GRID_WIDTH * GRID_HEIGHT)) {
        // 現在のブロックを固定
        currentBlock.forEach(index => cells[currentPosition + index].classList.add('taken'));
        clearLines();       // 行の消去を確認して処理
        startNewBlock();    // 新しいブロックを開始
        checkGameOver();    // ゲームオーバー判定
    }
}

function clearLines() {
    for (let row = 0; row < GRID_HEIGHT; row++) {
        const startIdx = row * GRID_WIDTH;
        const rowCells = cells.slice(startIdx, startIdx + GRID_WIDTH);

        // その行がすべて埋まっている場合
        if (rowCells.every(cell => cell.classList.contains('taken'))) {
            // スコアを加算
            score += 100;
            scoreDisplay.textContent = score;

            // ハイライトを追加
            rowCells.forEach(cell => cell.classList.add('highlight'));

            setTimeout(() => {
                // ハイライトを削除して行を消去
                rowCells.forEach(cell => {
                    cell.classList.remove('taken', 'active', 'highlight');
                });

                // 上のブロックを1行分下にシフト
                for (let i = startIdx - 1; i >= 0; i--) {
                    const aboveCell = cells[i];
                    const belowCell = cells[i + GRID_WIDTH];

                    belowCell.className = aboveCell.className;
                    aboveCell.className = 'cell';
                }
            }, 1000); // 1秒後に消去
        }
    }
}

function startNewBlock() {
    const random = Math.floor(Math.random() * tetrominoes.length);
    currentBlockIndex = random; // 選択されたインデックスを設定
    currentRotation = 0;        // 回転姿勢の初期化
    currentBlock = tetrominoes[random][currentRotation];
    currentPosition = 4;
    drawBlock();
}

function checkGameOver() {
    // 新しいブロックの初期位置にすでに固定ブロックがある場合
    if (currentBlock.some(index => cells[currentPosition + index].classList.contains('taken'))) {
        alert("Game Over!");
        clearInterval(timerId); // ゲームを停止
    }
}


function addScore() {
    for (let i = 0; i < GRID_HEIGHT; i++) {
        const row = Array.from({ length: GRID_WIDTH }, (_, j) => i * GRID_WIDTH + j);
        if (row.every(index => cells[index].classList.contains('taken'))) {
            score += 100;
            scoreDisplay.textContent = score;
            row.forEach(index => {
                cells[index].classList.remove('taken', 'active');
            });
            const removed = cells.splice(i * GRID_WIDTH, GRID_WIDTH);
            removed.forEach(cell => grid.appendChild(cell));
        }
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') moveLeft();
    else if (event.key === 'ArrowRight') moveRight();
    else if (event.key === 'ArrowDown') dropBlock();
    else if (event.key === 'ArrowUp') rotateBlock();
});

pauseBtn.addEventListener('click', () => {
    if (isPaused) {
        pauseBtn.textContent = 'Pause';
        isPaused = false;
        timerId = setInterval(moveDown, 1000);
    } else {
        pauseBtn.textContent = 'Resume';
        isPaused = true;
        clearInterval(timerId);
    }
});

function startGame() {
    clearInterval(timerId);
    timerId = setInterval(moveDown, 1000);
    startNewBlock();
}

startBtn.addEventListener('click', startGame);

createGrid();
