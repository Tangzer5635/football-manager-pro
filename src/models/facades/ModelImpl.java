package models.facades;

import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.referencies.Niveau;
import models.referencies.Poste;

import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

public class ModelImpl implements IModel {

    // ======================================================
    // CONFIGURATION SQL SERVER
    // ======================================================
    private static final String URL =
            "jdbc:sqlserver://201201-17;" +
                    "databaseName=FOOTBALL;" +
                    "encrypt=true;" +
                    "trustServerCertificate=true;" +
                    "integratedSecurity=true;";

    private static final List<Club> CLUBS = new ArrayList<>();

    // ======================================================
    // CONSTRUCTEUR
    // ======================================================
    public ModelImpl() {
        chargerDepuisBaseDeDonnees();

        // Si la base est vide, on ajoute des données par défaut
        if (CLUBS.isEmpty()) {
            init();
        }
    }

    // ======================================================
    // DONNÉES PAR DÉFAUT
    // ======================================================
    private void init() {
        Club club = FactoryManage.createClub(
                "Football Club de Lorient",
                LocalDate.of(1926, 4, 2)
        );

        Entraineur entraineur = FactoryHuman.createEntraineur(
                "Le Buhé",
                "Tanguy"
        );

        Equipe equipe = FactoryManage.createEquipe(
                Niveau.LIGUE_1,
                entraineur
        );

        Joueur joueur = FactoryHuman.createJoueur(
                "Mvogo",
                "Yvon",
                LocalDate.of(1994, 6, 6)
        );
        joueur.setPoste(Poste.GARDIEN);
        joueur.setPrix(2_000_000);
        joueur.setEstTitulaire(true);

        equipe.ajouterJoueur(joueur);
        club.ajouterEquipe(equipe);

        ajouterClub(club);
    }

    // ======================================================
    // CONNEXION
    // ======================================================
    private Connection getConnection() throws Exception {
        // Utilise ta classe DatabaseConnection
        // et NON DriverManager avec integratedSecurity=true
        return models.database.DatabaseConnection.getConnection();
    }

    // ======================================================
    // CHARGEMENT DEPUIS SQL SERVER
    // ======================================================
    private void chargerDepuisBaseDeDonnees() {
        CLUBS.clear();

        String sql = """
        SELECT nom_club, date_creation
        FROM CLUB
        ORDER BY nom_club
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet rs = statement.executeQuery()
        ) {
            while (rs.next()) {
                String nom = rs.getString("nom_club");
                LocalDate dateCreation =
                        rs.getDate("date_creation").toLocalDate();

                Club club = FactoryManage.createClub(
                        nom,
                        dateCreation
                );

                CLUBS.add(club);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ======================================================
    // AJOUT D'UN CLUB
    // ======================================================
    @Override
    public void ajouterClub(Club club) {
        String sql = """
        INSERT INTO CLUB (nom_club, date_creation)
        VALUES (?, ?)
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setString(1, club.getNom());
            statement.setDate(
                    2,
                    java.sql.Date.valueOf(club.getDateCreation())
            );

            statement.executeUpdate();

            // IMPORTANT : recharge toute la liste depuis la base
            chargerDepuisBaseDeDonnees();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de l'ajout du club."
            );
        }
    }

    // ======================================================
// SUPPRESSION D'UN CLUB
// ======================================================
    @Override
    public void supprimerClub(Club club) {
        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);

            try {
                // Supprimer les joueurs liés au club
                String deleteJoueurs = """
                DELETE FROM JOUEURS
                WHERE id_club = (
                    SELECT id_club
                    FROM CLUB
                    WHERE nom_club = ?
                )
                """;

                try (PreparedStatement statement =
                             connection.prepareStatement(deleteJoueurs)) {
                    statement.setString(1, club.getNom());
                    statement.executeUpdate();
                }

                // Supprimer le club
                String deleteClub = """
                DELETE FROM CLUB
                WHERE nom_club = ?
                """;

                try (PreparedStatement statement =
                             connection.prepareStatement(deleteClub)) {
                    statement.setString(1, club.getNom());
                    statement.executeUpdate();
                }

                connection.commit();

                // IMPORTANT : recharge toute la liste depuis la base
                chargerDepuisBaseDeDonnees();

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la suppression du club."
            );
        }
    }

    // ======================================================
    // ÉQUIPES
    // ======================================================
    @Override
    public void ajouterEquipe(Club club, Equipe equipe) {
        String sqlPersonne = """
        INSERT INTO PERSONNE (id_personne, nom, prenom)
        VALUES (
            (SELECT ISNULL(MAX(id_personne), 0) + 1 FROM PERSONNE),
            ?, ?
        )
        """;

        String sqlEntraineur = """
        INSERT INTO ENTRAINEUR (id_entraineur)
        VALUES ((SELECT MAX(id_personne) FROM PERSONNE))
        """;

        String sqlEquipe = """
        INSERT INTO EQUIPE (
            id_equipe,
            nom_equipe,
            id_niveau,
            id_entraineur
        )
        VALUES (
            (SELECT ISNULL(MAX(id_equipe), 0) + 1 FROM EQUIPE),
            ?,
            ?,
            (SELECT MAX(id_personne) FROM PERSONNE)
        )
        """;

        String sqlClubId = """
        SELECT id_club
        FROM CLUB
        WHERE nom_club = ?
        """;

        String sqlEquipeId = """
        SELECT MAX(id_equipe) AS id_equipe
        FROM EQUIPE
        """;

        String sqlMajJoueurs = """
        UPDATE JOUEURS
        SET id_club = ?, id_equipe = ?
        WHERE 1 = 0
        """;

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);

            try {
                // 1. Créer la personne
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlPersonne)) {
                    statement.setString(
                            1,
                            equipe.getEntraineur().getNom()
                    );
                    statement.setString(
                            2,
                            equipe.getEntraineur().getPrenom()
                    );
                    statement.executeUpdate();
                }

                // 2. Créer l'entraîneur
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlEntraineur)) {
                    statement.executeUpdate();
                }

                // 3. Récupérer l'id du niveau
                int idNiveau = switch (equipe.getNiveau()) {
                    case LIGUE_1 -> 1;
                    case LIGUE_2 -> 2;
                    case NATIONAL_1 -> 3;
                    case NATIONAL_2 -> 4;
                    case NATIONAL_3 -> 5;
                    default -> 1;
                };

                // 4. Créer l'équipe
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlEquipe)) {
                    statement.setString(
                            1,
                            "Equipe " + equipe.getNiveau().getNom()
                    );
                    statement.setInt(2, idNiveau);
                    statement.executeUpdate();
                }

                // 5. Commit
                connection.commit();

                // 6. Recharge les données
                chargerDepuisBaseDeDonnees();

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de l'ajout de l'équipe."
            );
        }
    }

    @Override
    public void supprimerEquipe(Club club, Equipe equipe) {
        String sqlEquipeId = """
        SELECT E.id_equipe
        FROM EQUIPE E
        INNER JOIN NIVEAU N
            ON E.id_niveau = N.id_niveau
        WHERE E.nom_equipe = ?
        """;

        String sqlDeleteJoueurs = """
        DELETE FROM JOUEURS
        WHERE id_equipe = ?
        """;

        String sqlDeleteEquipe = """
        DELETE FROM EQUIPE
        WHERE id_equipe = ?
        """;

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);

            try {
                int idEquipe = -1;

                // Récupération de l'id équipe
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlEquipeId)) {
                    statement.setString(
                            1,
                            "Equipe " + equipe.getNiveau().getNom()
                    );

                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            idEquipe = rs.getInt("id_equipe");
                        }
                    }
                }

                if (idEquipe != -1) {
                    // Supprimer les joueurs
                    try (PreparedStatement statement =
                                 connection.prepareStatement(sqlDeleteJoueurs)) {
                        statement.setInt(1, idEquipe);
                        statement.executeUpdate();
                    }

                    // Supprimer l'équipe
                    try (PreparedStatement statement =
                                 connection.prepareStatement(sqlDeleteEquipe)) {
                        statement.setInt(1, idEquipe);
                        statement.executeUpdate();
                    }
                }

                connection.commit();
                chargerDepuisBaseDeDonnees();

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la suppression de l'équipe."
            );
        }
    }

    // ======================================================
    // JOUEURS
    // ======================================================
    @Override
    public void ajouterJoueur(Equipe equipe, Joueur joueur) {
        String sqlPersonne = """
        INSERT INTO PERSONNE (
            id_personne,
            nom,
            prenom
        )
        VALUES (
            (SELECT ISNULL(MAX(id_personne), 0) + 1 FROM PERSONNE),
            ?,
            ?
        )
        """;

        String sqlJoueur = """
        INSERT INTO JOUEURS (
            id_joueur,
            prix,
            date_naissance,
            id_poste,
            id_club,
            id_equipe
        )
        VALUES (
            (SELECT MAX(id_personne) FROM PERSONNE),
            ?,
            ?,
            ?,
            (
                SELECT TOP 1 id_club
                FROM CLUB
                ORDER BY id_club
            ),
            (
                SELECT TOP 1 id_equipe
                FROM EQUIPE
                WHERE id_niveau = ?
                ORDER BY id_equipe
            )
        )
        """;

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);

            try {
                // Conserver explicitement la valeur du titulaire
                boolean estTitulaire = joueur.isEstTitulaire();

                // 1. Ajouter dans PERSONNE
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlPersonne)) {
                    statement.setString(1, joueur.getNom());
                    statement.setString(2, joueur.getPrenom());
                    statement.executeUpdate();
                }

                // 2. Conversion du poste
                int idPoste = switch (joueur.getPoste()) {
                    case GARDIEN -> 1;
                    case DEFENSEUR -> 2;
                    case MILIEU -> 3;
                    case ATTAQUANT -> 4;
                };

                // 3. Conversion du niveau
                int idNiveau = switch (equipe.getNiveau()) {
                    case LIGUE_1 -> 1;
                    case LIGUE_2 -> 2;
                    case NATIONAL_1 -> 3;
                    case NATIONAL_2 -> 4;
                    case NATIONAL_3 -> 5;
                    default -> 1;
                };

                // 4. Ajouter dans JOUEURS
                try (PreparedStatement statement =
                             connection.prepareStatement(sqlJoueur)) {
                    statement.setDouble(1, joueur.getPrix());
                    statement.setDate(
                            2,
                            Date.valueOf(joueur.getDateNaissance())
                    );
                    statement.setInt(3, idPoste);
                    statement.setInt(4, idNiveau);
                    statement.executeUpdate();
                }

                connection.commit();

                // Restaurer la valeur sur l'objet Java
                joueur.setEstTitulaire(estTitulaire);

                // Recharger les données
                chargerDepuisBaseDeDonnees();

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de l'ajout du joueur."
            );
        }
    }

    @Override
    public void supprimerJoueur(Equipe equipe, Joueur joueur) {
        String sql = """
        DELETE J
        FROM JOUEURS J
        INNER JOIN PERSONNE P
            ON J.id_joueur = P.id_personne
        WHERE P.nom = ?
          AND P.prenom = ?
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setString(1, joueur.getNom());
            statement.setString(2, joueur.getPrenom());

            statement.executeUpdate();

            chargerDepuisBaseDeDonnees();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la suppression du joueur."
            );
        }
    }

    // ======================================================
    // LECTURE
    // ======================================================

    @Override
    public List<Club> recupererClubs() {
        CLUBS.clear();

        String sql = """
        SELECT
            C.id_club,
            C.nom_club,
            C.date_creation
        FROM CLUB C
        ORDER BY C.nom_club
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql);
                ResultSet rs = statement.executeQuery()
        ) {
            while (rs.next()) {
                int idClub = rs.getInt("id_club");
                String nomClub = rs.getString("nom_club");
                LocalDate dateCreation =
                        rs.getDate("date_creation").toLocalDate();

                Club club = FactoryManage.createClub(
                        nomClub,
                        dateCreation
                );

                // Charge toutes les équipes du club depuis la BDD
                Set<Equipe> equipes =
                        recupererEquipesDuClub(idClub);

                // Ajoute les équipes au club
                for (Equipe equipe : equipes) {
                    club.ajouterEquipe(equipe);
                }

                CLUBS.add(club);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la récupération des clubs."
            );
        }

        return Collections.unmodifiableList(CLUBS);
    }

    @Override
    public Set<Equipe> recupererEquipesDuClub(int idClub) {
        Set<Equipe> equipes = new java.util.HashSet<>();

        String sql = """
        SELECT
            E.id_equipe,
            E.nom_equipe,
            N.libelle_niveau,
            P.nom AS nom_entraineur,
            P.prenom AS prenom_entraineur
        FROM EQUIPE E
        INNER JOIN NIVEAU N
            ON E.id_niveau = N.id_niveau
        INNER JOIN ENTRAINEUR EN
            ON E.id_entraineur = EN.id_entraineur
        INNER JOIN PERSONNE P
            ON EN.id_entraineur = P.id_personne
        WHERE E.id_equipe IN (
            SELECT DISTINCT J.id_equipe
            FROM JOUEURS J
            WHERE J.id_club = ?
        )
        OR E.id_equipe IN (
            SELECT E2.id_equipe
            FROM EQUIPE E2
            WHERE E2.id_equipe NOT IN (
                SELECT DISTINCT id_equipe
                FROM JOUEURS
                WHERE id_equipe IS NOT NULL
            )
        )
        ORDER BY E.nom_equipe
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setInt(1, idClub);

            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    int idEquipe = rs.getInt("id_equipe");
                    String niveauTexte =
                            rs.getString("libelle_niveau");

                    Niveau niveau = Niveau.LIGUE_1;

                    if (niveauTexte != null) {
                        switch (niveauTexte.toUpperCase()) {
                            case "LIGUE 1" -> niveau = Niveau.LIGUE_1;
                            case "LIGUE 2" -> niveau = Niveau.LIGUE_2;
                            case "LIGUE 3" -> niveau = Niveau.NATIONAL_1;
                            case "NATIONAL" -> niveau = Niveau.NATIONAL_2;
                            case "NATIONAL 2" -> niveau = Niveau.NATIONAL_3;
                            case "RÉGIONAL 1", "REGIONAL 1" -> niveau = Niveau.REGIONAL_1;
                            case "RÉGIONAL 2", "REGIONAL 2" -> niveau = Niveau.REGIONAL_2;
                            case "RÉGIONAL 3", "REGIONAL 3" -> niveau = Niveau.REGIONAL_3;
                            case "DÉPARTEMENTAL 1", "DEPARTEMENTAL 1" -> niveau = Niveau.DEPARTEMENTAL_1;
                            case "DÉPARTEMENTAL 2", "DEPARTEMENTAL 2" -> niveau = Niveau.DEPARTEMENTAL_2;
                            case "DÉPARTEMENTAL 3", "DEPARTEMENTAL 3" -> niveau = Niveau.DEPARTEMENTAL_3;
                            case "DÉPARTEMENTAL 4", "DEPARTEMENTAL 4" -> niveau = Niveau.DEPARTEMENTAL_4;
                        }
                    }

                    String nomEnt = rs.getString("nom_entraineur");
                    String prenomEnt = rs.getString("prenom_entraineur");

                    Entraineur entraineur =
                            FactoryHuman.createEntraineur(
                                    nomEnt != null ? nomEnt : "",
                                    prenomEnt != null ? prenomEnt : ""
                            );

                    Equipe equipe =
                            FactoryManage.createEquipe(
                                    niveau,
                                    entraineur
                            );

                    Set<Joueur> joueurs =
                            recupererJoueursDeLEquipe(idEquipe);

                    for (Joueur joueur : joueurs) {
                        equipe.ajouterJoueur(joueur);
                    }

                    equipes.add(equipe);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la récupération des équipes."
            );
        }

        return equipes;
    }

    @Override
    public Set<Joueur> recupererJoueursDeLEquipe(int idEquipe) {
        Set<Joueur> joueurs = new java.util.HashSet<>();

        String sql = """
        SELECT
            P.nom,
            P.prenom,
            J.date_naissance,
            J.prix,
            PO.libelle_poste
        FROM JOUEURS J
        INNER JOIN PERSONNE P
            ON J.id_joueur = P.id_personne
        INNER JOIN POSTE PO
            ON J.id_poste = PO.id_poste
        WHERE J.id_equipe = ?
        ORDER BY P.nom, P.prenom
        """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {
            statement.setInt(1, idEquipe);

            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Joueur joueur =
                            FactoryHuman.createJoueur(
                                    rs.getString("nom"),
                                    rs.getString("prenom"),
                                    rs.getDate("date_naissance")
                                            .toLocalDate()
                            );

                    joueur.setPrix(
                            rs.getDouble("prix")
                    );

                    String posteTexte =
                            rs.getString("libelle_poste");

                    Poste poste = switch (posteTexte.toUpperCase()) {
                        case "GARDIEN" -> Poste.GARDIEN;
                        case "DEFENSEUR" -> Poste.DEFENSEUR;
                        case "MILIEU" -> Poste.MILIEU;
                        case "ATTAQUANT" -> Poste.ATTAQUANT;
                        default -> Poste.ATTAQUANT;
                    };

                    joueur.setPoste(poste);

                    // Tant que la base de données ne possède pas de colonne
                    // "titulaire", on met tous les joueurs à NON titulaire.
                    // Ainsi, seuls les joueurs explicitement cochés "Oui"
                    // juste après leur création apparaîtront comme titulaires
                    // si tu conserves cette valeur côté front.
                    joueur.setEstTitulaire(false);

                    joueurs.add(joueur);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(
                    "Erreur lors de la récupération des joueurs."
            );
        }

        return joueurs;
    }
}