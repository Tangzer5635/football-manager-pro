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

        const [clubsRes, equipesRes, joueursRes] =
            await Promise.all([

                fetch(
                    `${SUPABASE_URL}/club?select=*`,
                    {
                        headers: {
                            apikey: SUPABASE_API_KEY,
                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/equipe?select=*`,
                    {
                        headers: {
                            apikey: SUPABASE_API_KEY,
                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                ),

                fetch(
                    `${SUPABASE_URL}/joueurs?select=*`,
                    {
                        headers: {
                            apikey: SUPABASE_API_KEY,
                            Authorization:
                                `Bearer ${SUPABASE_API_KEY}`
                        }
                    }
                )
            ]);

        const clubs = await clubsRes.json();
        const equipes = await equipesRes.json();
        const joueurs = await joueursRes.json();

        data = {
            clubs: clubs.map(club => ({

                id: club.id_club,
                nom: club.nom_club,
                dateCreation: club.date_creation,

                equipes: equipes
                    .filter(
                        equipe =>
                            equipe.id_club === club.id_club
                    )
                    .map(equipe => ({

                        id: equipe.id_equipe,
                        nom: equipe.nom_equipe,
                        niveau: equipe.id_niveau,
                        joueurs: joueurs.filter(
                            joueur =>
                                joueur.id_equipe ===
                                equipe.id_equipe
                        )
                    }))
            }))
        };

        console.log(data);

    } catch (error) {

        console.error(
            "Erreur chargement Supabase :",
            error
        );

        data = { clubs: [] };
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
            <button class="action-btn" onclick="creerClub()">
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
        <button class="action-btn" onclick="creerClub()">
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
                                onclick="supprimerEquipe(
                                    '${escapeJs(club.nom)}',
                                    '${escapeJs(equipe.niveau)}'
                                )">
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
                    nom: joueur.nom,
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
                                    onclick="supprimerJoueur(
                                        '${escapeJs(club.nom)}',
                                        '${escapeJs(equipe.niveau)}',
                                        '${escapeJs(joueur.nom)}',
                                        '${escapeJs(joueur.prenom)}'
                                    )">
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
    const nom = prompt("Nom du club :");
    if (!nom) return;

    const dateCreation = prompt(
        "Date de création (AAAA-MM-JJ) :",
        new Date().toISOString().split("T")[0]
    );
    if (!dateCreation) return;

    await postForm("http://localhost:8080/clubs", {
        nom,
        dateCreation
    });

    await rafraichir("clubs");
}

async function supprimerClub(nom) {
    if (!confirm(`Supprimer le club "${nom}" ?`)) {
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/clubs", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: toForm({ nom })
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression du club.");
        }

        await rafraichir("clubs");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ===================================================================
// API - EQUIPES
// ===================================================================
async function creerEquipe() {
    if (!data.clubs || data.clubs.length === 0) {
        afficherErreurModal("Aucun club disponible.");
        return;
    }

    const selectClub =
        document.getElementById("equipe-club");

    selectClub.innerHTML = "";

    data.clubs.forEach(club => {
        const option = document.createElement("option");
        option.value = club.nom;
        option.textContent = club.nom;
        selectClub.appendChild(option);
    });

    document.getElementById("equipe-niveau").value =
        "LIGUE_1";

    document.getElementById("entraineur-nom").value = "";
    document.getElementById("entraineur-prenom").value = "";

    // Supprime les anciens messages d'erreur
    const ancienneErreur =
        document.getElementById("modal-error");

    if (ancienneErreur) {
        ancienneErreur.remove();
    }

    document.getElementById("modal-equipe")
        .classList.remove("hidden");
}

async function supprimerEquipe(clubNom, niveau) {
    if (!confirm(`Supprimer l'équipe ${niveau} ?`)) return;

    await deleteForm("http://localhost:8080/equipes", {
        clubNom,
        niveau
    });

    await rafraichir("equipes");
}

// ===================================================================
// API - JOUEURS
// ===================================================================
async function ajouterJoueur() {
    if (!data.clubs || data.clubs.length === 0) {
        alert("Aucun club disponible.");
        return;
    }

    const prixInput = document.getElementById("joueur-prix");

    let preview = document.getElementById("prix-preview");

    if (!preview) {
        preview = document.createElement("div");
        preview.id = "prix-preview";
        preview.className = "prix-preview";

        prixInput.insertAdjacentElement("afterend", preview);
    }

    prixInput.addEventListener("input", mettreAJourApercuPrix);
    mettreAJourApercuPrix();

    const selectClub = document.getElementById("joueur-club");
    selectClub.innerHTML = "";

    data.clubs.forEach(club => {
        const option = document.createElement("option");
        option.value = club.nom;
        option.textContent = club.nom;
        selectClub.appendChild(option);
    });

    // Charge les équipes du premier club
    chargerEquipesPourJoueur();

    // Valeurs par défaut
    document.getElementById("joueur-nom").value = "";
    document.getElementById("joueur-prenom").value = "";
    document.getElementById("joueur-date-naissance").value = "2000-01-01";
    document.getElementById("joueur-poste").value = "ATTAQUANT";
    document.getElementById("joueur-prix").value = 100000;
    document.getElementById("joueur-titulaire").checked = false;

    // Affiche le modal
    document.getElementById("modal-joueur").classList.remove("hidden");
}

async function supprimerJoueur(clubNom, niveau, nom, prenom, age) {
    if (!confirm(`Supprimer ${prenom} ${nom} ?`)) return;

    await deleteForm("http://localhost:8080/joueurs", {
        clubNom,
        niveau,
        nom,
        prenom,
        age
    });

    await rafraichir("joueurs");
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

async function soumettreCreationEquipe() {
    const clubNom =
        document.getElementById("equipe-club").value;

    const niveau =
        document.getElementById("equipe-niveau").value;

    const nom =
        document.getElementById("entraineur-nom").value.trim();

    const prenom =
        document.getElementById("entraineur-prenom").value.trim();

    // Vérifications
    if (!clubNom || !niveau || !nom || !prenom) {
        afficherErreurModal(
            "Veuillez remplir tous les champs."
        );
        return;
    }

    // Vérifier si le club existe
    const club = data.clubs.find(c => c.nom === clubNom);

    if (!club) {
        afficherErreurModal(
            "Le club sélectionné est introuvable."
        );
        return;
    }

    // Empêcher la création d'une équipe avec le même niveau
    const equipeExiste = club.equipes.some(
        e =>
            e.niveau === niveau ||
            e.niveau === niveau.replace("LIGUE_", "L")
    );

    if (equipeExiste) {
        afficherErreurModal(
            `Une équipe de niveau ${niveau} existe déjà dans ce club.`
        );
        return;
    }

    try {
        await postForm("http://localhost:8080/equipes", {
            clubNom,
            niveau,
            nom,
            prenom
        });

        // Ferme le modal
        fermerModalEquipe();

        // Recharge les données
        await rafraichir("equipes");

    } catch (error) {
        console.error(error);

        afficherErreurModal(
            error.message || "Erreur lors de la création."
        );
    }
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
        document.getElementById("joueur-club").value;

    const niveau =
        document.getElementById("joueur-equipe").value;

    const nom =
        document.getElementById("joueur-nom").value.trim();

    const prenom =
        document.getElementById("joueur-prenom").value.trim();

    const dateNaissance =
        document.getElementById("joueur-date-naissance").value;

    const poste =
        document.getElementById("joueur-poste").value;

    const prix =
        document.getElementById("joueur-prix").value;

    const titulaire =
        document.getElementById("joueur-titulaire").checked;

    if (!clubNom || !niveau || !nom || !prenom || !dateNaissance) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    // ======================================================
    // CALCUL AUTOMATIQUE DE L'ÂGE
    // ======================================================
    const naissance = new Date(dateNaissance);
    const aujourdHui = new Date();

    let age = aujourdHui.getFullYear() - naissance.getFullYear();

    const mois = aujourdHui.getMonth() - naissance.getMonth();

    if (
        mois < 0 ||
        (mois === 0 &&
            aujourdHui.getDate() < naissance.getDate())
    ) {
        age--;
    }

    try {
        await postForm("http://localhost:8080/joueurs", {
            clubNom,
            niveau,
            nom,
            prenom,
            dateNaissance,
            age,          // <-- âge envoyé au backend
            poste,
            prix,
            titulaire
        });

        fermerModalJoueur();
        await rafraichir("joueurs");
    } catch (error) {
        console.error(error);
        alert(error.message);
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

// Met à jour l'affichage sous le champ Prix
function mettreAJourApercuPrix() {
    const input = document.getElementById("joueur-prix");
    const preview = document.getElementById("prix-preview");

    if (!input || !preview) {
        return;
    }

    preview.textContent = formatPrixInput(input.value);
}