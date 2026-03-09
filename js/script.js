const canvas = document.getElementById('volleyCourt');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// --- Couleurs et Config ---
const COLORS = {
    court: '#f6b93b',
    line: '#ffffff',
    net: '#2d3436',
    s: '#e67e22',   // Orange: Passeur
    oh: '#0984e3',  // Bleu: OH
    mb: '#6c5ce7',  // Violet: MB
    opp: '#d63031', // Rouge: Pointu
    l: '#00b894'    // Vert: Libero
};

// --- Coordonnées de Base (Postes standard 1-6) ---
const POS = {
    P1: { x: 330, y: 380 },
    P2: { x: 330, y: 150 },
    P3: { x: 200, y: 150 },
    P4: { x: 70, y: 150 },
    P5: { x: 70, y: 380 },
    P6: { x: 200, y: 380 }
};

// --- Cibles de Transition ---
const TARGETS = {
    ATTAQUE: {
        S: { x: 280, y: 60 },     // Zone de passe
        LEFT: { x: 70, y: 100 },   // Attaque Aile Gauche
        CENTER: { x: 200, y: 100 }, // Attaque Centre
        RIGHT: { x: 330, y: 100 }  // Attaque Aile Droite
    },
    DEFENSE: {
        S_OPP: { x: 340, y: 350 }, // Défense Poste 1
        MB: { x: 200, y: 380 },    // Défense Poste 6
        OH: { x: 60, y: 350 },     // Défense Poste 5
        BLOCK_L: { x: 70, y: 60 },
        BLOCK_C: { x: 200, y: 60 },
        BLOCK_R: { x: 330, y: 60 }
    }
};

// --- Joueurs (Composition type 5-1) ---
// S: Passeur, OH1: Attaquant 1, MB1: Central 1, OPP: Pointu, OH2: Attaquant 2, L: Libero
const PLAYERS = [
    { id: 0, role: 's', label: 'S' },
    { id: 1, role: 'oh', label: 'OH1' },
    { id: 2, role: 'mb', label: 'MB1' },
    { id: 3, role: 'opp', label: 'OPP' },
    { id: 4, role: 'oh', label: 'OH2' },
    { id: 5, role: 'mb', label: 'MB2' }
];

// --- Positions Spécifiques (Réception pour éviter les chevauchements) ---
// Chaque rotation a un placement de départ optimisé pour la réception
const RECEPTION_START = {
    1: { // S en P1 - Légal (S=1, OH1=2, MB1=3, OPP=4, OH2=5, MB2=6)
        0: { x: 330, y: 140 }, // S (P1) derrière OH1
        1: { x: 330, y: 110 }, // OH1 (P2) au filet
        2: { x: 200, y: 100 }, // MB1 (P3) au filet
        3: { x: 60, y: 100 },  // OPP (P4) au filet
        4: { x: 80, y: 380 },  // OH2 (P5) reçoit
        5: { x: 210, y: 380 }  // MB2 (P6) reçoit
    },
    2: { // S en P6 - Légal (S=6, OH1=1, MB1=2, OPP=3, OH2=4, MB2=5)
        0: { x: 200, y: 140 }, // S (P6) derrière OPP
        1: { x: 330, y: 380 }, // OH1 (P1) reçoit
        2: { x: 330, y: 100 }, // MB1 (P2) au filet
        3: { x: 200, y: 110 }, // OPP (P3) au filet
        4: { x: 70, y: 380 },  // OH2 (P4->P5) reçoit
        5: { x: 200, y: 380 }  // MB2 (P5->P6) reçoit
    },
    3: { // S en P5 - Légal (S=5, OH1=6, MB1=1, OPP=2, OH2=3, MB2=4)
        0: { x: 70, y: 140 },  // S (P5) derrière MB2
        1: { x: 200, y: 380 }, // OH1 (P6) reçoit
        2: { x: 330, y: 380 }, // MB1 (P1) reçoit
        3: { x: 330, y: 100 }, // OPP (P2) au filet
        4: { x: 200, y: 100 }, // OH2 (P3) au filet
        5: { x: 70, y: 110 }   // MB2 (P4) au filet
    },
    4: { // S en P4 - Légal (S=4, OH1=5, MB1=6, OPP=1, OH2=2, MB2=3)
        0: { x: 60, y: 110 },   // S (P4) au filet
        1: { x: 80, y: 380 },   // OH1 (P5) reçoit
        2: { x: 210, y: 380 },  // MB1 (P6) reçoit
        3: { x: 330, y: 380 },  // OPP (P1) reçoit
        4: { x: 330, y: 110 },  // OH2 (P2) au filet
        5: { x: 200, y: 100 }   // MB2 (P3) au filet
    },
    5: { // S en P3 - Légal (S=3, OH1=4, MB1=5, OPP=6, OH2=1, MB2=2)
        0: { x: 200, y: 110 }, // S (P3) au filet
        1: { x: 70, y: 380 },  // OH1 (P4->P5) reçoit (doit rester à gauche de S)
        2: { x: 50, y: 450 },  // MB1 (P5) cachée fond gauche
        3: { x: 200, y: 380 }, // OPP (P6) reçoit
        4: { x: 330, y: 380 }, // OH2 (P1) reçoit (doit rester à droite de OPP)
        5: { x: 330, y: 100 }  // MB2 (P2) au filet
    },
    6: { // S en P2 - Légal (S=2, OH1=3, MB1=4, OPP=5, OH2=6, MB2=1)
        0: { x: 330, y: 110 }, // S (P2) au filet
        1: { x: 200, y: 100 }, // OH1 (P3) au filet
        2: { x: 70, y: 100 },  // MB1 (P4) au filet
        3: { x: 70, y: 380 },  // OPP (P5) reçoit
        4: { x: 210, y: 380 }, // OH2 (P6) reçoit
        5: { x: 330, y: 380 }  // MB2 (P1) reçoit
    }
};

// --- État de l'Application ---
let allPlayerSets = {};
let currentSet = 'set1';
let currentRotation = 1;
let currentPhase = 'reception'; // 'reception' ou 'service'
let isSwitched = false;
let progress = 0;
let animationId = null;

// Charger les noms des joueuses
async function loadPlayerNames() {
    try {
        const response = await fetch('players.json');
        allPlayerSets = await response.json();
    } catch (e) {
        console.error("Erreur chargement noms:", e);
        // Noms par défaut si le fichier manque
        allPlayerSets = { 
            "set1": { "0":"S", "1":"OH1", "2":"MB1", "3":"OPP", "4":"OH2", "5":"MB2" },
            "set2": { "0":"S2", "1":"OH1-2", "2":"MB1-2", "3":"OPP2", "4":"OH2-2", "5":"MB2-2" }
        };
    }
    updateUI();
}

// --- Logique de Calcul des Coordonnées ---

function getPlayerPosition(playerIndex, rotation, phase, switchedProgress) {
    const isSwitched = switchedProgress > 0.5;
    
    if (phase === 'reception') {
        const start = RECEPTION_START[rotation][playerIndex];
        const end = getAttackTarget(playerIndex, rotation);
        return interpolate(start, end, switchedProgress);
    } else {
        // Mode Service: Départ postes standard -> Cibles Défense
        const start = POS[getStandardPosCode(rotation, playerIndex)];
        const end = getDefenseTarget(playerIndex, rotation);
        return interpolate(start, end, switchedProgress);
    }
}

function getStandardPosCode(rotation, playerIndex) {
    const map = {
        1: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        2: ['P6', 'P1', 'P2', 'P3', 'P4', 'P5'],
        3: ['P5', 'P6', 'P1', 'P2', 'P3', 'P4'],
        4: ['P4', 'P5', 'P6', 'P1', 'P2', 'P3'],
        5: ['P3', 'P4', 'P5', 'P6', 'P1', 'P2'],
        6: ['P2', 'P3', 'P4', 'P5', 'P6', 'P1']
    };
    return map[rotation][playerIndex];
}

function getAttackTarget(playerIndex, rotation) {
    const player = PLAYERS[playerIndex];
    const posCode = getStandardPosCode(rotation, playerIndex);
    const isFront = ['P2', 'P3', 'P4'].includes(posCode);

    if (player.role === 's') return TARGETS.ATTAQUE.S;
    
    if (isFront) {
        if (player.role === 'oh') return TARGETS.ATTAQUE.LEFT;
        if (player.role === 'mb') return TARGETS.ATTAQUE.CENTER;
        if (player.role === 'opp') return TARGETS.ATTAQUE.RIGHT;
    }
    
    // Joueurs arrières restent en soutien ou défense
    return RECEPTION_START[rotation][playerIndex];
}

function getDefenseTarget(playerIndex, rotation) {
    const player = PLAYERS[playerIndex];
    const posCode = getStandardPosCode(rotation, playerIndex);
    const isFront = ['P2', 'P3', 'P4'].includes(posCode);

    if (isFront) {
        if (player.role === 'oh') return TARGETS.DEFENSE.BLOCK_L;
        if (player.role === 'mb') return TARGETS.DEFENSE.BLOCK_C;
        if (player.role === 's' || player.role === 'opp') return TARGETS.DEFENSE.BLOCK_R;
    } else {
        if (player.role === 's' || player.role === 'opp') return TARGETS.DEFENSE.S_OPP;
        if (player.role === 'mb' || player.role === 'l') return TARGETS.DEFENSE.MB;
        if (player.role === 'oh') return TARGETS.DEFENSE.OH;
    }
    return POS[posCode];
}

function interpolate(start, end, t) {
    return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
    };
}

// --- Dessin ---

function drawCourt() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLORS.court;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    
    // Filet
    ctx.fillStyle = COLORS.net;
    ctx.fillRect(10, 10, width - 20, 8);
    
    // Ligne des 3m
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(20, 170);
    ctx.lineTo(width - 20, 170);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPlayer(x, y, player, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[player.role];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.label, x, y);

    // Afficher le nom de la joueuse en dessous
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    const names = allPlayerSets[currentSet] || {};
    ctx.fillText(names[player.id] || "", x, y + 25);
    
    ctx.globalAlpha = 1;
}

function render() {
    drawCourt();
    PLAYERS.forEach((player, index) => {
        const p = getPlayerPosition(index, currentRotation, currentPhase, progress);
        
        // Dessin du chemin
        if (progress > 0 && progress < 1) {
            const start = (currentPhase === 'reception') ? RECEPTION_START[currentRotation][index] : POS[getStandardPosCode(currentRotation, index)];
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            const end = (currentPhase === 'reception') ? getAttackTarget(index, currentRotation) : getDefenseTarget(index, currentRotation);
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        drawPlayer(p.x, p.y, player);
    });
}

function animateLoop() {
    let speed = 0.02; // Plus lent (anciennement 0.04)
    if (isSwitched && progress < 1) {
        progress += speed;
        if (progress > 1) progress = 1;
        render();
        animationId = requestAnimationFrame(animateLoop);
    } else if (!isSwitched && progress > 0) {
        progress -= speed;
        if (progress < 0) progress = 0;
        render();
        animationId = requestAnimationFrame(animateLoop);
    }
}

// --- Interactions UI ---

function updateUI() {
    const title = document.getElementById('rotation-title');
    const desc = document.getElementById('rotation-description');
    const btnSwitch = document.getElementById('toggle-switch');
    
    const posName = ['P1', 'P6', 'P5', 'P4', 'P3', 'P2'][currentRotation-1];
    title.textContent = `Rotation : S en ${posName}`;
    
    if (currentPhase === 'reception') {
        desc.textContent = "Phase RÉCEPTION : Placement pour éviter les fautes de position. Cliquez pour voir la transition vers l'ATTAQUE.";
        btnSwitch.textContent = isSwitched ? "Retour Placement Réception" : "Transition vers ATTAQUE";
    } else {
        desc.textContent = "Phase SERVICE : On est au service (en haut). Cliquez pour voir le SWITCH vers les postes de DÉFENSE.";
        btnSwitch.textContent = isSwitched ? "Retour Positions Service" : "Switch vers DÉFENSE";
    }
    
    render();
}

document.querySelectorAll('.rotation-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.rotation-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentRotation = parseInt(e.target.dataset.rotation);
        isSwitched = false;
        progress = 0;
        updateUI();
    });
});

document.querySelectorAll('.set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.set-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentSet = e.target.dataset.set;
        render();
    });
});

document.querySelectorAll('.phase-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentPhase = e.target.dataset.phase;
        isSwitched = false;
        progress = 0;
        updateUI();
    });
});

document.getElementById('toggle-switch').addEventListener('click', () => {
    isSwitched = !isSwitched;
    if (animationId) cancelAnimationFrame(animationId);
    animateLoop();
    updateUI();
});

// Initialisation
loadPlayerNames();
