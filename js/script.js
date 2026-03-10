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
    opp: '#d63031', // Rouge: Technique
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

// --- État de l'Application ---
let allPlayerSets = {};
let currentSet = 'set1';
let currentSystem = '5-1';
let currentRotation = 1;
let currentPhase = 'reception'; 
let isSwitched = false;
let progress = 0;
let animationId = null;

// --- CONFIGURATIONS DES SYSTÈMES ---

const SYSTEMS = {
    '5-1': {
        players: [
            { id: 0, role: 's', label: 'S' },
            { id: 1, role: 'oh', label: 'OH1' },
            { id: 2, role: 'mb', label: 'MB1' },
            { id: 3, role: 'opp', label: 'OPP' },
            { id: 4, role: 'oh', label: 'OH2' },
            { id: 5, role: 'mb', label: 'MB2' }
        ],
        reception: {
            1: { 0: { x: 330, y: 140 }, 1: { x: 330, y: 110 }, 2: { x: 200, y: 100 }, 3: { x: 60, y: 100 }, 4: { x: 80, y: 380 }, 5: { x: 210, y: 380 } },
            2: { 0: { x: 200, y: 140 }, 1: { x: 330, y: 380 }, 2: { x: 330, y: 100 }, 3: { x: 200, y: 110 }, 4: { x: 70, y: 380 }, 5: { x: 200, y: 380 } },
            3: { 0: { x: 70, y: 140 }, 1: { x: 200, y: 380 }, 2: { x: 330, y: 380 }, 3: { x: 330, y: 100 }, 4: { x: 200, y: 100 }, 5: { x: 70, y: 110 } },
            4: { 0: { x: 60, y: 110 }, 1: { x: 80, y: 380 }, 2: { x: 210, y: 380 }, 3: { x: 330, y: 380 }, 4: { x: 330, y: 110 }, 5: { x: 200, y: 100 } },
            5: { 0: { x: 200, y: 110 }, 1: { x: 130, y: 250 }, 2: { x: 70, y: 380 }, 3: { x: 200, y: 380 }, 4: { x: 330, y: 380 }, 5: { x: 330, y: 100 } },
            6: { 0: { x: 330, y: 110 }, 1: { x: 200, y: 100 }, 2: { x: 70, y: 100 }, 3: { x: 70, y: 380 }, 4: { x: 210, y: 380 }, 5: { x: 330, y: 380 } }
        }
    },
    '4-2': {
        players: [
            { id: 0, role: 's', label: 'S1' },
            { id: 1, role: 'oh', label: 'OH1' },
            { id: 2, role: 'mb', label: 'MB1' },
            { id: 3, role: 's', label: 'S2' },
            { id: 4, role: 'oh', label: 'OH2' },
            { id: 5, role: 'mb', label: 'MB2' }
        ],
        reception: {
            // S1 et S2 sont opposées. La passeuse devant distribue.
            1: { // S1 en P1, S2 en P4 (S2 distribue)
                0: { x: 330, y: 380 }, // S1 (P1) reçoit arrière-droite
                1: { x: 330, y: 110 }, // OH1 (P2) au filet
                2: { x: 200, y: 110 }, // MB1 (P3) au filet
                3: { x: 70, y: 110 },  // S2 (P4) au filet (PASSEUSE)
                4: { x: 70, y: 380 },  // OH2 (P5) reçoit arrière-gauche
                5: { x: 200, y: 380 }  // MB2 (P6) reçoit centre
            },
            2: { // S1 en P6, S2 en P3 (S2 distribue)
                0: { x: 200, y: 380 }, // S1 (P6) reçoit centre
                1: { x: 330, y: 380 }, // OH1 (P1) reçoit arrière-droite
                2: { x: 330, y: 110 }, // MB1 (P2) au filet
                3: { x: 200, y: 110 }, // S2 (P3) au filet (PASSEUSE)
                4: { x: 70, y: 110 },  // OH2 (P4) au filet
                5: { x: 70, y: 380 }   // MB2 (P5) reçoit arrière-gauche
            },
            3: { // S1 en P5, S2 en P2 (S2 distribue)
                0: { x: 70, y: 380 },  // S1 (P5) reçoit arrière-gauche
                1: { x: 200, y: 380 }, // OH1 (P6) reçoit centre
                2: { x: 330, y: 380 }, // MB1 (P1) reçoit arrière-droite
                3: { x: 330, y: 110 }, // S2 (P2) au filet (PASSEUSE)
                4: { x: 200, y: 110 }, // OH2 (P3) au filet
                5: { x: 70, y: 110 }   // MB2 (P4) au filet
            },
            4: { // S1 en P4, S2 en P1 (S1 distribue)
                0: { x: 70, y: 110 },  // S1 (P4) au filet (PASSEUSE)
                1: { x: 70, y: 380 },  // OH1 (P5) reçoit arrière-gauche
                2: { x: 200, y: 380 }, // MB1 (P6) reçoit centre
                3: { x: 330, y: 380 }, // S2 (P1) reçoit arrière-droite
                4: { x: 330, y: 110 }, // OH2 (P2) au filet
                5: { x: 200, y: 110 }  // MB2 (P3) au filet
            },
            5: { // S1 en P3, S2 en P6 (S1 distribue)
                0: { x: 200, y: 110 }, // S1 (P3) au filet (PASSEUSE)
                1: { x: 70, y: 110 },  // OH1 (P4) au filet
                2: { x: 70, y: 380 },  // MB1 (P5) reçoit arrière-gauche
                3: { x: 200, y: 380 }, // S2 (P6) reçoit centre
                4: { x: 330, y: 380 }, // OH2 (P1) reçoit arrière-droite
                5: { x: 330, y: 110 }  // MB2 (P2) au filet
            },
            6: { // S1 en P2, S2 en P5 (S1 distribue)
                0: { x: 330, y: 110 }, // S1 (P2) au filet (PASSEUSE)
                1: { x: 200, y: 110 }, // OH1 (P3) au filet
                2: { x: 70, y: 110 },  // MB1 (P4) au filet
                3: { x: 70, y: 380 },  // S2 (P5) reçoit arrière-gauche
                4: { x: 200, y: 380 }, // OH2 (P6) reçoit centre
                5: { x: 330, y: 380 }  // MB2 (P1) reçoit arrière-droite
            }
        }
    }
};

// Charger les noms des joueuses
async function loadPlayerNames() {
    try {
        const response = await fetch('players.json');
        allPlayerSets = await response.json();
    } catch (e) {
        console.error("Erreur chargement noms:", e);
        allPlayerSets = { 
            "set1": { "0":"S1", "1":"OH1", "2":"MB1", "3":"Technique", "4":"OH2", "5":"MB2" },
            "set2": { "0":"S1-2", "1":"OH1-2", "2":"MB1-2", "3":"S2-2", "4":"OH2-2", "5":"MB2-2" }
        };
    }
    updateUI();
}

// --- Logique de Calcul des Coordonnées ---

function getPlayerPosition(playerIndex, rotation, phase, switchedProgress) {
    if (phase === 'reception') {
        const start = SYSTEMS[currentSystem].reception[rotation][playerIndex];
        const end = getAttackTarget(playerIndex, rotation);
        return interpolate(start, end, switchedProgress);
    } else {
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
    const player = SYSTEMS[currentSystem].players[playerIndex];
    const posCode = getStandardPosCode(rotation, playerIndex);
    const isFront = ['P2', 'P3', 'P4'].includes(posCode);

    if (player.role === 's' && isFront) return TARGETS.ATTAQUE.S;
    if (player.role === 's' && !isFront && currentSystem === '5-1') return TARGETS.ATTAQUE.S;
    
    if (isFront) {
        if (player.role === 'oh') return TARGETS.ATTAQUE.LEFT;
        if (player.role === 'mb') return TARGETS.ATTAQUE.CENTER;
        if (player.role === 'opp') return TARGETS.ATTAQUE.RIGHT;
    }
    
    return SYSTEMS[currentSystem].reception[rotation][playerIndex];
}

function getDefenseTarget(playerIndex, rotation) {
    const player = SYSTEMS[currentSystem].players[playerIndex];
    const posCode = getStandardPosCode(rotation, playerIndex);
    const isFront = ['P2', 'P3', 'P4'].includes(posCode);

    if (isFront) {
        if (player.role === 'oh') return TARGETS.DEFENSE.BLOCK_L;
        if (player.role === 'mb') return TARGETS.DEFENSE.BLOCK_C;
        if (player.role === 's' || player.role === 'opp') return TARGETS.DEFENSE.BLOCK_R;
    } else {
        if (player.role === 's' || player.role === 'opp') return TARGETS.DEFENSE.S_OPP;
        if (player.role === 'mb') return TARGETS.DEFENSE.MB;
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
    SYSTEMS[currentSystem].players.forEach((player, index) => {
        const p = getPlayerPosition(index, currentRotation, currentPhase, progress);
        
        // Dessin du chemin
        if (progress > 0 && progress < 1) {
            const start = (currentPhase === 'reception') ? SYSTEMS[currentSystem].reception[currentRotation][index] : POS[getStandardPosCode(currentRotation, index)];
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
    title.textContent = `Système ${currentSystem} | S en ${posName}`;
    
    if (currentPhase === 'reception') {
        desc.textContent = "Phase RÉCEPTION : Cliquez pour voir la transition.";
        btnSwitch.textContent = isSwitched ? "Retour Placement Réception" : "Transition vers ATTAQUE";
    } else {
        desc.textContent = "Phase SERVICE : Cliquez pour voir le SWITCH.";
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

document.querySelectorAll('.system-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentSystem = e.target.dataset.system;
        isSwitched = false;
        progress = 0;
        updateUI();
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
