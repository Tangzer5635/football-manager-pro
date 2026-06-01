package models.dao;

import models.database.DatabaseConnection;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Equipe;
import models.exceptions.DatabaseException;
import models.exceptions.JoueurNotFoundException;
import models.referencies.Poste;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

public class JoueurDAO {

    private Connection getConnection() throws SQLException {
        try {
            return DatabaseConnection.getConnection();
        } catch (Exception e) {
            throw new SQLException("Impossible d'obtenir une connexion à la base de données.", e);
        }
    }

    public Set<Joueur> findByEquipe(int idEquipe) {
        Set<Joueur> joueurs = new HashSet<>();

        String sql = """
                SELECT P.nom, P.prenom, J.date_naissance, J.prix, PO.libelle_poste
                FROM JOUEURS J
                INNER JOIN PERSONNE P ON J.id_joueur = P.id_personne
                INNER JOIN POSTE PO ON J.id_poste = PO.id_poste
                WHERE J.id_equipe = ?
                ORDER BY P.nom, P.prenom
                """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, idEquipe);

            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Joueur joueur = FactoryHuman.createJoueur(
                            rs.getString("nom"),
                            rs.getString("prenom"),
                            rs.getDate("date_naissance").toLocalDate()
                    );

                    joueur.setPrix(rs.getDouble("prix"));
                    joueur.setPoste(mapPoste(rs.getString("libelle_poste")));
                    joueur.setEstTitulaire(false);

                    joueurs.add(joueur);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la récupération des joueurs de l'équipe " + idEquipe, e);
        }

        return joueurs;
    }

    public void insert(Equipe equipe, Joueur joueur) {
        String sqlPersonne = """
                INSERT INTO PERSONNE (id_personne, nom, prenom)
                VALUES ((SELECT ISNULL(MAX(id_personne), 0) + 1 FROM PERSONNE), ?, ?)
                """;

        String sqlJoueur = """
                INSERT INTO JOUEURS (id_joueur, prix, date_naissance, id_poste, id_club, id_equipe)
                VALUES (
                    (SELECT MAX(id_personne) FROM PERSONNE),
                    ?, ?, ?,
                    (SELECT TOP 1 id_club FROM CLUB ORDER BY id_club),
                    (SELECT TOP 1 id_equipe FROM EQUIPE WHERE id_niveau = ? ORDER BY id_equipe)
                )
                """;

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(sqlPersonne)) {
                    statement.setString(1, joueur.getNom());
                    statement.setString(2, joueur.getPrenom());
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(sqlJoueur)) {
                    statement.setDouble(1, joueur.getPrix());
                    statement.setDate(2, Date.valueOf(joueur.getDateNaissance()));
                    statement.setInt(3, mapPosteToId(joueur.getPoste()));
                    statement.setInt(4, mapNiveauToId(equipe));
                    statement.executeUpdate();
                }

                connection.commit();
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DatabaseException(
                    "Erreur lors de l'ajout du joueur : " + joueur.getPrenom() + " " + joueur.getNom(), e
            );
        }
    }

    public void delete(Joueur joueur) {
        String sql = """
                DELETE J
                FROM JOUEURS J
                INNER JOIN PERSONNE P ON J.id_joueur = P.id_personne
                WHERE P.nom = ? AND P.prenom = ?
                """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, joueur.getNom());
            statement.setString(2, joueur.getPrenom());

            int rowsAffected = statement.executeUpdate();
            if (rowsAffected == 0) {
                throw new JoueurNotFoundException(joueur.getNom(), joueur.getPrenom());
            }
        } catch (JoueurNotFoundException e) {
            throw e;
        } catch (SQLException e) {
            throw new DatabaseException(
                    "Erreur lors de la suppression du joueur : " + joueur.getPrenom() + " " + joueur.getNom(), e
            );
        }
    }

    private Poste mapPoste(String libelle) {
        if (libelle == null) return Poste.ATTAQUANT;
        return switch (libelle.toUpperCase()) {
            case "GARDIEN" -> Poste.GARDIEN;
            case "DEFENSEUR" -> Poste.DEFENSEUR;
            case "MILIEU" -> Poste.MILIEU;
            default -> Poste.ATTAQUANT;
        };
    }

    private int mapPosteToId(Poste poste) {
        return switch (poste) {
            case GARDIEN -> 1;
            case DEFENSEUR -> 2;
            case MILIEU -> 3;
            case ATTAQUANT -> 4;
        };
    }

    private int mapNiveauToId(Equipe equipe) {
        return switch (equipe.getNiveau()) {
            case LIGUE_1 -> 1;
            case LIGUE_2 -> 2;
            case NATIONAL_1 -> 3;
            case NATIONAL_2 -> 4;
            case NATIONAL_3 -> 5;
            default -> 1;
        };
    }
}
