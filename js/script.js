"use strict";

const GRID_HEIGHT = 20; // グリッドの高さ（行数）
const GRID_WIDTH = 10; // グリッドの幅（列数）
const grid = document.getElementById('grid'); // グリッド要素
const scoreDisplay = document.getElementById('score'); // スコア表示要素
const startBtn = document.getElementById('start-btn'); // スタートボタン
const pauseBtn = document.getElementById('pause-btn'); // 一時停止ボタン

let cells = []; // グリッドのセルを格納する配列
let currentBlockIndex; // 現在のブロックの種類を表すインデックス
let currentBlock = null; // 現在のブロック形状
let currentPosition = 4; // 現在のブロックの位置（左上を基準としたインデックス）
let currentRotation = 0; // 現在のブロックの回転状態
let timerId; // ブロックを定期的に落下させるタイマーID
let score = 0; // ゲームスコア
let isPaused = false; // ゲームが一時停止中かどうか

const tetrominoes = [ // テトロミノの形状を定義
    [   // I型テトロミノ
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, GRID_WIDTH * 3 + 1],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH + 3]
    ],
    [   // O型テトロミノ
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1]
    ],
    [   // T型テトロミノ
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2],
        [0, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2],
        [0, 1, 2, GRID_WIDTH + 1],
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1]
    ]
    // 他のテトロミノを追加可能
];

function createGrid() {
    // グリッドを作成してセルを追加
    for (let i = 0; i < GRID_HEIGHT * GRID_WIDTH; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        grid.appendChild(cell);
        cells.push(cell);
    }
}

function drawBlock() {
    // 現在のブロックをグリッドに描画
    currentBlock.forEach(index => {
        cells[currentPosition + index].classList.add('active');
    });
}

function undrawBlock() {
    // 現在のブロックをグリッドから削除
    currentBlock.forEach(index => {
        cells[currentPosition + index].classList.remove('active');
    });
}

function moveDown() {
    // ブロックを1行下に移動
    if (!isPaused) {
        undrawBlock();
        currentPosition += GRID_WIDTH;
        drawBlock();
        freeze();
    }
}

function dropBlock() {
    // ブロックを一気に落下
    if (!isPaused) {
        while (!currentBlock.some(index => 
            cells[currentPosition + index + GRID_WIDTH]?.classList.contains('taken') || 
            currentPosition + index + GRID_WIDTH >= GRID_WIDTH * GRID_HEIGHT)) {
            undrawBlock();
            currentPosition += GRID_WIDTH;
        }
        drawBlock();
        freeze();
    }
}

function moveLeft() {
    // ブロックを左に移動
    if (!isPaused) {
        undrawBlock();
        const isAtLeftEdge = currentBlock.some(index => (currentPosition + index) % GRID_WIDTH === 0);
        const isBlocked = currentBlock.some(index => 
            cells[currentPosition + index - 1]?.classList.contains('taken')
        );

        if (!isAtLeftEdge && !isBlocked) {
            currentPosition -= 1;
        }

        drawBlock();
    }
}

function moveRight() {
    // ブロックを右に移動
    if (!isPaused) {
        undrawBlock();
        const isAtRightEdge = currentBlock.some(index => (currentPosition + index) % GRID_WIDTH === GRID_WIDTH - 1);
        const isBlocked = currentBlock.some(index => 
            cells[currentPosition + index + 1]?.classList.contains('taken')
        );

        if (!isAtRightEdge && !isBlocked) {
            currentPosition += 1;
        }

        drawBlock();
    }
}

function rotateBlock() {
    // ブロックを90度回転させる関数
    // 一時停止中でなければ実行する
    if (!isPaused) {
        // 現在描画されているブロックを消去
        undrawBlock();

        // 次の回転状態を計算
        // (現在の回転 + 1) を、該当テトロミノの回転配列長で割った余りにすることで循環させる
        const nextRotation = (currentRotation + 1) % tetrominoes[currentBlockIndex].length;

        // 次の回転形状を取得
        const nextBlock = tetrominoes[currentBlockIndex][nextRotation];

        // 回転が可能かどうかを判定
        const isValidRotation = nextBlock.every(index => {
            const newPos = currentPosition + index; // 新しい位置を計算

            // 1. グリッドの範囲内に収まるかチェック
            const isWithinBounds = newPos >= 0 && newPos < GRID_HEIGHT * GRID_WIDTH;

            // 2. 左端や右端を越えないかチェック
            const isNotAtEdge = (newPos % GRID_WIDTH >= 0) && (newPos % GRID_WIDTH < GRID_WIDTH);

            // 3. 他の固定ブロックと衝突しないかチェック
            const isFree = !cells[newPos]?.classList.contains('taken');

           // 4. テトロミノのブロックパターンが壊れないかチェック
            // 左端または右端で回転したときに、グリッド外にはみ出すブロックがないかを確認
            const isPatternIntact = nextBlock.every(nextIndex => {
                const projectedPosition = currentPosition + nextIndex;
                const currentColumn = currentPosition % GRID_WIDTH;
                const projectedColumn = projectedPosition % GRID_WIDTH;
                return Math.abs(currentColumn - projectedColumn) <= 4;
            });

            // 上記すべての条件を満たす場合のみ回転可能
            return isWithinBounds && isNotAtEdge && isFree && isPatternIntact;
        });

        // 回転が可能である場合
        if (isValidRotation) {
            // 現在の回転状態を更新
            currentRotation = nextRotation;

            // 現在のブロック形状を次の形状に更新
            currentBlock = nextBlock;
        }

        // 新しい位置でブロックを描画
        drawBlock();
    }
}

function freeze() {
    // ブロックを固定し、新しいブロックを生成
    if (currentBlock.some(index => 
        cells[currentPosition + index + GRID_WIDTH]?.classList.contains('taken') || 
        currentPosition + index + GRID_WIDTH >= GRID_WIDTH * GRID_HEIGHT)) {
        currentBlock.forEach(index => cells[currentPosition + index].classList.add('taken'));
        clearLines(); // 行を消去
        startNewBlock(); // 新しいブロックを開始
        checkGameOver(); // ゲームオーバー判定
    }
}

function clearLines() {
    // 埋まった行を消去し、上の行を下にシフト
    for (let row = 0; row < GRID_HEIGHT; row++) {
        const startIdx = row * GRID_WIDTH;
        const rowCells = cells.slice(startIdx, startIdx + GRID_WIDTH);

        if (rowCells.every(cell => cell.classList.contains('taken'))) {
            // score += 100; // スコアを更新
            // scoreDisplay.textContent = score;
            updateScore(100);

            rowCells.forEach(cell => cell.classList.add('highlight'));
            setTimeout(() => {
                // 対象行のセルをリセット
                rowCells.forEach(cell => cell.classList.remove('taken', 'active', 'highlight'));

                // 上の行を下にシフト
                for (let i = startIdx - 1; i >= 0; i--) {
                    const aboveCell = cells[i];
                    const belowCell = cells[i + GRID_WIDTH];

                    // `taken` クラスが付いているセルのみシフトする
                    if (aboveCell.classList.contains('taken')) {
                        belowCell.className = aboveCell.className; // 下のセルにコピー
                        aboveCell.className = 'cell'; // 元のセルをリセット
                    }
                }
            }, 500);
        }
    }
}

function adjustSpeed() {
    clearInterval(timerId);
    const speed = Math.max(200, 1000 - score / 2); // スコアが上がると速くなる
    timerId = setInterval(moveDown, speed);
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
    adjustSpeed();
}

function startNewBlock() {
    // ランダムに新しいブロックを生成
    const random = Math.floor(Math.random() * tetrominoes.length);
    currentBlockIndex = random;
    currentRotation = 0;
    currentBlock = tetrominoes[random][currentRotation];
    currentPosition = 4;
    drawBlock();
}

function checkGameOver() {
    // ゲームオーバー判定
    if (currentBlock.some(index => cells[currentPosition + index].classList.contains('taken'))) {
        gameOver();
    }
}

function gameOver() {
    // 既存の "Game Over!" メッセージをチェック
    let gameOverMessage = document.querySelector('.game-over');

    // メッセージが存在しない場合のみ作成
    if (!gameOverMessage) {
        gameOverMessage = document.createElement('div');
        gameOverMessage.className = 'game-over';
        gameOverMessage.textContent = 'Game Over!';
        document.body.appendChild(gameOverMessage);
    }

    // ゲームを停止
    clearInterval(timerId);
    saveHighScore();
    displayHighScore();
}

function saveHighScore() {
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
        localStorage.setItem('highScore', score);
        alert('New High Score!');
    }
}

function displayHighScore() {
    const highScoreDisplay = document.getElementById('high-score');
    highScoreDisplay.textContent = `${localStorage.getItem('highScore') || 0}`;
}

document.addEventListener('keydown', event => {
    // キーボード入力に応じた操作
    if (event.key === 'ArrowLeft') moveLeft();
    else if (event.key === 'ArrowRight') moveRight();
    else if (event.key === 'ArrowDown') dropBlock();
    else if (event.key === 'ArrowUp') rotateBlock();
});

pauseBtn.addEventListener('click', () => {
    // ゲームの一時停止と再開
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

    // "Game Over!" のメッセージを削除
    const gameOverMessage = document.querySelector('.game-over');
    if (gameOverMessage) {
        gameOverMessage.remove();
    }

    // 一時停止になっている場合はそれをクリア
    if (isPaused) {
        pauseBtn.textContent = 'Pause';
        isPaused = false;
        timerId = setInterval(moveDown, 1000);
    }

     // グリッド上の全てのセルをリセット
     cells.forEach(cell => {
        cell.classList.remove('active', 'taken', 'highlight');
    });

    // スコアをリセット
    score = 0;
    scoreDisplay.textContent = score;

    
    
    // ゲーム開始
    clearInterval(timerId);
    timerId = setInterval(moveDown, 1000);
    startNewBlock();
}

startBtn.addEventListener('click', startGame); // スタートボタンのクリックイベント
createGrid(); // グリッドを生成
displayHighScore(); // ハイスコア表示