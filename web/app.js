// ===================================================================
// CONFIG SUPABASE
// ===================================================================
const SUPABASE_URL = "https://zqavhuzfgzkimduzabbz.supabase.co/rest/v1";
const SUPABASE_API_KEY = "sb_publishable_qCzHEqb9ulwCVpy_jZ-DQQ_OsGW5lcT";

const NIVEAUX = {
    1: "Ligue 1",
    2: "Ligue 2",
    3: "Ligue 3",
    4: "National",
    5: "National 2",
    6: "National 3"
};

const POSTES = {
    1: "Gardien",
    2: "Défenseur",
    3: "Milieu",
    4: "Attaquant"
};

// ===================================================================
// ÉTAT GLOBAL
// ===================================================================
let data = { clubs: [] };

// ===================================================================
// UTILITAIRE API
// ===================================================================
async function api(path, options = {}) {
    const headers = {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        ...options.headers
    };
    const res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
    }
    // DELETE / POST with return=minimal renvoient un corps vide
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return res.json();
    }
    return null;
}

// ===================================================================
// CHARGEMENT DES DONNÉES
// ===================================================================
async function chargerDonnees() {
    try {
        const [clubs, equipes, personnes, entraineurs, joueurs] = await Promise.all([
            api("/club?select=*"),
            api("/equipe?select=*"),
            api("/personne?select=*"),
            api("/entraineur?select=*"),
            api("/joueurs?select=*")
        ]);

        data = {
            clubs: clubs.map(club => ({
                id: club.id_club,
                nom: club.nom_club,
                dateCreation: club.date_creation,
                equipes: equipes
                    .filter(e => e.id_club === club.id_club)
                    .map(equipe => {
                        const entraineur = entraineurs.find(e => e.id_entraineur === equipe.id_entraineur);
                        const personneCoach = personnes.find(p => p.id_personne === entraineur?.id_entraineur);

                        return {
                            id: equipe.id_equipe,
                            nom: equipe.nom_equipe,
                            idNiveau: equipe.id_niveau,
                            niveau: NIVEAUX[equipe.id_niveau] || "Inconnu",
                            entraineur: personneCoach
                                ? `${personneCoach.prenom} ${personneCoach.nom}`
                                : "-",
                            joueurs: joueurs
                                .filter(j => j.id_equipe === equipe.id_equipe)
                                .map(joueur => {
                                    const personne = personnes.find(p => p.id_personne === joueur.id_joueur);
                                    return {
                                        id: joueur.id_joueur,
                                        nom: personne?.nom || "-",
                                        prenom: personne?.prenom || "-",
                                        age: calculerAge(joueur.date_naissance),
                                        dateNaissance: joueur.date_naissance,
                                        poste: POSTES[joueur.id_poste] || "-",
                                        prix: joueur.prix,
                                        titulaire: joueur.titulaire
                                    };
                                })
                        };
                    })
            }))
        };
    } catch (error) {
        console.error("Erreur chargement données :", error);
        data = { clubs: [] };
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

function getNiveauxDisponibles() {
    const niveaux = new Map();
    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            if (!niveaux.has(equipe.idNiveau)) {
                niveaux.set(equipe.idNiveau, equipe.niveau);
            }
        });
    });
    // Tri par id_niveau
    return Array.from(niveaux.entries()).sort((a, b) => a[0] - b[0]);
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
function showPage(page) {
    const title    = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");
    const content  = document.getElementById("page-content");

    const pages = {
        dashboard:  () => afficherDashboard(title, subtitle, content),
        clubs:      () => afficherClubs(title, subtitle, content),
        equipes:    () => afficherEquipes(title, subtitle, content),
        joueurs:    () => afficherJoueurs(title, subtitle, content),
        titulaires: () => afficherTitulaires(title, subtitle, content),
        classement: () => afficherClassement(title, subtitle, content),
        matchs:     () => afficherMatchs(title, subtitle, content)
    };

    if (pages[page]) pages[page]();
}

async function rafraichir(page) {
    try {
        await chargerDonnees();
        showPage(page);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ===================================================================
// DASHBOARD
// ===================================================================
function afficherDashboard(title, subtitle, content) {
    let nbEquipes = 0, nbJoueurs = 0, nbTitulaires = 0;

    data.clubs.forEach(club => {
        nbEquipes += club.equipes.length;
        club.equipes.forEach(equipe => {
            nbJoueurs += equipe.joueurs.length;
            equipe.joueurs.forEach(j => { if (j.titulaire) nbTitulaires++; });
        });
    });

    title.textContent    = "Dashboard";
    subtitle.textContent = "Vue d'ensemble de votre club";

    content.innerHTML = `
        <div class="cards grid">
            <div class="card">
                <h3>🏟️ Clubs</h3>
                <p>${data.clubs.length} club(s)</p>
                <button class="action-btn" onclick="ouvrirModalClub()">➕ Créer un club</button>
            </div>
            <div class="card">
                <h3>👥 Équipes</h3>
                <p>${nbEquipes} équipe(s)</p>
                <button class="action-btn" onclick="creerEquipe()">➕ Créer une équipe</button>
            </div>
            <div class="card">
                <h3>⚽ Joueurs</h3>
                <p>${nbJoueurs} joueur(s)</p>
                <button class="action-btn" onclick="ajouterJoueur()">➕ Ajouter un joueur</button>
            </div>
            <div class="card">
                <h3>⭐ Titulaires</h3>
                <p>${nbTitulaires} titulaire(s)</p>
            </div>
        </div>
    `;
}

// ===================================================================
// CLUBS
// ===================================================================
function afficherClubs(title, subtitle, content) {
    title.textContent = "Clubs";
    subtitle.textContent = "Gestion des clubs";

    const rows = data.clubs.map((club, i) => {

        // Liste des niveaux uniques du club
        const niveaux = [...new Set(
            club.equipes.map(equipe => equipe.niveau)
        )].join(", ") || "Aucun";

        return `
            <tr class="club-row"
                data-nom="${club.nom.toLowerCase()}"
                data-niveaux="${niveaux.toLowerCase()}">

                <td>${i + 1}</td>

                <td>
                    <strong>${club.nom}</strong>
                </td>

                <td>${formatDate(club.dateCreation)}</td>

                <td>
                    <span class="badge-niveau">
                        ${niveaux}
                    </span>
                </td>

                <td>${club.equipes.length}</td>

                <td>
                    <button class="action-btn danger-btn"
                            onclick="supprimerClub('${escapeJs(club.nom)}')">
                        🗑️ Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    content.innerHTML = `
        <div class="page-actions"
             style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">

            <button class="action-btn" onclick="ouvrirModalClub()">
                ➕ Créer un club
            </button>

            <input
                type="text"
                id="recherche-club"
                placeholder="🔎 Rechercher un club ou un niveau..."
                oninput="filtrerClubs()"
                class="search-input"
            >
        </div>

        ${rows === "" ? `
            <div class="card">
                <h3>Aucun club</h3>
                <p>Aucun club trouvé.</p>
            </div>
        ` : `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nom</th>
                            <th>Date de création</th>
                            <th>Niveaux</th>
                            <th>Équipes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `}
    `;
}

function filtrerClubs() {
    const recherche = document
        .getElementById("recherche-club")
        .value
        .toLowerCase();

    document.querySelectorAll(".club-row").forEach(row => {

        const nom = row.dataset.nom;
        const niveaux = row.dataset.niveaux;

        const visible =
            nom.includes(recherche) ||
            niveaux.includes(recherche);

        row.style.display = visible ? "" : "none";
    });
}
// ===================================================================
// EQUIPES
// ===================================================================
function afficherEquipes(title, subtitle, content) {
    title.textContent    = "Équipes";
    subtitle.textContent = "Gestion des équipes";

    let index = 1;
    const rows = data.clubs.flatMap(club =>
        club.equipes.map(equipe => `
            <tr>
                <td>${index++}</td>
                <td>${club.nom}</td>
                <td>${equipe.niveau}</td>
                <td>${equipe.entraineur}</td>
                <td>${equipe.joueurs.length}</td>
                <td>
                    <button class="action-btn danger-btn"
                            onclick="supprimerEquipe(${equipe.id})">
                        🗑️ Supprimer
                    </button>
                </td>
            </tr>
        `)
    ).join("");

    content.innerHTML = `
        <div class="page-actions">
            <button class="action-btn" onclick="creerEquipe()">➕ Créer une équipe</button>
        </div>
        ${rows === "" ? `
            <div class="card"><h3>Aucune équipe</h3><p>Aucune équipe trouvée.</p></div>
        ` : `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr><th>#</th><th>Club</th><th>Niveau</th><th>Entraîneur</th><th>Joueurs</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `}
    `;
}

// ===================================================================
// JOUEURS
// ===================================================================
function afficherJoueurs(title, subtitle, content) {
    title.textContent    = "Joueurs";
    subtitle.textContent = "Gestion des joueurs";

    const cards = data.clubs.flatMap(club =>
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
                        <h3>${joueur.prenom} ${joueur.nom}</h3>
                        <p><strong>Âge :</strong> ${joueur.age} ans</p>
                        <p><strong>Poste :</strong> ${joueur.poste}</p>
                        <div style="margin-top:20px;">
                            <button class="action-btn"
                                onclick='afficherPresentationJoueur(${JSON.stringify(joueurData)})'>
                                👁️ Présentation
                            </button>
                            <button class="action-btn danger-btn"
                                onclick="supprimerJoueur(${joueur.id})">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>
                `;
            })
        )
    ).join("");

    const optionsEquipes = data.clubs.flatMap(club =>
        club.equipes.map(equipe => `
            <option value="${club.nom} - ${equipe.niveau}">
                ${club.nom} - ${equipe.niveau}
            </option>
        `)
    ).join("");

    content.innerHTML = `
        <div class="joueurs-filtres">
            <input type="text" id="recherche-joueur"
                   placeholder="🔎 Rechercher un joueur..."
                   oninput="filtrerJoueurs()">
            <select id="filtre-equipe" onchange="filtrerJoueurs()">
                <option value="">Toutes les équipes</option>
                ${optionsEquipes}
            </select>
        </div>
        <div class="page-actions">
            <button class="action-btn" onclick="ajouterJoueur()">➕ Ajouter un joueur</button>
        </div>
        ${cards === "" ? `
            <div class="card"><h3>Aucun joueur</h3><p>Aucun joueur trouvé.</p></div>
        ` : `
            <div class="cards grid">${cards}</div>
        `}
    `;
}

function filtrerJoueurs() {
    const recherche = document.getElementById("recherche-joueur").value.toLowerCase();
    const equipe    = document.getElementById("filtre-equipe").value.toLowerCase();

    document.querySelectorAll(".joueur-card").forEach(card => {
        const matchNom    = card.dataset.nom.toLowerCase().includes(recherche);
        const matchEquipe = equipe === "" || card.dataset.equipe.toLowerCase().includes(equipe);
        card.style.display = (matchNom && matchEquipe) ? "block" : "none";
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
        ...data.clubs.flatMap(club =>
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
                <select id="filtre-equipe" onchange="filtrerTitulairesParEquipe()">
                    ${options}
                </select>
            </div>
        </div>
        <div id="titulaires-resultats" class="cards grid"></div>
    `;

    filtrerTitulairesParEquipe();
}

function filtrerTitulairesParEquipe() {
    const select    = document.getElementById("filtre-equipe");
    const container = document.getElementById("titulaires-resultats");
    if (!select || !container) return;

    const filtre = select.value;
    const cards  = data.clubs.flatMap(club =>
        club.equipes
            .filter(equipe => !filtre || `${club.nom}|${equipe.niveau}` === filtre)
            .flatMap(equipe => {
                const titulaires = equipe.joueurs.filter(j => j.titulaire === true);
                if (titulaires.length === 0) return [];
                const liste = titulaires.map(j => `
                    <p>⚽ <strong>${j.prenom} ${j.nom}</strong><br>
                    ${j.poste} • ${j.age} ans • ${formatPrix(j.prix)}</p>
                `).join("");
                return [`
                    <div class="card">
                        <h3>🏟️ ${club.nom}</h3>
                        <p><strong>Niveau :</strong> ${equipe.niveau}</p>
                        <div style="margin-top:12px;">${liste}</div>
                    </div>
                `];
            })
    ).join("");

    container.innerHTML = cards || `
        <div class="card">
            <h3>Aucun titulaire</h3>
            <p>Aucun joueur titulaire trouvé pour cette équipe.</p>
        </div>
    `;
}

// ===================================================================
// CLASSEMENT — filtré par niveau
// ===================================================================
async function afficherClassement(title, subtitle, content) {
    title.textContent    = "Classement";
    subtitle.textContent = "Classement par niveau";

    // Sélecteur de niveau
    const niveaux = getNiveauxDisponibles();
    const optionsNiveau = niveaux.map(([id, nom]) =>
        `<option value="${id}">${nom}</option>`
    ).join("");

    content.innerHTML = `
        <div class="page-actions">
            <select id="classement-niveau" class="niveau-select" onchange="rafraichirClassement()">
                ${optionsNiveau}
            </select>
        </div>
        <div id="classement-contenu">
            <div class="card"><p>Chargement...</p></div>
        </div>
    `;

    await chargerTableauClassement();
}

async function rafraichirClassement() {
    await chargerTableauClassement();
}

async function chargerTableauClassement() {
    const select = document.getElementById("classement-niveau");
    const container = document.getElementById("classement-contenu");
    if (!select || !container) return;

    const idNiveau = parseInt(select.value);
    const nomNiveau = NIVEAUX[idNiveau] || "Inconnu";

    // Récupère les clubs qui ont une équipe dans ce niveau
    const clubsDuNiveau = new Set();
    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            if (equipe.idNiveau === idNiveau) clubsDuNiveau.add(club.nom);
        });
    });

    try {
        const classement = await api(
            "/vue_classement?select=*&order=points.desc,difference.desc",
            { cache: "no-store" }
        );

        // Filtre : on ne garde que les clubs du niveau sélectionné
        const filtre = classement.filter(row => clubsDuNiveau.has(row.nom_club));

        if (filtre.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <h3>Aucun résultat</h3>
                    <p>Aucun match enregistré pour le niveau <strong>${nomNiveau}</strong>.</p>
                </div>
            `;
            return;
        }

        const rows = filtre.map((club, i) => {
            const rang = i + 1;
            const rangClass = rang <= 3 ? `rang-${rang}` : "";
            return `
            <tr>
                <td class="rang-cell ${rangClass}">${rang}</td>
                <td><strong>${club.nom_club}</strong></td>
                <td><strong>${club.points}</strong></td>
                <td>${club.victoires}</td>
                <td>${club.nuls}</td>
                <td>${club.defaites}</td>
                <td>${club.buts_pour}</td>
                <td>${club.buts_contre}</td>
                <td>${club.difference >= 0 ? "+" : ""}${club.difference}</td>
            </tr>
        `;
        }).join("");

        container.innerHTML = `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th><th>Club</th><th>PTS</th>
                            <th>V</th><th>N</th><th>D</th>
                            <th>BP</th><th>BC</th><th>Diff</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="card">❌ Impossible de charger le classement<br>
            <small style="color:#888">${error.message}</small></div>
        `;
    }
}

// ===================================================================
// MATCHS — affichage filtré par niveau
// ===================================================================
async function afficherMatchs(title, subtitle, content) {
    title.textContent    = "Matchs";
    subtitle.textContent = "Gestion des matchs";

    const niveaux = getNiveauxDisponibles();
    const optionsNiveau = niveaux.map(([id, nom]) =>
        `<option value="${id}">${nom}</option>`
    ).join("");

    content.innerHTML = `
        <div class="page-actions" style="gap:12px;">
            <select id="matchs-niveau" class="niveau-select" onchange="rafraichirMatchs()">
                ${optionsNiveau}
            </select>
            <button class="action-btn" onclick="ouvrirModalMatch()">➕ Créer un match</button>
        </div>
        <div id="matchs-contenu">
            <div class="card"><p>Chargement...</p></div>
        </div>
    `;

    await chargerTableauMatchs();
}

async function rafraichirMatchs() {
    await chargerTableauMatchs();
}

async function chargerTableauMatchs() {
    const select    = document.getElementById("matchs-niveau");
    const container = document.getElementById("matchs-contenu");
    if (!select || !container) return;

    const idNiveau = parseInt(select.value);

    // Map id_equipe → club, pour les équipes du niveau sélectionné
    const equipeToClub = {};
    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            if (equipe.idNiveau === idNiveau) {
                equipeToClub[equipe.id] = club.nom;
            }
        });
    });

    const equipesNiveau = new Set(Object.keys(equipeToClub).map(Number));

    try {
        const matchs = await api("/matchs?select=*&order=id_match.desc");

        // Filtre : au moins une des deux équipes appartient au niveau
        const filtres = matchs.filter(m =>
            equipesNiveau.has(m.equipe_domicile) || equipesNiveau.has(m.equipe_exterieur)
        );

        if (filtres.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <h3>Aucun match</h3>
                    <p>Aucun match enregistré pour ce niveau.</p>
                </div>
            `;
            return;
        }

        const rows = filtres.map(match => {
            const dom = equipeToClub[match.equipe_domicile] || "-";
            const ext = equipeToClub[match.equipe_exterieur] || "-";
            const domWin = match.score_domicile > match.score_exterieur;
            const extWin = match.score_exterieur > match.score_domicile;
            return `
                <tr>
                    <td style="font-weight:${domWin ? "800" : "500"};color:${domWin ? "white" : "#94a3b8"}">${dom}</td>
                    <td class="score-cell">
                        ${match.score_domicile}<span class="score-sep">—</span>${match.score_exterieur}
                    </td>
                    <td style="font-weight:${extWin ? "800" : "500"};color:${extWin ? "white" : "#94a3b8"};text-align:right">${ext}</td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr><th>Domicile</th><th>Score</th><th>Extérieur</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="card">❌ Impossible de charger les matchs<br>
            <small style="color:#888">${error.message}</small></div>
        `;
    }
}

// ===================================================================
// MODAL MATCH
// ===================================================================
function ouvrirModalMatch() {
    document.getElementById("modal-match").style.display = "flex";
    chargerNiveauxMatch();
}

function fermerModalMatch() {
    document.getElementById("modal-match").style.display = "none";
}

function chargerNiveauxMatch() {
    const niveauSelect = document.getElementById("niveau");
    const niveaux = getNiveauxDisponibles();

    niveauSelect.innerHTML = niveaux.map(([id, nom]) =>
        `<option value="${id}">${nom}</option>`
    ).join("");

    chargerEquipesMatch();
}

function chargerEquipesMatch() {
    const idNiveau  = parseInt(document.getElementById("niveau").value);
    const domicile  = document.getElementById("domicile");
    const exterieur = document.getElementById("exterieur");

    const options = data.clubs.flatMap(club =>
        club.equipes
            .filter(equipe => equipe.idNiveau === idNiveau)
            .map(equipe => `<option value="${equipe.id}">${club.nom}</option>`)
    ).join("");

    domicile.innerHTML  = options;
    exterieur.innerHTML = options;
}

async function ajouterMatch() {
    const equipe_domicile  = parseInt(document.getElementById("domicile").value);
    const equipe_exterieur = parseInt(document.getElementById("exterieur").value);
    const score_domicile   = parseInt(document.getElementById("scoreDom").value);
    const score_exterieur  = parseInt(document.getElementById("scoreExt").value);

    if (isNaN(equipe_domicile) || isNaN(equipe_exterieur)) {
        alert("Veuillez sélectionner les deux équipes.");
        return;
    }
    if (isNaN(score_domicile) || isNaN(score_exterieur)) {
        alert("Veuillez saisir les scores.");
        return;
    }
    if (equipe_domicile === equipe_exterieur) {
        alert("Les équipes doivent être différentes.");
        return;
    }

    try {
        await api("/matchs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                equipe_domicile,
                equipe_exterieur,
                score_domicile,
                score_exterieur,
                date_match: new Date().toISOString().split("T")[0]
            })
        });

        fermerModalMatch();
        await chargerDonnees();
        // Rafraîchit le tableau du niveau actuellement sélectionné dans matchs
        await chargerTableauMatchs();
        // Met aussi à jour le classement si visible
        if (document.getElementById("classement-contenu")) {
            await chargerTableauClassement();
        }
    } catch (error) {
        console.error(error);
        alert("Erreur ajout match : " + error.message);
    }
}

// ===================================================================
// API — CLUBS
// ===================================================================
function ouvrirModalClub() {
    document.getElementById("modal-club").classList.remove("hidden");
}

function fermerModalClub() {
    document.getElementById("modal-club").classList.add("hidden");
}

async function creerClub() {
    const nom         = document.getElementById("club-nom").value.trim();
    const dateCreation = document.getElementById("club-date").value;

    if (!nom || !dateCreation) {
        afficherErreurModal("Veuillez remplir tous les champs.");
        return;
    }

    try {
        await api("/club", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom_club: nom, date_creation: dateCreation })
        });

        document.getElementById("club-nom").value  = "";
        document.getElementById("club-date").value = "";
        fermerModalClub();
        await rafraichir("clubs");
    } catch (error) {
        console.error(error);
        afficherErreurModal("Erreur création club.");
    }
}

async function supprimerClub(nom) {
    if (!confirm(`Supprimer le club "${nom}" ?`)) return;

    const club = data.clubs.find(c => c.nom === nom);
    if (!club) { alert("Club introuvable"); return; }

    try {
        // Supprimer joueurs → équipes → club (ordre respecté pour les FK)
        await api(`/joueurs?id_club=eq.${club.id}`, { method: "DELETE" });
        await api(`/equipe?id_club=eq.${club.id}`,  { method: "DELETE" });
        await api(`/club?id_club=eq.${club.id}`,    { method: "DELETE" });
        await rafraichir("clubs");
    } catch (error) {
        console.error(error);
        alert("Erreur suppression club.");
    }
}

// ===================================================================
// API — EQUIPES
// ===================================================================
function creerEquipe() {
    const select = document.getElementById("equipe-club");
    select.innerHTML = data.clubs.map(club =>
        `<option value="${club.id}">${club.nom}</option>`
    ).join("");
    document.getElementById("modal-equipe").classList.remove("hidden");
}

function fermerModalEquipe() {
    document.getElementById("modal-equipe").classList.add("hidden");
}

async function creerNouvelleEquipe() {
    const clubId = document.getElementById("equipe-club").value;
    const niveau = document.getElementById("equipe-niveau").value;
    const nom    = document.getElementById("entraineur-nom").value.trim();
    const prenom = document.getElementById("entraineur-prenom").value.trim();

    if (!clubId || !niveau || !nom || !prenom) {
        afficherErreurModal("Veuillez remplir tous les champs.");
        return;
    }

    try {
        const nouvelId = Math.floor(1000 + Math.random() * 900000);

        await api("/personne", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_personne: nouvelId, nom, prenom })
        });

        await api("/entraineur", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_entraineur: nouvelId })
        });

        await api("/equipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nom_equipe: `Equipe ${NIVEAUX[niveau] || niveau}`,
                id_niveau: Number(niveau),
                id_club: Number(clubId),
                id_entraineur: nouvelId
            })
        });

        fermerModalEquipe();
        await rafraichir("equipes");
    } catch (error) {
        console.error(error);
        afficherErreurModal("Erreur création équipe.");
    }
}

async function supprimerEquipe(idEquipe) {
    if (!confirm("Supprimer cette équipe ?")) return;

    try {
        await api(`/joueurs?id_equipe=eq.${idEquipe}`, { method: "DELETE" });
        await api(`/equipe?id_equipe=eq.${idEquipe}`,  { method: "DELETE" });
        await rafraichir("equipes");
    } catch (error) {
        console.error(error);
        alert("Erreur suppression équipe.");
    }
}

// ===================================================================
// API — JOUEURS
// ===================================================================
function ajouterJoueur() {
    const selectClub   = document.getElementById("joueur-club");
    const selectEquipe = document.getElementById("joueur-equipe");

    selectClub.innerHTML = data.clubs.map(club =>
        `<option value="${club.nom}">${club.nom}</option>`
    ).join("");
    selectEquipe.innerHTML = "";

    chargerEquipesPourJoueur();
    document.getElementById("modal-joueur").classList.remove("hidden");
}

function fermerModalJoueur() {
    document.getElementById("modal-joueur").classList.add("hidden");
}

function chargerEquipesPourJoueur() {
    const clubNom     = document.getElementById("joueur-club").value;
    const selectEquipe = document.getElementById("joueur-equipe");
    const club        = data.clubs.find(c => c.nom === clubNom);

    selectEquipe.innerHTML = (club?.equipes || []).map(equipe =>
        `<option value="${equipe.niveau}">${equipe.niveau}</option>`
    ).join("");
}

async function soumettreAjoutJoueur() {
    const clubNom      = document.getElementById("joueur-club").value;
    const niveau       = document.getElementById("joueur-equipe").value;
    const nom          = document.getElementById("joueur-nom").value.trim();
    const prenom       = document.getElementById("joueur-prenom").value.trim();
    const dateNaissance = document.getElementById("joueur-date-naissance").value;
    const poste        = document.getElementById("joueur-poste").value;
    const prix         = document.getElementById("joueur-prix").value;
    const titulaire    = document.getElementById("joueur-titulaire").checked;

    const club   = data.clubs.find(c => c.nom === clubNom);
    const equipe = club?.equipes.find(e => e.niveau === niveau);

    if (!club)   { alert("Club introuvable");   return; }
    if (!equipe) { alert("Équipe introuvable"); return; }
    if (!nom || !prenom || !dateNaissance || !poste || !prix) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    try {
        const nouvelId = Math.floor(1000 + Math.random() * 900000);

        await api("/personne", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_personne: nouvelId, nom, prenom })
        });

        await api("/joueurs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_joueur: nouvelId,
                prix: Number(prix),
                date_naissance: dateNaissance,
                titulaire,
                id_poste: Number(poste),
                id_club: Number(club.id),
                id_equipe: Number(equipe.id)
            })
        });

        fermerModalJoueur();
        await rafraichir("joueurs");
    } catch (error) {
        console.error(error);
        alert("Erreur ajout joueur : " + error.message);
    }
}

async function supprimerJoueur(idJoueur) {
    if (!confirm("Supprimer ce joueur ?")) return;

    try {
        await api(`/joueurs?id_joueur=eq.${idJoueur}`,  { method: "DELETE" });
        await api(`/personne?id_personne=eq.${idJoueur}`, { method: "DELETE" });
        await rafraichir("joueurs");
    } catch (error) {
        console.error(error);
        alert("Erreur suppression joueur.");
    }
}

// ===================================================================
// PRÉSENTATION JOUEUR
// ===================================================================
function afficherPresentationJoueur(joueur) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>⚽ Présentation du joueur</h2>
                <button class="modal-close">✕</button>
            </div>
            <div class="modal-body">
                <div class="player-profile">
                    <div class="player-details">
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
            </div>
            <div class="modal-footer">
                <button class="action-btn secondary-btn">Fermer</button>
            </div>
        </div>
    `;

    modal.querySelectorAll(".modal-close, .secondary-btn, .modal-overlay")
        .forEach(btn => btn.addEventListener("click", () => modal.remove()));

    document.body.appendChild(modal);
}

// ===================================================================
// ERREUR MODALE
// ===================================================================
function afficherErreurModal(message) {
    let zone = document.getElementById("modal-error");
    if (!zone) {
        zone = document.createElement("div");
        zone.id = "modal-error";
        zone.className = "modal-error";
        const body = document.querySelector("#modal-equipe .modal-body");
        if (body) body.prepend(zone);
    }
    zone.textContent = message;
}