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
async function chargerDonnees() {
    try {
        const response = await fetch("http://localhost:8080/data");

        if (!response.ok) {
            throw new Error("Impossible de charger les données");
        }

        data = await response.json();
    } catch (error) {
        console.error(error);
        data = {clubs: []};
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
                const presentation =
                    `Je suis ${joueur.nom} ${joueur.prenom} ` +
                    `j'ai ${joueur.age ?? "?"} ans, ` +
                    `je joue ${joueur.poste}, ` +
                    `je coûte ${formatPrix(joueur.prix)} ` +
                    `et suis-je titulaire ? ${joueur.titulaire}`;

                cards += `
                    <div class="card">
                        <h3>⚽ ${joueur.prenom} ${joueur.nom}</h3>
                        <p><strong>Poste :</strong> ${joueur.poste}</p>
                        <p><strong>Valeur :</strong> ${formatPrix(joueur.prix)}</p>
                        <p><strong>Titulaire :</strong>
                            ${joueur.titulaire ? "⭐ Oui" : "Non"}
                        </p>
                        <p><strong>Club :</strong> ${club.nom}</p>
                        <p><strong>Niveau :</strong> ${equipe.niveau}</p>

                        <div style="margin-top: 15px;">
                            <button class="action-btn"
                                    onclick='afficherPresentationJoueur(${JSON.stringify(presentation)})'>
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

// ===================================================================
// TITULAIRES
// ===================================================================
function afficherTitulaires(title, subtitle, content) {
    title.textContent = "Titulaires";
    subtitle.textContent = "Liste des joueurs titulaires";

    let cards = "";

    data.clubs.forEach(club => {
        club.equipes.forEach(equipe => {
            equipe.joueurs.forEach(joueur => {
                if (!joueur.titulaire) return;

                cards += `
                    <div class="card">
                        <h3>⭐ ${joueur.prenom} ${joueur.nom}</h3>
                        <p><strong>Poste :</strong> ${joueur.poste}</p>
                        <p><strong>Valeur :</strong> ${formatPrix(joueur.prix)}</p>
                        <p><strong>Club :</strong> ${club.nom}</p>
                        <p><strong>Niveau :</strong> ${equipe.niveau}</p>
                    </div>
                `;
            });
        });
    });

    content.innerHTML = `
    ${
        cards === ""
            ? `
                <div class="card">
                    <h3>Aucun titulaire</h3>
                    <p>Aucun joueur titulaire trouvé.</p>
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
    if (!confirm(`Supprimer le club "${nom}" ?`)) return;

    await deleteForm("http://localhost:8080/clubs", {nom});

    await rafraichir("clubs");
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

async function supprimerJoueur(clubNom, niveau, nom, prenom) {
    if (!confirm(`Supprimer ${prenom} ${nom} ?`)) return;

    await deleteForm("http://localhost:8080/joueurs", {
        clubNom,
        niveau,
        nom,
        prenom
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
// ===================================================================
// Remplace ENTIEREMENT la fonction afficherPresentationJoueur()
// dans app.js par cette version HTML (sans alert)
// ===================================================================
function afficherPresentationJoueur(presentation) {
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
                <div class="card" style="margin: 0; box-shadow: none;">
                    <p style="
                        font-size: 16px;
                        line-height: 1.8;
                        color: #e2e8f0;
                        white-space: pre-line;
                    ">
                        ${presentation}
                    </p>
                </div>
            </div>

            <div class="modal-footer">
                <button class="action-btn secondary-btn">
                    Fermer
                </button>
            </div>
        </div>
    `;

    // Fermeture du modal
    const closeButtons = modal.querySelectorAll(
        ".modal-close, .secondary-btn, .modal-overlay"
    );

    closeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.remove();
        });
    });

    // Ajout au DOM
    document.body.appendChild(modal);
}

function formatPrix(prix) {
    return Number(prix || 0).toLocaleString("fr-FR") + " €";
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

    try {
        await postForm("http://localhost:8080/joueurs", {
            clubNom,
            niveau,
            nom,
            prenom,
            dateNaissance,
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