// ===================================================================
// app.js - Version complète avec API Java
// Fonctionnalités :
// - Affichage dashboard
// - Liste des clubs, équipes, joueurs, titulaires
// - Création de clubs
// - Création d'équipes
// - Ajout de joueurs
// - Suppression de clubs, équipes et joueurs
// ===================================================================

let data = {clubs: []};

// ===================================================================
// CHARGEMENT DES DONNÉES
// ===================================================================
const SUPABASE_URL =
    "https://zqavhuzfgzkimduzabbz.supabase.co/rest/v1";

const SUPABASE_API_KEY =
    "sb_publishable_qCzHEqb9ulwCVpy_jZ-DQQ_OsGW5lcT";


async function chargerDonnees() {

    try {

        const [
            clubsRes,
            equipesRes,
            personnesRes,
            entraineursRes,
            joueursRes
        ] =
            await Promise.all([

                fetch(
                    `${SUPABASE_URL}/club?select=*`,
                    {
                        headers: {
                            apikey:
                            SUPABASE_API_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/equipe?select=*`,
                    {
                        headers: {
                            apikey:
                            SUPABASE_API_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/personne?select=*`,
                    {
                        headers: {
                            apikey:
                            SUPABASE_API_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/entraineur?select=*`,
                    {
                        headers: {
                            apikey:
                            SUPABASE_API_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/joueurs?select=*`,
                    {
                        headers: {
                            apikey:
                            SUPABASE_API_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                )
            ]);

        const clubs =
            await clubsRes.json();

        const equipes =
            await equipesRes.json();

        const personnes =
            await personnesRes.json();

        const entraineurs =
            await entraineursRes.json();

        const joueurs =
            await joueursRes.json();

        data = {
            clubs: clubs.map(club => ({

                id:
                club.id_club,

                nom:
                club.nom_club,

                dateCreation:
                club.date_creation,

                equipes:
                    equipes

                        .filter(
                            equipe =>
                                equipe.id_club ===
                                club.id_club
                        )

                        .map(equipe => {

                            const entraineur =
                                entraineurs.find(
                                    e =>
                                        e.id_entraineur ===
                                        equipe.id_entraineur
                                );

                            const personneCoach =
                                personnes.find(
                                    p =>
                                        p.id_personne ===
                                        entraineur?.id_entraineur
                                );

                            return {

                                id:
                                equipe.id_equipe,

                                nom:
                                equipe.nom_equipe,

                                niveau:
                                    {
                                        1: "Ligue 1",
                                        2: "Ligue 2",
                                        3: "Ligue 3",
                                        4: "National",
                                        5: "National 2",
                                        6: "National 3"
                                    }[equipe.id_niveau]
                                    || "Inconnu",

                                entraineur:
                                    personneCoach
                                        ? `${personneCoach.prenom} ${personneCoach.nom}`
                                        : "-",

                                joueurs:
                                    joueurs

                                        .filter(
                                            joueur =>
                                                joueur.id_equipe ===
                                                equipe.id_equipe
                                        )

                                        .map(joueur => {

                                            const personne =
                                                personnes.find(
                                                    p =>
                                                        p.id_personne ===
                                                        joueur.id_joueur
                                                );

                                            const naissance =
                                                new Date(
                                                    joueur.date_naissance
                                                );

                                            const age =
                                                new Date().getFullYear()
                                                -
                                                naissance.getFullYear();

                                            return {

                                                id:
                                                joueur.id_joueur,

                                                nom:
                                                    personne?.nom || "-",

                                                prenom:
                                                    personne?.prenom || "-",

                                                age:
                                                age,

                                                poste:
                                                    {
                                                        1: "Gardien",
                                                        2: "Défenseur",
                                                        3: "Milieu",
                                                        4: "Attaquant"
                                                    }[joueur.id_poste]
                                                    || "-",

                                                prix:
                                                joueur.prix,

                                                titulaire:
                                                joueur.titulaire
                                            };
                                        })
                            };
                        })
            }))
        };

    } catch (error) {

        console.error(
            "Erreur chargement données :",
            error
        );

        data = {
            clubs: []
        };
    }
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
    const title = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");
    const content = document.getElementById("page-content");

    switch (page) {
        case "dashboard":
            afficherDashboard(title, subtitle, content);
            break;
        case "clubs":
            afficherClubs(title, subtitle, content);
            break;
        case "equipes":
            afficherEquipes(title, subtitle, content);
            break;
        case "joueurs":
            afficherJoueurs(title, subtitle, content);
            break;
        case "titulaires":
            afficherTitulaires(title, subtitle, content);
            break;
    }
}

// ===================================================================
// DASHBOARD
// ===================================================================
function afficherDashboard(title, subtitle, content) {
    const nbClubs = data.clubs.length;

    let nbEquipes = 0;
    let nbJoueurs = 0;
    let nbTitulaires = 0;

    data.clubs.forEach(club => {
        nbEquipes += club.equipes.length;

        club.equipes.forEach(equipe => {
            nbJoueurs += equipe.joueurs.length;

            equipe.joueurs.forEach(joueur => {
                if (joueur.titulaire) nbTitulaires++;
            });
        });
    });

    title.textContent = "Dashboard";
    subtitle.textContent = "Vue d'ensemble de votre club";

    content.innerHTML = `
    <div class="cards grid">
        <div class="card">
            <h3>🏟️ Clubs</h3>
            <p>${nbClubs} club(s)</p>
            <button class="action-btn" onclick="ouvrirModalClub()">
                ➕ Créer un club
            </button>
        </div>

        <div class="card">
            <h3>👥 Équipes</h3>
            <p>${nbEquipes} équipe(s)</p>
            <button class="action-btn" onclick="creerEquipe()">
                ➕ Créer une équipe
            </button>
        </div>

        <div class="card">
            <h3>⚽ Joueurs</h3>
            <p>${nbJoueurs} joueur(s)</p>
            <button class="action-btn" onclick="ajouterJoueur()">
                ➕ Ajouter un joueur
            </button>
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

    let rows = "";

    data.clubs.forEach((club, index) => {
        rows += `
            <tr>
                <td>${index + 1}</td>
                <td>${club.nom}</td>
                <td>${formatDate(club.dateCreation)}</td>
                <td>${club.equipes.length}</td>
                <td>
                    <button class="action-btn danger-btn"
                            onclick="supprimerClub('${escapeJs(club.nom)}')">
                        🗑️ Supprimer
                    </button>
                </td>
            </tr>
        `;
    });

    content.innerHTML = `
    <div class="page-actions">
        <button class="action-btn" onclick="ouvrirModalClub()">
            ➕ Créer un club
        </button>
    </div>

    ${
        rows === ""
            ? `
                <div class="card">
                    <h3>Aucun club</h3>
                    <p>Aucun club trouvé.</p>
                </div>
            `
            : `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nom</th>
                                <th>Date de création</th>
                                <th>Équipes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `
    }
`;
}

// ===================================================================
// EQUIPES
// ===================================================================
function afficherEquipes(title, subtitle, content) {
    title.textContent = "Équipes";
    subtitle.textContent = "Gestion des équipes";

    let rows = "";
    let index = 1;

    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            rows += `
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
            `;
        });
    });

    content.innerHTML = `
    <div class="page-actions">
        <button class="action-btn" onclick="creerEquipe()">
            ➕ Créer une équipe
        </button>
    </div>

    ${
        rows === ""
            ? `
                <div class="card">
                    <h3>Aucune équipe</h3>
                    <p>Aucune équipe trouvée.</p>
                </div>
            `
            : `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Club</th>
                                <th>Niveau</th>
                                <th>Entraîneur</th>
                                <th>Joueurs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `
    }
`;
}

// ===================================================================
// JOUEURS
// ===================================================================
function afficherJoueurs(title, subtitle, content) {
    title.textContent = "Joueurs";
    subtitle.textContent = "Gestion des joueurs";

    let cards = "";

    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            equipe.joueurs.forEach(joueur => {

                // Si l'âge n'est pas présent dans le JSON,
                // on le calcule à partir de dateNaissance
                let age = joueur.age;

                if (
                    (age === undefined || age === null || age === "") &&
                    joueur.dateNaissance
                ) {
                    const naissance = new Date(joueur.dateNaissance);
                    const aujourdHui = new Date();

                    age =
                        aujourdHui.getFullYear() -
                        naissance.getFullYear();

                    const mois =
                        aujourdHui.getMonth() -
                        naissance.getMonth();

                    if (
                        mois < 0 ||
                        (mois === 0 &&
                            aujourdHui.getDate() <
                            naissance.getDate())
                    ) {
                        age--;
                    }
                }

                // Objet complet envoyé à la modale
                const joueurData = {
                    nom: onclick = "supprimerJoueur(${joueur.id})",
                    prenom: joueur.prenom,
                    age: joueur.age ?? calculerAge(joueur.dateNaissance),
                    poste: joueur.poste,
                    prix: formatPrix(joueur.prix),
                    titulaire: joueur.titulaire,
                    club: club.nom,
                    niveau: equipe.niveau,
                    dateNaissance: joueur.dateNaissance
                };

                cards += `
                    <div class="card">
                        <h3>⚽ ${joueur.prenom} ${joueur.nom}</h3>

                        <div style="margin-top: 20px;">
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
            });
        });
    });

    content.innerHTML = `
        <div class="page-actions">
            <button class="action-btn" onclick="ajouterJoueur()">
                ➕ Ajouter un joueur
            </button>
        </div>

        ${
        cards === ""
            ? `
                    <div class="card">
                        <h3>Aucun joueur</h3>
                        <p>Aucun joueur trouvé.</p>
                    </div>
                `
            : `
                    <div class="cards grid">
                        ${cards}
                    </div>
                `
    }
    `;
}

function formatPrix(prix) {
    prix = Number(prix);

    if (prix >= 1_000_000_000) {
        const milliards = prix / 1_000_000_000;
        return Number.isInteger(milliards)
            ? `${milliards} Md€`
            : `${milliards.toFixed(1)} Md€`;
    }

    if (prix >= 1_000_000) {
        const millions = prix / 1_000_000;
        return Number.isInteger(millions)
            ? `${millions}M€`
            : `${millions.toFixed(1)}M€`;
    }

    if (prix >= 1_000) {
        const milliers = prix / 1_000;
        return Number.isInteger(milliers)
            ? `${milliers}k€`
            : `${milliers.toFixed(1)}k€`;
    }

    return `${prix}€`;
}

// ===================================================================
// TITULAIRES
// ===================================================================
function afficherTitulaires(title, subtitle, content) {
    title.textContent = "Titulaires";
    subtitle.textContent = "Recherche des joueurs titulaires par équipe";

    // Liste de toutes les équipes
    let options = '<option value="">Toutes les équipes</option>';

    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            const valeur = `${club.nom}|${equipe.niveau}`;
            const label = `${club.nom} - ${equipe.niveau}`;

            options += `
                <option value="${escapeJs(valeur)}">
                    ${label}
                </option>
            `;
        });
    });

    content.innerHTML = `
        <div class="card">
            <div class="form-group">
                <label for="filtre-equipe">
                    Rechercher les titulaires par équipe
                </label>

                <select id="filtre-equipe"
                        onchange="filtrerTitulairesParEquipe()">
                    ${options}
                </select>
            </div>
        </div>

        <div id="titulaires-resultats" class="cards grid"></div>
    `;

    // Affiche tous les titulaires au chargement
    filtrerTitulairesParEquipe();
}

// ===================================================================
// AJOUTE CETTE FONCTION dans app.js
// ===================================================================
function filtrerTitulairesParEquipe() {
    const select = document.getElementById("filtre-equipe");
    const container = document.getElementById("titulaires-resultats");

    if (!select || !container) {
        return;
    }

    const filtre = select.value;
    let cards = "";

    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {

            // Filtre sur l'équipe sélectionnée
            if (filtre) {
                const valeur = `${club.nom}|${equipe.niveau}`;

                if (valeur !== filtre) {
                    return;
                }
            }

            // Récupère uniquement les titulaires
            const titulaires = equipe.joueurs.filter(
                joueur => joueur.titulaire === true
            );

            if (titulaires.length === 0) {
                return;
            }

            const liste = titulaires.map(joueur => {
                const age =
                    joueur.age ??
                    (joueur.dateNaissance
                        ? calculerAge(joueur.dateNaissance)
                        : "?");

                return `
                    <p>
                        ⚽ <strong>${joueur.prenom} ${joueur.nom}</strong><br>
                        ${joueur.poste} • ${age} ans • ${formatPrix(joueur.prix)}
                    </p>
                `;
            }).join("");

            cards += `
                <div class="card">
                    <h3>🏟️ ${club.nom}</h3>
                    <p><strong>Niveau :</strong> ${equipe.niveau}</p>
                    <div style="margin-top: 12px;">
                        ${liste}
                    </div>
                </div>
            `;
        });
    });

    if (cards === "") {
        container.innerHTML = `
            <div class="card">
                <h3>Aucun titulaire</h3>
                <p>Aucun joueur titulaire trouvé pour cette équipe.</p>
            </div>
        `;
    } else {
        container.innerHTML = cards;
    }
}

// ===================================================================
// API - CLUBS
// ===================================================================
async function creerClub() {

    const nom = document
        .getElementById("club-nom")
        .value
        .trim();

    const dateCreation = document
        .getElementById("club-date")
        .value;

    if (!nom || !dateCreation) {

        afficherErreurModal(
            "Veuillez remplir tous les champs."
        );

        return;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/club`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    nom_club: nom,

                    date_creation: dateCreation
                })
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            afficherErreurModal(
                "Erreur création club."
            );

            return;
        }

        document.getElementById(
            "club-nom"
        ).value = "";

        document.getElementById(
            "club-date"
        ).value = "";
        fermerModalClub();
        await chargerDonnees();

        showPage("clubs");

    } catch (error) {

        console.error(error);

        afficherErreurModal(
            "Erreur création club."
        );
    }
}

async function supprimerClub(nom) {

    if (!confirm(`Supprimer le club "${nom}" ?`)) {
        return;
    }

    const club = data.clubs.find(
        c => c.nom === nom
    );

    if (!club) {
        alert("Club introuvable");
        return;
    }

    try {

        // =========================
        // Supprimer joueurs
        // =========================
        await fetch(
            `${SUPABASE_URL}/joueurs?id_club=eq.${club.id}`,
            {
                method: "DELETE",

                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        // =========================
        // Supprimer équipes
        // =========================
        await fetch(
            `${SUPABASE_URL}/equipe?id_club=eq.${club.id}`,
            {
                method: "DELETE",

                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        // =========================
        // Supprimer club
        // =========================
        const response = await fetch(
            `${SUPABASE_URL}/club?id_club=eq.${club.id}`,
            {
                method: "DELETE",

                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            alert(
                "Erreur suppression club."
            );

            return;
        }

        await rafraichir("clubs");

    } catch (error) {

        console.error(error);

        alert(
            "Erreur suppression."
        );
    }
}

function ouvrirModalClub() {

    document
        .getElementById("modal-club")
        .classList.remove("hidden");
}

function fermerModalClub() {

    document
        .getElementById("modal-club")
        .classList.add("hidden");
}

// ===================================================================
// API - EQUIPES
// ===================================================================
function creerEquipe() {

    const select =
        document.getElementById(
            "equipe-club"
        );

    select.innerHTML = "";

    data.clubs.forEach(club => {

        const option =
            document.createElement("option");

        option.value = club.id;

        option.textContent = club.nom;

        select.appendChild(option);
    });

    document
        .getElementById("modal-equipe")
        .classList.remove("hidden");
}

async function supprimerEquipe(idEquipe) {

    if (!confirm("Supprimer cette équipe ?")) {
        return;
    }

    try {

        // Supprimer joueurs liés
        await fetch(
            `${SUPABASE_URL}/joueurs?id_equipe=eq.${idEquipe}`,
            {
                method: "DELETE",

                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        // Supprimer équipe
        const response = await fetch(
            `${SUPABASE_URL}/equipe?id_equipe=eq.${idEquipe}`,
            {
                method: "DELETE",

                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            alert(
                "Erreur suppression équipe."
            );

            return;
        }

        await rafraichir("equipes");

    } catch (error) {

        console.error(error);

        alert(
            "Erreur suppression équipe."
        );
    }
}

function remplirSelectClubsEquipe() {

    const select =
        document.getElementById(
            "equipe-club"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    data.clubs.forEach(club => {

        const option =
            document.createElement("option");

        option.value = club.nom;

        option.textContent = club.nom;

        select.appendChild(option);
    });
}

async function creerNouvelleEquipe() {

    const clubId =
        document.getElementById(
            "equipe-club"
        ).value;

    const niveau =
        document.getElementById(
            "equipe-niveau"
        ).value;

    const nom =
        document.getElementById(
            "entraineur-nom"
        ).value.trim();

    const prenom =
        document.getElementById(
            "entraineur-prenom"
        ).value.trim();

    if (
        !clubId ||
        !niveau ||
        !nom ||
        !prenom
    ) {
        alert(
            "Veuillez remplir tous les champs."
        );
        return;
    }

    try {

        // =====================================
        // Génération ID personne
        // =====================================
        const personnesRes = await fetch(
            `${SUPABASE_URL}/personne?select=id_personne`,
            {
                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        const personnes =
            await personnesRes.json();

        const nouvelId =
            Math.floor(
                1000 +
                Math.random() * 900000
            );

// Création personne
        await fetch(
            `${SUPABASE_URL}/personne`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    id_personne:
                    nouvelId,

                    nom:
                    nom,

                    prenom:
                    prenom
                })
            }
        );

        // =====================================
        // Création ENTRAINEUR
        // =====================================
        await fetch(
            `${SUPABASE_URL}/entraineur`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    id_entraineur:
                    nouvelId
                })
            }
        );

        // =====================================
        // Création EQUIPE
        // =====================================
        const response = await fetch(
            `${SUPABASE_URL}/equipe`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    nom_equipe:
                        `Equipe ${niveau}`,

                    id_niveau:
                        Number(niveau),

                    id_club:
                        Number(clubId),

                    id_entraineur:
                    nouvelId
                })
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            alert(
                "Erreur création équipe."
            );

            return;
        }

        fermerModalEquipe();

        await chargerDonnees();

        showPage("equipes");

    } catch (error) {

        console.error(error);

        alert(
            "Erreur création équipe."
        );
    }
}

// ===================================================================
// API - JOUEURS
// ===================================================================
function ajouterJoueur() {

    const selectClub =
        document.getElementById(
            "joueur-club"
        );

    const selectEquipe =
        document.getElementById(
            "joueur-equipe"
        );

    selectClub.innerHTML = "";
    selectEquipe.innerHTML = "";

    data.clubs.forEach(club => {

        const option =
            document.createElement("option");

        option.value = club.nom;

        option.textContent = club.nom;

        selectClub.appendChild(option);
    });

    // Charger équipes du premier club
    chargerEquipesPourJoueur();

    document
        .getElementById("modal-joueur")
        .classList.remove("hidden");
}

async function supprimerJoueur(idJoueur) {

    if (!confirm("Supprimer ce joueur ?")) {
        return;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/joueurs?id_joueur=eq.${idJoueur}`,
            {
                method: "DELETE",

                headers: {
                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            alert(
                "Erreur suppression joueur."
            );

            return;
        }

        await fetch(
            `${SUPABASE_URL}/personne?id_personne=eq.${idJoueur}`,
            {
                method: "DELETE",

                headers: {
                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );

        await chargerDonnees();

        showPage("joueurs");

    } catch (error) {

        console.error(error);

        alert(
            "Erreur suppression joueur."
        );
    }
}

// ===================================================================
// OUTILS HTTP
// ===================================================================
async function postForm(url, params) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: toForm(params)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.error || result.message || "Erreur API");
    }
}

async function deleteForm(url, params) {
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: toForm(params)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.error || result.message || "Erreur API");
    }
}

function toForm(params) {
    return Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
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
// UTILITAIRES
// ===================================================================
function afficherPresentationJoueur(joueur) {
    // Si l'âge n'existe pas dans le JSON, on le calcule ici
    let age = joueur.age;

    if (
        age === undefined ||
        age === null ||
        age === "" ||
        age === "undefined"
    ) {
        if (joueur.dateNaissance) {
            const naissance = new Date(joueur.dateNaissance);
            const aujourdHui = new Date();

            age =
                aujourdHui.getFullYear() -
                naissance.getFullYear();

            const mois =
                aujourdHui.getMonth() -
                naissance.getMonth();

            if (
                mois < 0 ||
                (mois === 0 &&
                    aujourdHui.getDate() <
                    naissance.getDate())
            ) {
                age--;
            }
        } else {
            age = "?";
        }
    }

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
                        <h3 class="player-name">
                            ${joueur.prenom} ${joueur.nom}
                        </h3>

                        <div class="player-info">
                            <p><strong>Âge :</strong> ${age} ans</p>
                            <p><strong>Poste :</strong> ${joueur.poste}</p>
                            <p><strong>Valeur :</strong> ${joueur.prix}</p>
                            <p><strong>Titulaire :</strong>
                                ${joueur.titulaire ? "⭐ Oui" : "Non"}
                            </p>
                            <p><strong>Club :</strong> ${joueur.club}</p>
                            <p><strong>Niveau :</strong> ${joueur.niveau}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="action-btn secondary-btn">
                    Fermer
                </button>
            </div>
        </div>
    `;

    // Fermeture
    const closeButtons = modal.querySelectorAll(
        ".modal-close, .secondary-btn, .modal-overlay"
    );

    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            modal.remove();
        });
    });

    document.body.appendChild(modal);
}

function formatDate(date) {
    if (!date) return "";

    const d = new Date(date);
    if (isNaN(d)) return date;

    return d.toLocaleDateString("fr-FR");
}

function escapeJs(str) {
    return String(str)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

function fermerModalEquipe() {
    document.getElementById("modal-equipe").classList.add("hidden");
}


function afficherErreurModal(message) {
    let zoneErreur = document.getElementById(
        "modal-error"
    );

    if (!zoneErreur) {
        zoneErreur = document.createElement("div");
        zoneErreur.id = "modal-error";
        zoneErreur.className = "modal-error";

        const modalBody = document.querySelector(
            "#modal-equipe .modal-body"
        );

        if (modalBody) {
            modalBody.prepend(zoneErreur);
        }
    }

    zoneErreur.textContent = message;
}

function chargerEquipesPourJoueur() {
    const clubNom =
        document.getElementById("joueur-club").value;

    const selectEquipe =
        document.getElementById("joueur-equipe");

    selectEquipe.innerHTML = "";

    const club = data.clubs.find(c => c.nom === clubNom);

    if (!club || !club.equipes || club.equipes.length === 0) {
        return;
    }

    club.equipes.forEach(equipe => {
        const option = document.createElement("option");
        option.value = equipe.niveau;
        option.textContent = equipe.niveau;
        selectEquipe.appendChild(option);
    });
}

function fermerModalJoueur() {
    document.getElementById("modal-joueur").classList.add("hidden");
}

async function soumettreAjoutJoueur() {

    const clubNom =
        document.getElementById(
            "joueur-club"
        ).value;

    const niveau =
        document.getElementById(
            "joueur-equipe"
        ).value;

    const nom =
        document.getElementById(
            "joueur-nom"
        ).value.trim();

    const prenom =
        document.getElementById(
            "joueur-prenom"
        ).value.trim();

    const dateNaissance =
        document.getElementById(
            "joueur-date-naissance"
        ).value;

    const poste =
        document.getElementById(
            "joueur-poste"
        ).value;

    const prix =
        document.getElementById(
            "joueur-prix"
        ).value;

    const titulaire =
        document.getElementById(
            "joueur-titulaire"
        ).checked;

    const club = data.clubs.find(
        c => c.nom === clubNom
    );

    if (!club) {
        alert("Club introuvable");
        return;
    }

    const equipe = club.equipes.find(
        e => e.niveau === niveau
    );

    if (!equipe) {
        alert("Équipe introuvable");
        return;
    }

    try {

        const nouvelId =
            Math.floor(
                1000 +
                Math.random() * 900000
            );

        // =========================
        // Création PERSONNE
        // =========================
        await fetch(
            `${SUPABASE_URL}/personne`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    id_personne:
                    nouvelId,

                    nom:
                    nom,

                    prenom:
                    prenom
                })
            }
        );

        // =========================
        // Création JOUEUR
        // =========================
        const response = await fetch(
            `${SUPABASE_URL}/joueurs`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    apikey:
                    SUPABASE_API_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_API_KEY}`
                },

                body: JSON.stringify({

                    id_joueur:
                    nouvelId,

                    prix:
                        Number(prix),

                    date_naissance:
                    dateNaissance,

                    titulaire:
                    titulaire,

                    id_poste:
                        Number(poste),

                    id_club:
                        Number(club.id),

                    id_equipe:
                        Number(equipe.id)
                })
            }
        );

        if (!response.ok) {

            console.log(
                await response.text()
            );

            alert(
                "Erreur création joueur."
            );

            return;
        }

        fermerModalJoueur();

        await chargerDonnees();

        showPage("joueurs");

    } catch (error) {

        console.error(error);

        alert(
            "Erreur ajout joueur."
        );
    }
}

function calculerAge(dateNaissance) {
    if (!dateNaissance) {
        return "?";
    }

    const naissance = new Date(dateNaissance);

    if (isNaN(naissance)) {
        return "?";
    }

    const aujourdHui = new Date();

    let age =
        aujourdHui.getFullYear() -
        naissance.getFullYear();

    const mois =
        aujourdHui.getMonth() -
        naissance.getMonth();

    if (
        mois < 0 ||
        (mois === 0 &&
            aujourdHui.getDate() < naissance.getDate())
    ) {
        age--;
    }

    return age;
}

function formatPrixInput(valeur) {
    const prix = Number(valeur);

    if (!prix || prix <= 0) {
        return "";
    }

    if (prix >= 1_000_000_000) {
        const md = prix / 1_000_000_000;
        return Number.isInteger(md)
            ? `${md} Md€`
            : `${md.toFixed(1)} Md€`;
    }

    if (prix >= 1_000_000) {
        const m = prix / 1_000_000;
        return Number.isInteger(m)
            ? `${m}M€`
            : `${m.toFixed(1)}M€`;
    }

    if (prix >= 1_000) {
        const k = prix / 1_000;
        return Number.isInteger(k)
            ? `${k}k€`
            : `${k.toFixed(1)}k€`;
    }

    return `${prix}€`;
}
