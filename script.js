const SHEETDB_URL = 'https://sheetdb.io/api/v1/t1ujsr8fqdr88';
let players = [];
let game = {
    type: null,
    players: [],
    scores: [0, 0],
    server: 0,
    servesLeft: 2,
    startTime: null,
    endTime: null
};

// Carregar jogadores do SheetDB
async function loadPlayers() {
    const response = await fetch(`${SHEETDB_URL}/tab/Jogadores`);
    players = await response.json();
}

// Adicionar novo jogador
async function addPlayer() {
    const name = document.getElementById('playerName').value;
    const photo = document.getElementById('playerPhoto').value;
    const newPlayer = {
        nome_Jogador: name,
        url_foto: photo,
        vitorias: 0,
        derrotas: 0,
        desempenho: 0,
        pontos_ganhos: 0,
        pontos_sofridos: 0
    };
    await fetch(`${SHEETDB_URL}/tab/Jogadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer)
    });
    hidePlayerForm();
    loadPlayers();
}

// Iniciar um novo jogo
function startGame(type) {
    game.type = type;
    game.players = [];
    game.scores = type === 'doubles' ? [0, 0] : [0, 0];
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('playerSelection').style.display = 'block';
    loadPlayerOptions();
}

// Carregar opções de jogadores nos selects
function loadPlayerOptions() {
    const selects = [document.getElementById('player1'), document.getElementById('player2')];
    if (game.type === 'doubles') {
        document.getElementById('player3').style.display = 'block';
        document.getElementById('player4').style.display = 'block';
        selects.push(document.getElementById('player3'), document.getElementById('player4'));
    }
    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecione um jogador</option>';
        players.forEach(p => {
            select.innerHTML += `<option value="${p.nome_Jogador}">${p.nome_Jogador}</option>`;
        });
    });
    const firstServer = document.getElementById('firstServer');
    firstServer.innerHTML = '<option value="0">Jogador 1</option><option value="1">Jogador 2</option>';
}

// Iniciar contagem de pontos
function startScoring() {
    game.players = [
        document.getElementById('player1').value,
        document.getElementById('player2').value
    ];
    if (game.type === 'doubles') {
        game.players.push(document.getElementById('player3').value, document.getElementById('player4').value);
    }
    game.server = parseInt(document.getElementById('firstServer').value);
    game.startTime = new Date();
    document.getElementById('playerSelection').style.display = 'none';
    document.getElementById('scoring').style.display = 'block';
    updateScoringUI();
}

// Atualizar interface de pontuação
function updateScoringUI() {
    const p1 = players.find(p => p.nome_Jogador === game.players[0]);
    const p2 = players.find(p => p.nome_Jogador === game.players[1]);
    document.getElementById('p1Photo').src = p1.url_foto;
    document.getElementById('p1Name').textContent = p1.nome_Jogador;
    document.getElementById('p1Score').textContent = game.scores[0];
    document.getElementById('p2Photo').src = p2.url_foto;
    document.getElementById('p2Name').textContent = p2.nome_Jogador;
    document.getElementById('p2Score').textContent = game.scores[1];
    document.getElementById('player1Box').classList.toggle('serving', game.server === 0);
    document.getElementById('player2Box').classList.toggle('serving', game.server === 1);
    document.getElementById('player1Box').onclick = () => addPoint(0);
    document.getElementById('player2Box').onclick = () => addPoint(1);
}

// Adicionar ponto
function addPoint(playerIndex) {
    game.scores[playerIndex]++;
    game.servesLeft--;
    if (game.scores[0] >= 10 && game.scores[1] >= 10) {
        if (game.servesLeft === 0) {
            game.server = 1 - game.server;
            game.servesLeft = 1;
        }
    } else if (game.servesLeft === 0) {
        game.server = 1 - game.server;
        game.servesLeft = 2;
    }
    updateScoringUI();
    checkGameEnd();
}

// Verificar fim do jogo
function checkGameEnd() {
    const [s1, s2] = game.scores;
    if ((s1 >= 11 || s2 >= 11) && Math.abs(s1 - s2) >= 2) {
        game.endTime = new Date();
        saveGame();
    }
}

// Salvar jogo no SheetDB
async function saveGame() {
    const winner = game.scores[0] > game.scores[1] ? game.players[0] : game.players[1];
    const gameData = {
        'Data/Hora Início': game.startTime.toISOString(),
        'Data/Hora Fim': game.endTime.toISOString(),
        Duração: Math.floor((game.endTime - game.startTime) / 1000),
        'Jogador 1': game.players[0],
        'Jogador 2': game.players[1],
        'Pontuação Jogador 1': game.scores[0],
        'Pontuação Jogador 2': game.scores[1],
        Vencedor: winner
    };
    await fetch(`${SHEETDB_URL}/tab/Jogos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
    });
    updatePlayerStats();
    resetGame();
}

// Atualizar estatísticas dos jogadores
async function updatePlayerStats() {
    const winnerIndex = game.scores[0] > game.scores[1] ? 0 : 1;
    const loserIndex = 1 - winnerIndex;
    const winner = players.find(p => p.nome_Jogador === game.players[winnerIndex]);
    const loser = players.find(p => p.nome_Jogador === game.players[loserIndex]);
    
    winner.vitorias++;
    loser.derrotas++;
    winner.pontos_ganhos += game.scores[winnerIndex];
    winner.pontos_sofridos += game.scores[loserIndex];
    loser.pontos_ganhos += game.scores[loserIndex];
    loser.pontos_sofridos += game.scores[winnerIndex];
    
    const winPerf = 75 * (winner.vitorias / (winner.vitorias + winner.derrotas));
    const losePerf = 75 * (loser.vitorias / (loser.vitorias + loser.derrotas));
    const margin = Math.abs(game.scores[0] - game.scores[1]);
    const winBonus = 25 * (margin === 11 ? 1 : margin === 2 ? 0 : (margin - 2) / 9);
    const loseBonus = 25 * (margin === 2 ? 1 : margin === 11 ? 0 : 1 - (margin - 2) / 9);
    
    winner.desempenho = Math.min(100, Math.max(0, winPerf + winBonus));
    loser.desempenho = Math.min(100, Math.max(0, losePerf + loseBonus));
    
    await fetch(`${SHEETDB_URL}/tab/Jogadores`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([winner, loser])
    });
}

// Resetar jogo
function resetGame() {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('startMenu').style.display = 'block';
    game = { type: null, players: [], scores: [0, 0], server: 0, servesLeft: 2, startTime: null, endTime: null };
}

// Mostrar/esconder formulários e listas
function showPlayerForm() { document.getElementById('playerForm').style.display = 'block'; }
function hidePlayerForm() { document.getElementById('playerForm').style.display = 'none'; }
function showPlayers() {
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('playerList').style.display = 'block';
    const tbody = document.querySelector('#playersTable tbody');
    tbody.innerHTML = '';
    players.sort((a, b) => b.desempenho - a.desempenho);
    players.forEach(p => {
        tbody.innerHTML += `<tr><td>${p.nome_Jogador}</td><td>${p.vitorias}</td><td>${p.derrotas}</td><td>${p.desempenho.toFixed(2)}</td></tr>`;
    });
}
function hidePlayerList() {
    document.getElementById('playerList').style.display = 'none';
    document.getElementById('startMenu').style.display = 'block';
}

// Exportar dados (simples exemplo em CSV)
async function exportData() {
    const jogos = await (await fetch(`${SHEETDB_URL}/tab/Jogos`)).json();
    const csv = 'data:text/csv;charset=utf-8,' + [
        Object.keys(jogos[0]).join(','),
        ...jogos.map(row => Object.values(row).join(','))
    ].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'jogos.csv');
    link.click();
}

// Inicializar
loadPlayers();