// ficheiro js.txt
let players = JSON.parse(localStorage.getItem('players')) || [];
let currentGame = {
    player1: null,
    player2: null,
    score1: 0,
    score2: 0,
    serving: null,
    serveCount: 0
};

let gameTimer; // Variável para armazenar o intervalo do cronômetro
let gameStartTime; // Variável para armazenar o tempo de início do jogo

function loadPlayers() {
    const select1 = document.getElementById('player1-select');
    const select2 = document.getElementById('player2-select');
    select1.innerHTML = '<option value="">Escolha um jogador</option>';
    select2.innerHTML = '<option value="">Escolha um jogador</option>';
    players.forEach(player => {
        const option = `<option value="${player.name}">${player.name}</option>`;
        select1.innerHTML += option;
        select2.innerHTML += option;
    });
}

function addNewPlayer() {
    const name = prompt("Nome do novo jogador:");

    if (name) {
        const photoInput = document.getElementById('player-photo-input');
        photoInput.style.display = "block";  // Exibe o campo de input de foto

        photoInput.onchange = function () {
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const photo = e.target.result;
                    players.push({ name, photo });
                    localStorage.setItem('players', JSON.stringify(players));
                    loadPlayers();
                    alert("Jogador adicionado com sucesso!");
                    photoInput.value = null; // Limpa o input para permitir adicionar a mesma foto novamente
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                alert("Por favor, selecione uma foto.");
            }
        };
        photoInput.click();  // Abre o seletor de arquivos (câmera ou galeria)
    } else {
        alert("Nome do jogador não pode estar vazio.");
    }
}

function editPlayer() {
    const name = prompt("Nome do jogador que deseja editar:");
    const player = players.find(p => p.name === name);
    if (player) {
        const newName = prompt("Novo nome:", player.name);
        const photoInput = document.getElementById('player-photo-input');
        if (newName) player.name = newName;
        photoInput.style.display = "block";  // Exibe o campo de input de foto
        photoInput.onchange = function () {
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const newPhoto = e.target.result;
                    if (newPhoto) player.photo = newPhoto;
                    localStorage.setItem('players', JSON.stringify(players));
                    loadPlayers();
                    alert("Jogador editado com sucesso!");
                    photoInput.value = null; // Limpa o input
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                alert("Foto do jogador não alterada.");
            }
        };
        photoInput.click();  // Abre o seletor de arquivos
    } else {
        alert("Jogador não encontrado.");
    }
}

function startGame() {
    const player1Name = document.getElementById('player1-select').value;
    const player2Name = document.getElementById('player2-select').value;
    if (player1Name && player2Name && player1Name !== player2Name) {
        currentGame.player1 = players.find(p => p.name === player1Name);
        currentGame.player2 = players.find(p => p.name === player2Name);

        // Carrega as fotos e nomes dos jogadores na tela de escolha do servidor
        document.getElementById('serve-player1-img').src = currentGame.player1.photo;
        document.getElementById('serve-player1-name').textContent = currentGame.player1.name;
        document.getElementById('serve-player2-img').src = currentGame.player2.photo;
        document.getElementById('serve-player2-name').textContent = currentGame.player2.name;

        document.getElementById('player-setup').style.display = 'none';
        document.getElementById('serve-selector').style.display = 'block';
    } else {
        alert("Por favor, escolha dois jogadores diferentes.");
    }
}

function setFirstServer(server) {
    currentGame.serving = server;
    document.getElementById('serve-selector').style.display = 'none';
    document.getElementById('game-interface').style.display = 'block';
    document.getElementById('player1-img').src = currentGame.player1.photo;
    document.getElementById('player1-name').textContent = currentGame.player1.name;
    document.getElementById('player2-img').src = currentGame.player2.photo;
    document.getElementById('player2-name').textContent = currentGame.player2.name;
    updateServeIndicator();
    startTimer(); // Inicia o cronômetro
}

function recordPoint(player) {
    if (player === 'player1') {
        currentGame.score1++;
    } else {
        currentGame.score2++;
    }
    currentGame.serveCount++;
    if (currentGame.serveCount === 2) {
        currentGame.serving = currentGame.serving === 'player1' ? 'player2' : 'player1';
        currentGame.serveCount = 0;
    }
    updateScoreboard();
    updateServeIndicator();
    checkGameEnd();
}

function updateScoreboard() {
    document.getElementById('player1-score').textContent = currentGame.score1;
    document.getElementById('player2-score').textContent = currentGame.score2;
}

function updateServeIndicator() {
    document.getElementById('player1').classList.remove('serving');
    document.getElementById('player2').classList.remove('serving');
    document.getElementById('player1').querySelector('.service-indicator').style.display = 'none';
    document.getElementById('player2').querySelector('.service-indicator').style.display = 'none';

    if (currentGame.serving === 'player1') {
        document.getElementById('player1').classList.add('serving');
        document.getElementById('player1').querySelector('.service-indicator').style.display = 'block';

    } else {
        document.getElementById('player2').classList.add('serving');
        document.getElementById('player2').querySelector('.service-indicator').style.display = 'block';
    }
}

function checkGameEnd() {
    if ((currentGame.score1 >= 11 || currentGame.score2 >= 11) && Math.abs(currentGame.score1 - currentGame.score2) >= 2) {
        endGame();
    }
}

function endGame() {
    const winner = currentGame.score1 > currentGame.score2 ? currentGame.player1.name : currentGame.player2.name;
    alert(`Fim do jogo! Vencedor: ${winner}`);
    saveGameResult();
    document.getElementById('export-csv-button').style.display = 'block'; // Mostra o botão
    stopTimer(); // Para o cronômetro
    resetGame();
}

function saveGameResult() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const elapsedTime = getElapsedTime();
    const duration = `${elapsedTime.minutes}m ${elapsedTime.seconds}s`;
    results.push({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        player1: currentGame.player1.name,
        player2: currentGame.player2.name,
        score1: currentGame.score1,
        score2: currentGame.score2,
        winner: currentGame.score1 > currentGame.score2 ? currentGame.player1.name : currentGame.player2.name,
        duration: duration // Adiciona a duração
    });
    localStorage.setItem('results', JSON.stringify(results));
    // syncToSheets();
}

function resetGame() {
    currentGame = { player1: null, player2: null, score1: 0, score2: 0, serving: null, serveCount: 0 };
    document.getElementById('player-setup').style.display = 'block';
    document.getElementById('game-interface').style.display = 'none';
    document.getElementById('player1-score').textContent = '0'; // Reset da pontuação do Jogador 1
    document.getElementById('player2-score').textContent = '0'; // Reset da pontuação do Jogador 2
    //document.getElementById('export-csv-button').style.display = 'none'; // Esconde o botão de exportar
    loadPlayers();
}

function exportToCSV() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    if (results.length === 0) {
        alert("Nenhum resultado para exportar.");
        return;
    }
    const headers = ["Data", "Hora", "Jogador1", "Jogador2", "PontosJogador1", "PontosJogador2", "Vencedor", "Duração"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
        results.map(r => `${r.date},${r.time},${r.player1},${r.player2},${r.score1},${r.score2},${r.winner},${r.duration}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "resultados_jogos.csv");
    document.body.appendChild(link);
    link.click();
}

function startTimer() {
    gameStartTime = new Date(); // Define o tempo de início
    gameTimer = setInterval(updateTimer, 1000); // Atualiza a cada segundo
}

function updateTimer() {
    const elapsedTime = getElapsedTime();
    document.getElementById('game-duration').textContent = `Duração: ${elapsedTime.minutes}m ${elapsedTime.seconds}s`;
}

function getElapsedTime() {
    const now = new Date();
    const timeDiff = now.getTime() - gameStartTime.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    return { minutes, seconds };
}

function stopTimer() {
    clearInterval(gameTimer); // Para o cronômetro
}

window.onload = loadPlayers;

// const SPREADSHEET_ID = '1YTiywG4XsRNPZgWIFCCjCSSBNhBEq2eR5MJBK2Z_NR0';
// const SHEET_NAME = 'Sheet1';
// const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOx-SXuG_b9g6L-i8-V2xTqRDHx2yHPHKEdiQOK_o5cxR0CjWy-9sJvK_fL-iBvyE0/exec';

// function syncToSheets() {
//     const results = JSON.parse(localStorage.getItem('results')) || [];
//     if (results.length === 0) {
//         alert("Nenhum resultado para sincronizar.");
//         return;
//     }

//     // Prepare data for Google Sheets
//     const data = results.map(r => [
//         r.date,
//         r.time,
//         r.player1,
//         r.player2,
//         r.score1,
//         r.score2,
//         r.winner
//     ]);

//     // Call the Google Apps Script to append data to the sheet
//     googleSheetAppend(data)
//         .then(response => {
//             alert("Resultados sincronizados com Google Sheets!");
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             alert("Erro ao sincronizar com Google Sheets.");
//         });
// }


// function googleSheetAppend(data) {
//     return new Promise((resolve, reject) => {
//         fetch(GOOGLE_SCRIPT_URL, {
//             method: 'POST',
//             mode: 'no-cors',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 spreadsheetId: SPREADSHEET_ID,
//                 sheetName: SHEET_NAME,
//                 data: data
//             })
//         })
//             .then(response => resolve(response))
//             .catch(error => reject(error));
//     });
// }