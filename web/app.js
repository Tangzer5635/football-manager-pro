// ===================================================================
// CONFIG
// ===================================================================
const CONFIG = {
    supabaseUrl: "https://zqavhuzfgzkimduzabbz.supabase.co/rest/v1",
    supabaseKey: "sb_publishable_qCzHEqb9ulwCVpy_jZ-DQQ_OsGW5lcT",
    logoApiKey:  "pk_cXLAhL1uTtOWa6R8tAIUAQ"
};

const NIVEAUX = { 1: "Ligue 1", 2: "Ligue 2", 3: "Ligue 3", 4: "National", 5: "National 2", 6: "National 3" };
const POSTES  = { 1: "Gardien", 2: "Défenseur", 3: "Milieu", 4: "Attaquant" };

const LOGO_ALIASES = {
    "Angers SCO": "angers-sco.fr",
    "AJ Auxerre": "aja.fr",
    "Stade Brestois 29": "sb29.bzh",
    "Le Havre AC": "hac-foot.com",
    "RC Lens": "rclens.fr",
    "LOSC Lille": "losc.fr",
    "Olympique Lyonnais": "ol.fr",
    "FC Lorient": "fclweb.fr",
    "Olympique de Marseille": "om.fr",
    "FC Metz": "fcmetz.com",
    "AS Monaco": "asmonaco.com",
    "FC Nantes": "fcnantes.com",
    "OGC Nice": "ogcnice.com",
    "Paris FC": "parisfc.fr",
    "Paris Saint-Germain": "psg.fr",
    "Stade Rennais FC": "staderennais.com",
    "RC Strasbourg Alsace": "rcstrasbourgalsace.fr",
    "Toulouse FC": "toulousefc.com"
};

// ===================================================================
// ÉTAT GLOBAL
// ===================================================================
let state = {
    clubs: [],
    currentPage: null
};

// ===================================================================
// API
// ===================================================================
async function api(path, options = {}) {
    const res = await fetch(`${CONFIG.supabaseUrl}${path}`, {
        ...options,
        headers: {
            apikey: CONFIG.supabaseKey,
            Authorization: `Bearer ${CONFIG.supabaseKey}`,
            ...options.headers
        }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
    }

    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : null;
}

function postJson(path, body) {
    return api(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

function patchJson(path, body) {
    return api(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

function deleteApi(path) {
    return api(path, { method: "DELETE" });
}

// ===================================================================
// CHARGEMENT DES DONNÉES
// ===================================================================
async function chargerDonnees() {
    try {
        const [clubs, equipes, personnes, entraineurs, joueurs] = await Promise.all([
            api("/club?select=*"),
            api("/equipe?select=*,niveau(id_niveau,libelle_niveau)"),
            api("/personne?select=*"),
            api("/entraineur?select=*"),
            api("/joueurs?select=*")
        ]);

        // Index pour accès O(1)
        const personnesMap   = Object.fromEntries(personnes.map(p => [p.id_personne, p]));
        const entraineursMap = Object.fromEntries(entraineurs.map(e => [e.id_entraineur, e]));
        const joueursByEquipe = joueurs.reduce((acc, j) => {
            (acc[j.id_equipe] ??= []).push(j);
            return acc;
        }, {});

        state.clubs = clubs.map(club => ({
            id:           club.id_club,
            nom:          club.nom_club,
            logo:         club.logo_url,
            dateCreation: club.date_creation,
            equipes: equipes
                .filter(e => e.id_club === club.id_club)
                .map(equipe => {
                    const entraineur    = entraineursMap[equipe.id_entraineur];
                    const personneCoach = personnesMap[entraineur?.id_entraineur];
                    return {
                        id:         equipe.id_equipe,
                        nom:        equipe.nom_equipe,
                        idNiveau:   equipe.id_niveau,
                        niveau:     equipe.niveau?.libelle_niveau || "Inconnu",
                        entraineur: personneCoach ? `${personneCoach.prenom} ${personneCoach.nom}` : "-",
                        joueurs: (joueursByEquipe[equipe.id_equipe] || []).map(joueur => {
                            const personne = personnesMap[joueur.id_joueur];
                            return {
                                id:           joueur.id_joueur,
                                nom:          personne?.nom    || "-",
                                prenom:       personne?.prenom || "-",
                                age:          calculerAge(joueur.date_naissance),
                                dateNaissance: joueur.date_naissance,
                                poste:        POSTES[joueur.id_poste] || "-",
                                prix:         joueur.prix,
                                titulaire:    joueur.titulaire
                            };
                        })
                    };
                })
        }));
    } catch (error) {
        console.error("Erreur chargement données :", error);
        state.clubs = [];
    }
}

// ===================================================================
// UTILITAIRES
// ===================================================================
function calculerAge(dateNaissance) {
    if (!dateNaissance) return "?";
    const naissance = new Date(dateNaissance);
    if (isNaN(naissance)) return "?";
    const auj = new Date();
    let age = auj.getFullYear() - naissance.getFullYear();
    const mois = auj.getMonth() - naissance.getMonth();
    if (mois < 0 || (mois === 0 && auj.getDate() < naissance.getDate())) age--;
    return age;
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d) ? date : d.toLocaleDateString("fr-FR");
}

function formatPrix(prix) {
    prix = Number(prix);
    if (prix >= 1_000_000_000) return `${(prix / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Md€`;
    if (prix >= 1_000_000)     return `${(prix / 1_000_000).toFixed(1).replace(/\.0$/, "")}M€`;
    if (prix >= 1_000)         return `${(prix / 1_000).toFixed(1).replace(/\.0$/, "")}k€`;
    return `${prix}€`;
}

function escapeJs(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function genId() {
    return Math.floor(1000 + Math.random() * 900000);
}

function getNiveauxDisponibles() {
    const niveaux = new Map();
    state.clubs.forEach(club =>
        club.equipes.forEach(equipe => {
            if (!niveaux.has(equipe.idNiveau)) niveaux.set(equipe.idNiveau, equipe.niveau);
        })
    );
    return Array.from(niveaux.entries()).sort((a, b) => a[0] - b[0]);
}

function trouverLogoClub(nomClub) {
    const domaine = LOGO_ALIASES[nomClub];
    return domaine
        ? `https://img.logo.dev/${domaine}?token=${CONFIG.logoApiKey}`
        : "https://cdn-icons-png.flaticon.com/512/53/53283.png";
}

function getEl(id) { return document.getElementById(id); }

// ===================================================================
// TOASTS (remplace les alert())
// ===================================================================
function toast(message, type = "success") {
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("toast-show"));
    setTimeout(() => {
        t.classList.remove("toast-show");
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

// ===================================================================
// INITIALISATION
// ===================================================================
window.addEventListener("DOMContentLoaded", async () => {
    await chargerDonnees();
    showPage("dashboard");
});

// ===================================================================
// NAVIGATION
// ===================================================================
const PAGES = {
    dashboard:  afficherDashboard,
    clubs:      afficherClubs,
    equipes:    afficherEquipes,
    joueurs:    afficherJoueurs,
    titulaires: afficherTitulaires,
    classement: afficherClassement,
    matchs:     afficherMatchs
};

function showPage(page) {
    state.currentPage = page;

    // Mise à jour menu actif
    document.querySelectorAll(".menu button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === page);
    });

    const title    = getEl("page-title");
    const subtitle = getEl("page-subtitle");
    const content  = getEl("page-content");

    if (PAGES[page]) PAGES[page](title, subtitle, content);
}

async function rafraichir(page) {
    try {
        await chargerDonnees();
        showPage(page ?? state.currentPage);
    } catch (error) {
        console.error(error);
        toast(error.message, "error");
    }
}

// ===================================================================
// DASHBOARD
// ===================================================================
function afficherDashboard(title, subtitle, content) {
    let nbEquipes = 0, nbJoueurs = 0, nbTitulaires = 0;
    state.clubs.forEach(club => {
        nbEquipes += club.equipes.length;
        club.equipes.forEach(equipe => {
            nbJoueurs += equipe.joueurs.length;
            equipe.joueurs.forEach(j => { if (j.titulaire) nbTitulaires++; });
        });
    });

    const valeurTotale = state.clubs.reduce((acc, club) =>
        acc + club.equipes.reduce((a, e) =>
            a + e.joueurs.reduce((s, j) => s + Number(j.prix || 0), 0), 0), 0);

    title.textContent    = "Dashboard";
    subtitle.textContent = "Vue d'ensemble de votre club";

    content.innerHTML = `
        <div class="cards grid">
            <div class="card dashboard-stat">
                <div class="stat-icon">🏟️</div>
                <div class="stat-info">
                    <p class="stat-value">${state.clubs.length}</p>
                    <p class="stat-label">Club(s)</p>
                </div>
                <button class="action-btn" onclick="ouvrirModalClub()">➕ Créer</button>
            </div>
            <div class="card dashboard-stat">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <p class="stat-value">${nbEquipes}</p>
                    <p class="stat-label">Équipe(s)</p>
                </div>
                <button class="action-btn" onclick="creerEquipe()">➕ Créer</button>
            </div>
            <div class="card dashboard-stat">
                <div class="stat-icon">⚽</div>
                <div class="stat-info">
                    <p class="stat-value">${nbJoueurs}</p>
                    <p class="stat-label">Joueur(s)</p>
                </div>
                <button class="action-btn" onclick="ajouterJoueur()">➕ Ajouter</button>
            </div>
            <div class="card dashboard-stat">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                    <p class="stat-value">${nbTitulaires}</p>
                    <p class="stat-label">Titulaire(s)</p>
                </div>
            </div>
            <div class="card dashboard-stat full-width-stat">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <p class="stat-value">${formatPrix(valeurTotale)}</p>
                    <p class="stat-label">Valeur totale du effectif</p>
                </div>
            </div>
        </div>
    `;
}

// ===================================================================
// CLUBS
// ===================================================================
function afficherClubs(title, subtitle, content) {
    title.textContent    = "Clubs";
    subtitle.textContent = "Gestion des clubs";

    const rows = state.clubs.map((club, i) => {
        const niveaux = [...new Set(club.equipes.map(e => e.niveau))].join(", ") || "Aucun";
        return `
            <tr class="club-row" data-nom="${club.nom.toLowerCase()}" data-niveaux="${niveaux.toLowerCase()}">
                <td>${i + 1}</td>
                <td>
                    <div class="club-cell">
                        <img src="${club.logo}" class="club-logo" alt="${club.nom}">
                        <strong>${club.nom}</strong>
                    </div>
                </td>
                <td>${formatDate(club.dateCreation)}</td>
                <td><span class="badge-niveau">${niveaux}</span></td>
                <td>${club.equipes.length}</td>
                <td>
                    <div style="display:flex;gap:8px;">
                        <button class="action-btn" onclick='afficherPresentationClub(${JSON.stringify(club)})'>👁️ Voir</button>
                        <button class="action-btn danger-btn" onclick="supprimerClub('${escapeJs(club.nom)}')">🗑️ Supprimer</button>
                    </div>
                </td>
            </tr>`;
    }).join("");

    content.innerHTML = `
        <div class="page-actions">
            <button class="action-btn" onclick="ouvrirModalClub()">➕ Créer un club</button>
            <input type="text" id="recherche-club" placeholder="🔎 Rechercher un club ou un niveau..."
                   oninput="filtrerClubs()" class="search-input">
        </div>
        ${rows ? `
            <div class="table-wrapper">
                <table class="table">
                    <thead><tr><th>#</th><th>Nom</th><th>Date de création</th><th>Niveaux</th><th>Équipes</th><th>Actions</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>` : `<div class="card"><h3>Aucun club</h3><p>Aucun club trouvé.</p></div>`}
    `;
}

function filtrerClubs() {
    const q = getEl("recherche-club").value.toLowerCase();
    document.querySelectorAll(".club-row").forEach(row => {
        row.style.display = (row.dataset.nom.includes(q) || row.dataset.niveaux.includes(q)) ? "" : "none";
    });
}

// ===================================================================
// ÉQUIPES
// ===================================================================
function afficherEquipes(title, subtitle, content) {
    title.textContent    = "Équipes";
    subtitle.textContent = "Gestion des équipes";

    let index = 1;
    const rows = state.clubs.flatMap(club =>
        club.equipes.map(equipe => `
            <tr>
                <td>${index++}</td>
                <td>
                    <div class="club-cell">
                        <img src="${club.logo}" class="club-logo" alt="${club.nom}">
                        ${club.nom}
                    </div>
                </td>
                <td><span class="badge-niveau">${equipe.niveau}</span></td>
                <td>${equipe.entraineur}</td>
                <td>${equipe.joueurs.length}</td>
                <td>
                    <button class="action-btn danger-btn" onclick="supprimerEquipe(${equipe.id})">🗑️ Supprimer</button>
                </td>
            </tr>`)
    ).join("");

    content.innerHTML = `
        <div class="page-actions">
            <button class="action-btn" onclick="creerEquipe()">➕ Créer une équipe</button>
        </div>
        ${rows ? `
            <div class="table-wrapper">
                <table class="table">
                    <thead><tr><th>#</th><th>Club</th><th>Niveau</th><th>Entraîneur</th><th>Joueurs</th><th>Actions</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>` : `<div class="card"><h3>Aucune équipe</h3><p>Aucune équipe trouvée.</p></div>`}
    `;
}

// ===================================================================
// JOUEURS
// ===================================================================
function afficherJoueurs(title, subtitle, content) {
    title.textContent    = "Joueurs";
    subtitle.textContent = "Gestion des joueurs";

    const cards = state.clubs.flatMap(club =>
        club.equipes.flatMap(equipe =>
            equipe.joueurs.map(joueur => {
                const joueurData = {
                    nom: joueur.nom, prenom: joueur.prenom,
                    age: joueur.age, poste: joueur.poste,
                    prix: formatPrix(joueur.prix), titulaire: joueur.titulaire,
                    club: club.nom, niveau: equipe.niveau,
                    dateNaissance: joueur.dateNaissance
                };
                return `
                    <div class="card joueur-card"
                         data-nom="${joueur.prenom} ${joueur.nom}"
                         data-equipe="${club.nom} - ${equipe.niveau}">
                        ${joueur.titulaire ? '<span class="badge-titulaire">⭐ Titulaire</span>' : ""}
                        <h3>${joueur.prenom} ${joueur.nom}</h3>
                        <p><strong>Âge :</strong> ${joueur.age} ans</p>
                        <p><strong>Poste :</strong> ${joueur.poste}</p>
                        <p><strong>Valeur :</strong> ${formatPrix(joueur.prix)}</p>
                        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="action-btn"
                                onclick='afficherPresentationJoueur(${JSON.stringify(joueurData)})'>
                                👁️ Voir
                            </button>
                            <button class="action-btn danger-btn"
                                onclick="supprimerJoueur(${joueur.id})">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>`;
            })
        )
    ).join("");

    const optionsEquipes = state.clubs.flatMap(club =>
        club.equipes.map(e => `<option value="${club.nom} - ${e.niveau}">${club.nom} - ${e.niveau}</option>`)
    ).join("");

    content.innerHTML = `
        <div class="joueurs-filtres">
            <input type="text" id="recherche-joueur" placeholder="🔎 Rechercher un joueur..." oninput="filtrerJoueurs()">
            <select id="filtre-equipe-joueurs" onchange="filtrerJoueurs()">
                <option value="">Toutes les équipes</option>
                ${optionsEquipes}
            </select>
        </div>
        <div class="page-actions">
            <button class="action-btn" onclick="ajouterJoueur()">➕ Ajouter un joueur</button>
        </div>
        ${cards ? `<div class="cards grid">${cards}</div>` : `<div class="card"><h3>Aucun joueur</h3><p>Aucun joueur trouvé.</p></div>`}
    `;
}

function filtrerJoueurs() {
    const nom    = getEl("recherche-joueur").value.toLowerCase();
    const equipe = getEl("filtre-equipe-joueurs").value.toLowerCase();
    document.querySelectorAll(".joueur-card").forEach(card => {
        const okNom    = card.dataset.nom.toLowerCase().includes(nom);
        const okEquipe = !equipe || card.dataset.equipe.toLowerCase().includes(equipe);
        card.style.display = (okNom && okEquipe) ? "block" : "none";
    });
}

// ===================================================================
// TITULAIRES
// ===================================================================
function afficherTitulaires(title, subtitle, content) {
    title.textContent    = "Titulaires";
    subtitle.textContent = "Joueurs titulaires par équipe";

    const options = [
        '<option value="">Toutes les équipes</option>',
        ...state.clubs.flatMap(club =>
            club.equipes.map(equipe => {
                const val = `${club.nom}|${equipe.niveau}`;
                return `<option value="${escapeJs(val)}">${club.nom} - ${equipe.niveau}</option>`;
            })
        )
    ].join("");

    content.innerHTML = `
        <div class="card">
            <div class="form-group">
                <label for="filtre-equipe">Rechercher les titulaires par équipe</label>
                <select id="filtre-equipe" onchange="filtrerTitulairesParEquipe()">${options}</select>
            </div>
        </div>
        <div id="titulaires-resultats" class="cards grid"></div>
    `;

    filtrerTitulairesParEquipe();
}

function filtrerTitulairesParEquipe() {
    const filtre    = getEl("filtre-equipe")?.value;
    const container = getEl("titulaires-resultats");
    if (!container) return;

    const cards = state.clubs.flatMap(club =>
        club.equipes
            .filter(equipe => !filtre || `${club.nom}|${equipe.niveau}` === filtre)
            .flatMap(equipe => {
                const titulaires = equipe.joueurs.filter(j => j.titulaire);
                if (!titulaires.length) return [];
                const liste = titulaires.map(j => `
                    <div class="titulaire-item">
                        <strong>${j.prenom} ${j.nom}</strong>
                        <p class="titulaire-meta">${j.poste} • ${j.age} ans • ${formatPrix(j.prix)}</p>
                    </div>`).join("");
                return [`
                    <div class="card">
                        <h3>🏟️ ${club.nom}</h3>
                        <p><strong>Niveau :</strong> ${equipe.niveau}</p>
                        <div style="margin-top:12px;">${liste}</div>
                    </div>`];
            })
    ).join("");

    container.innerHTML = cards || `<div class="card"><h3>Aucun titulaire</h3><p>Aucun joueur titulaire trouvé.</p></div>`;
}

// ===================================================================
// CLASSEMENT
// ===================================================================
async function afficherClassement(title, subtitle, content) {
    title.textContent    = "Classement";
    subtitle.textContent = "Classement par niveau";

    const niveaux = getNiveauxDisponibles();
    content.innerHTML = `
        <div class="page-actions">
            <select id="classement-niveau" class="niveau-select" onchange="chargerTableauClassement()">
                ${niveaux.map(([id, nom]) => `<option value="${id}">${nom}</option>`).join("")}
            </select>
        </div>
        <div id="classement-contenu"><div class="card"><p>Chargement…</p></div></div>
    `;

    await chargerTableauClassement();
}

async function chargerTableauClassement() {
    const select    = getEl("classement-niveau");
    const container = getEl("classement-contenu");
    if (!select || !container) return;

    const idNiveau  = parseInt(select.value);
    const nomNiveau = NIVEAUX[idNiveau] || "Inconnu";

    const clubsDuNiveau = new Set(
        state.clubs.flatMap(club =>
            club.equipes.filter(e => e.idNiveau === idNiveau).map(() => club.nom)
        )
    );

    try {
        const classement = await api("/vue_classement?select=*&order=points.desc,difference.desc", { cache: "no-store" });
        const filtre = classement.filter(row => clubsDuNiveau.has(row.nom_club));

        if (!filtre.length) {
            container.innerHTML = `<div class="card"><h3>Aucun résultat</h3><p>Aucun match enregistré pour <strong>${nomNiveau}</strong>.</p></div>`;
            return;
        }

        const rows = filtre.map((club, i) => {
            const rang = i + 1;
            const logo = state.clubs.find(c => c.nom === club.nom_club)?.logo;
            return `
                <tr>
                    <td class="rang-cell ${rang <= 3 ? `rang-${rang}` : ""}">${rang}</td>
                    <td>
                        <div class="club-cell">
                            <img src="${logo}" class="club-logo" alt="${club.nom_club}">
                            <strong>${club.nom_club}</strong>
                        </div>
                    </td>
                    <td><strong>${club.points}</strong></td>
                    <td>${club.victoires}</td><td>${club.nuls}</td><td>${club.defaites}</td>
                    <td>${club.buts_pour}</td><td>${club.buts_contre}</td>
                    <td>${club.difference >= 0 ? "+" : ""}${club.difference}</td>
                </tr>`;
        }).join("");

        container.innerHTML = `
            <div class="table-wrapper">
                <table class="table">
                    <thead><tr><th>#</th><th>Club</th><th>PTS</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="card">❌ Impossible de charger le classement<br><small>${error.message}</small></div>`;
    }
}

// ===================================================================
// MATCHS
// ===================================================================
async function afficherMatchs(title, subtitle, content) {
    title.textContent    = "Matchs";
    subtitle.textContent = "Gestion des matchs";

    const niveaux = getNiveauxDisponibles();
    content.innerHTML = `
        <div class="page-actions">
            <select id="matchs-niveau" class="niveau-select" onchange="chargerTableauMatchs()">
                ${niveaux.map(([id, nom]) => `<option value="${id}">${nom}</option>`).join("")}
            </select>
            <button class="action-btn" onclick="ouvrirModalMatch()">➕ Créer un match</button>
        </div>
        <div id="matchs-contenu"><div class="card"><p>Chargement…</p></div></div>
    `;

    await chargerTableauMatchs();
}

async function chargerTableauMatchs() {
    const select    = getEl("matchs-niveau");
    const container = getEl("matchs-contenu");
    if (!select || !container) return;

    const idNiveau = parseInt(select.value);

    const equipeToClub = {};
    state.clubs.forEach(club =>
        club.equipes.forEach(equipe => {
            if (equipe.idNiveau === idNiveau) equipeToClub[equipe.id] = club.nom;
        })
    );
    const equipesNiveau = new Set(Object.keys(equipeToClub).map(Number));

    try {
        const matchs  = await api("/matchs?select=*&order=id_match.desc");
        const filtres = matchs.filter(m => equipesNiveau.has(m.equipe_domicile) || equipesNiveau.has(m.equipe_exterieur));

        if (!filtres.length) {
            container.innerHTML = `<div class="card"><h3>Aucun match</h3><p>Aucun match enregistré pour ce niveau.</p></div>`;
            return;
        }

        const rows = filtres.map(match => {
            const dom     = equipeToClub[match.equipe_domicile]  || "-";
            const ext     = equipeToClub[match.equipe_exterieur] || "-";
            const logoDom = state.clubs.find(c => c.nom === dom)?.logo;
            const logoExt = state.clubs.find(c => c.nom === ext)?.logo;
            const domWin  = match.score_domicile > match.score_exterieur;
            const extWin  = match.score_exterieur > match.score_domicile;
            return `
                <tr>
                    <td>
                        <div class="match-team">
                            <img src="${logoDom}" class="club-logo" alt="${dom}">
                            <span style="font-weight:${domWin ? "800" : "500"};color:${domWin ? "white" : "#94a3b8"}">${dom}</span>
                        </div>
                    </td>
                    <td class="score-cell">${match.score_domicile} <span class="score-sep">—</span> ${match.score_exterieur}</td>
                    <td>
                        <div class="match-team match-team-right">
                            <span style="font-weight:${extWin ? "800" : "500"};color:${extWin ? "white" : "#94a3b8"}">${ext}</span>
                            <img src="${logoExt}" class="club-logo" alt="${ext}">
                        </div>
                    </td>
                </tr>`;
        }).join("");

        container.innerHTML = `
            <div class="table-wrapper">
                <table class="table">
                    <thead><tr><th>Domicile</th><th>Score</th><th>Extérieur</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="card">❌ Impossible de charger les matchs<br><small>${error.message}</small></div>`;
    }
}

// ===================================================================
// MODAL MATCH
// ===================================================================
function ouvrirModalMatch() {
    getEl("modal-match").style.display = "flex";
    chargerNiveauxMatch();
}

function fermerModalMatch() {
    getEl("modal-match").style.display = "none";
}

function chargerNiveauxMatch() {
    const niveaux = getNiveauxDisponibles();
    getEl("niveau").innerHTML = niveaux.map(([id, nom]) => `<option value="${id}">${nom}</option>`).join("");
    chargerEquipesMatch();
}

function chargerEquipesMatch() {
    const idNiveau = parseInt(getEl("niveau").value);
    const options  = state.clubs.flatMap(club =>
        club.equipes
            .filter(e => e.idNiveau === idNiveau)
            .map(e => `<option value="${e.id}">${club.nom}</option>`)
    ).join("");
    getEl("domicile").innerHTML  = options;
    getEl("exterieur").innerHTML = options;
}

async function ajouterMatch() {
    const domicile   = parseInt(getEl("domicile").value);
    const exterieur  = parseInt(getEl("exterieur").value);
    const scoreDom   = parseInt(getEl("scoreDom").value);
    const scoreExt   = parseInt(getEl("scoreExt").value);

    if (isNaN(domicile) || isNaN(exterieur)) { toast("Veuillez sélectionner les deux équipes.", "error"); return; }
    if (isNaN(scoreDom) || isNaN(scoreExt))  { toast("Veuillez saisir les scores.", "error"); return; }
    if (domicile === exterieur)              { toast("Les équipes doivent être différentes.", "error"); return; }

    try {
        await api("/matchs", {
            method: "POST",
            headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({
                equipe_domicile: domicile,
                equipe_exterieur: exterieur,
                score_domicile: scoreDom,
                score_exterieur: scoreExt,
                date_match: new Date().toISOString().split("T")[0]
            })
        });
        fermerModalMatch();
        await chargerDonnees();
        await chargerTableauMatchs();
        if (getEl("classement-contenu")) await chargerTableauClassement();
        toast("Match enregistré !");
    } catch (error) {
        console.error(error);
        toast("Erreur ajout match : " + error.message, "error");
    }
}

// ===================================================================
// MODAL CLUB
// ===================================================================
function ouvrirModalClub() { getEl("modal-club").classList.remove("hidden"); }
function fermerModalClub()  { getEl("modal-club").classList.add("hidden"); }

async function creerClub() {
    const nom          = getEl("club-nom").value.trim();
    const dateCreation = getEl("club-date").value;

    if (!nom || !dateCreation) { afficherErreurModal("Veuillez remplir tous les champs."); return; }

    try {
        const logo = trouverLogoClub(nom);
        await postJson("/club", { nom_club: nom, date_creation: dateCreation, logo_url: logo });
        getEl("club-nom").value  = "";
        getEl("club-date").value = "";
        fermerModalClub();
        await rafraichir("clubs");
        toast("Club créé avec succès !");
    } catch (error) {
        console.error(error);
        afficherErreurModal("Erreur création club.");
    }
}

async function supprimerClub(nom) {
    if (!confirm(`Supprimer le club "${nom}" ?`)) return;
    const club = state.clubs.find(c => c.nom === nom);
    if (!club) { toast("Club introuvable", "error"); return; }

    try {
        await deleteApi(`/joueurs?id_club=eq.${club.id}`);
        await deleteApi(`/equipe?id_club=eq.${club.id}`);
        await deleteApi(`/club?id_club=eq.${club.id}`);
        await rafraichir("clubs");
        toast("Club supprimé.");
    } catch (error) {
        console.error(error);
        toast("Erreur suppression club.", "error");
    }
}

// ===================================================================
// MODAL ÉQUIPE
// ===================================================================
function creerEquipe() {
    getEl("equipe-club").innerHTML = state.clubs.map(c => `<option value="${c.id}">${c.nom}</option>`).join("");
    getEl("modal-equipe").classList.remove("hidden");
}

function fermerModalEquipe() { getEl("modal-equipe").classList.add("hidden"); }

async function creerNouvelleEquipe() {
    const clubId = getEl("equipe-club").value;
    const niveau = getEl("equipe-niveau").value;
    const nom    = getEl("entraineur-nom").value.trim();
    const prenom = getEl("entraineur-prenom").value.trim();

    if (!clubId || !niveau || !nom || !prenom) { afficherErreurModal("Veuillez remplir tous les champs."); return; }

    try {
        const id = genId();
        await postJson("/personne", { id_personne: id, nom, prenom });
        await postJson("/entraineur", { id_entraineur: id });
        await postJson("/equipe", {
            nom_equipe:    `Equipe ${NIVEAUX[niveau] || niveau}`,
            id_niveau:     Number(niveau),
            id_club:       Number(clubId),
            id_entraineur: id
        });
        fermerModalEquipe();
        await rafraichir("equipes");
        toast("Équipe créée !");
    } catch (error) {
        console.error(error);
        afficherErreurModal("Erreur création équipe.");
    }
}

async function supprimerEquipe(idEquipe) {
    if (!confirm("Supprimer cette équipe ?")) return;
    try {
        await deleteApi(`/joueurs?id_equipe=eq.${idEquipe}`);
        await deleteApi(`/equipe?id_equipe=eq.${idEquipe}`);
        await rafraichir("equipes");
        toast("Équipe supprimée.");
    } catch (error) {
        console.error(error);
        toast("Erreur suppression équipe.", "error");
    }
}

// ===================================================================
// MODAL JOUEUR
// ===================================================================
function ajouterJoueur() {
    const selectClub = getEl("joueur-club");
    selectClub.innerHTML = state.clubs.map(c => `<option value="${c.nom}">${c.nom}</option>`).join("");
    chargerEquipesPourJoueur();
    getEl("modal-joueur").classList.remove("hidden");
}

function fermerModalJoueur() { getEl("modal-joueur").classList.add("hidden"); }

function chargerEquipesPourJoueur() {
    const clubNom = getEl("joueur-club").value;
    const club    = state.clubs.find(c => c.nom === clubNom);
    getEl("joueur-equipe").innerHTML = (club?.equipes || []).map(e =>
        `<option value="${e.niveau}">${e.niveau}</option>`
    ).join("");
}

async function soumettreAjoutJoueur() {
    const clubNom       = getEl("joueur-club").value;
    const niveau        = getEl("joueur-equipe").value;
    const nom           = getEl("joueur-nom").value.trim();
    const prenom        = getEl("joueur-prenom").value.trim();
    const dateNaissance = getEl("joueur-date-naissance").value;
    const poste         = getEl("joueur-poste").value;
    const prix          = getEl("joueur-prix").value;
    const titulaire     = getEl("joueur-titulaire").checked;

    const club   = state.clubs.find(c => c.nom === clubNom);
    const equipe = club?.equipes.find(e => e.niveau === niveau);

    if (!club)   { toast("Club introuvable", "error");   return; }
    if (!equipe) { toast("Équipe introuvable", "error"); return; }
    if (!nom || !prenom || !dateNaissance || !poste || !prix) {
        toast("Veuillez remplir tous les champs.", "error");
        return;
    }

    try {
        const id = genId();
        await postJson("/personne", { id_personne: id, nom, prenom });
        await postJson("/joueurs", {
            id_joueur: id,
            prix: Number(prix),
            date_naissance: dateNaissance,
            titulaire,
            id_poste:  Number(poste),
            id_club:   Number(club.id),
            id_equipe: Number(equipe.id)
        });
        fermerModalJoueur();
        await rafraichir("joueurs");
        toast("Joueur ajouté !");
    } catch (error) {
        console.error(error);
        toast("Erreur ajout joueur : " + error.message, "error");
    }
}

async function supprimerJoueur(idJoueur) {
    if (!confirm("Supprimer ce joueur ?")) return;
    try {
        await deleteApi(`/joueurs?id_joueur=eq.${idJoueur}`);
        await deleteApi(`/personne?id_personne=eq.${idJoueur}`);
        await rafraichir("joueurs");
        toast("Joueur supprimé.");
    } catch (error) {
        console.error(error);
        toast("Erreur suppression joueur.", "error");
    }
}

// ===================================================================
// PRÉSENTATION JOUEUR
// ===================================================================
function afficherPresentationJoueur(joueur) {
    creerModal(`
        <div class="modal-header">
            <h2>⚽ Présentation du joueur</h2>
            <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
            <div class="player-profile">
                <h3 class="player-name">${joueur.prenom} ${joueur.nom}</h3>
                <div class="player-info">
                    <p><strong>Âge :</strong> ${joueur.age} ans</p>
                    <p><strong>Poste :</strong> ${joueur.poste}</p>
                    <p><strong>Valeur :</strong> ${joueur.prix}</p>
                    <p><strong>Titulaire :</strong> ${joueur.titulaire ? "⭐ Oui" : "Non"}</p>
                    <p><strong>Club :</strong> ${joueur.club}</p>
                    <p><strong>Niveau :</strong> ${joueur.niveau}</p>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="action-btn secondary-btn">Fermer</button>
        </div>
    `);
}

// ===================================================================
// PRÉSENTATION CLUB
// ===================================================================
function afficherPresentationClub(club) {
    let nbJoueurs = 0, nbTitulaires = 0, valeurTotale = 0;
    club.equipes.forEach(equipe => {
        nbJoueurs += equipe.joueurs.length;
        equipe.joueurs.forEach(j => {
            valeurTotale += Number(j.prix || 0);
            if (j.titulaire) nbTitulaires++;
        });
    });

    const equipesHtml = club.equipes.map(equipe => `
        <div class="club-equipe-card">
            <div class="club-equipe-header">
                <img src="${club.logo}" class="club-equipe-logo" alt="${club.nom}">
                <h3>${equipe.niveau}</h3>
            </div>
            <p><strong>Entraîneur :</strong> ${equipe.entraineur}</p>
            <p><strong>Joueurs :</strong> ${equipe.joueurs.length}</p>
        </div>`).join("");

    creerModal(`
        <div class="modal-header club-modal-header">
            <div class="club-modal-title">
                <img src="${club.logo}" alt="${club.nom}" class="club-logo-large">
                <div>
                    <h2>${club.nom}</h2>
                    <p class="club-founded">Fondé le ${formatDate(club.dateCreation)}</p>
                </div>
            </div>
            <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
            <div class="club-stats-grid">
                <div class="club-stat-card"><h3>📅 Fondation</h3><p>${formatDate(club.dateCreation)}</p></div>
                <div class="club-stat-card"><h3>👥 Équipes</h3><p>${club.equipes.length}</p></div>
                <div class="club-stat-card"><h3>⚽ Joueurs</h3><p>${nbJoueurs}</p></div>
                <div class="club-stat-card"><h3>⭐ Titulaires</h3><p>${nbTitulaires}</p></div>
                <div class="club-stat-card full-width"><h3>💰 Valeur totale</h3><p>${formatPrix(valeurTotale)}</p></div>
            </div>
            <div style="margin-top:32px;">
                <h2 style="margin-bottom:16px;">⚽ Équipes du club</h2>
                ${equipesHtml || '<p style="color:#94a3b8;">Aucune équipe.</p>'}
            </div>
        </div>
        <div class="modal-footer">
            <button class="action-btn secondary-btn">Fermer</button>
        </div>
    `);
}

// ===================================================================
// HELPER MODAL GÉNÉRIQUE
// ===================================================================
function creerModal(html) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-overlay"></div><div class="modal-content">${html}</div>`;
    modal.querySelectorAll(".modal-close, .secondary-btn, .modal-overlay")
        .forEach(el => el.addEventListener("click", () => modal.remove()));
    document.body.appendChild(modal);
    return modal;
}

// ===================================================================
// ERREUR MODALE
// ===================================================================
function afficherErreurModal(message) {
    let zone = getEl("modal-error");
    if (!zone) {
        zone = document.createElement("div");
        zone.id = "modal-error";
        zone.className = "modal-error";
        const body = document.querySelector(".modal.active .modal-body") ||
            document.querySelector("#modal-equipe .modal-body") ||
            document.querySelector("#modal-club .modal-body");
        if (body) body.prepend(zone);
    }
    zone.textContent = message;
}

// ===================================================================
// MISE À JOUR DES LOGOS (utilitaire admin)
// ===================================================================
async function mettreAJourTousLesLogos() {
    for (const club of state.clubs) {
        try {
            const logo = trouverLogoClub(club.nom);
            await patchJson(`/club?id_club=eq.${club.id}`, { logo_url: logo });
            console.log(`✅ Logo : ${club.nom}`);
        } catch (e) {
            console.error(`❌ ${club.nom}`, e);
        }
    }
    await chargerDonnees();
    console.log("🏁 Logos mis à jour !");
}