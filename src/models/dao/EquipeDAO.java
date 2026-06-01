package models.dao;

import models.database.DatabaseConnection;
import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.exceptions.DatabaseException;
import models.exceptions.EquipeNotFoundException;
import models.referencies.Niveau;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

public class EquipeDAO {

    private Connection getConnection() throws SQLException {
        try {
            return DatabaseConnection.getConnection();
        } catch (Exception e) {
            throw new SQLException("Impossible d'obtenir une connexion à la base de données.", e);
        }
    }

    public Set<Equipe> findByClub(int idClub) {
        Set<Equipe> equipes = new HashSet<>();

        String sql = """
                SELECT E.id_equipe, E.nom_equipe, N.libelle_niveau,
                       P.nom AS nom_entraineur, P.prenom AS prenom_entraineur
                FROM EQUIPE E
                INNER JOIN NIVEAU N ON E.id_niveau = N.id_niveau
                INNER JOIN ENTRAINEUR EN ON E.id_entraineur = EN.id_entraineur
                INNER JOIN PERSONNE P ON EN.id_entraineur = P.id_personne
                WHERE E.id_equipe IN (
                    SELECT DISTINCT J.id_equipe FROM JOUEURS J WHERE J.id_club = ?
                )
                OR E.id_equipe IN (
                    SELECT E2.id_equipe FROM EQUIPE E2
                    WHERE E2.id_equipe NOT IN (
                        SELECT DISTINCT id_equipe FROM JOUEURS WHERE id_equipe IS NOT NULL
                    )
                )
                ORDER BY E.nom_equipe
                """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, idClub);

            try (ResultSet rs = statement.executeQuery()) {
                JoueurDAO joueurDAO = new JoueurDAO();

                while (rs.next()) {
                    int idEquipe = rs.getInt("id_equipe");
                    Niveau niveau = mapNiveau(rs.getString("libelle_niveau"));

                    Entraineur entraineur = FactoryHuman.createEntraineur(
                            rs.getString("nom_entraineur") != null ? rs.getString("nom_entraineur") : "",
                            rs.getString("prenom_entraineur") != null ? rs.getString("prenom_entraineur") : ""
                    );

                    Equipe equipe = FactoryManage.createEquipe(niveau, entraineur);

                    Set<Joueur> joueurs = joueurDAO.findByEquipe(idEquipe);
                    for (Joueur joueur : joueurs) {
                        equipe.ajouterJoueur(joueur);
                    }

                    equipes.add(equipe);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la récupération des équipes du club " + idClub, e);
        }

        return equipes;
    }

    public int findIdByNom(String nomEquipe) {
        String sql = "SELECT id_equipe FROM EQUIPE WHERE nom_equipe = ?";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, nomEquipe);
            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id_equipe");
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la recherche de l'équipe : " + nomEquipe, e);
        }

        throw new EquipeNotFoundException(nomEquipe);
    }

    public void insert(Equipe equipe) {
        String sqlPersonne = """
                INSERT INTO PERSONNE (id_personne, nom, prenom)
                VALUES ((SELECT ISNULL(MAX(id_personne), 0) + 1 FROM PERSONNE), ?, ?)
                """;

        String sqlEntraineur = """
                INSERT INTO ENTRAINEUR (id_entraineur)
                VALUES ((SELECT MAX(id_personne) FROM PERSONNE))
                """;

        String sqlEquipe = """
                INSERT INTO EQUIPE (id_equipe, nom_equipe, id_niveau, id_entraineur)
                VALUES (
                    (SELECT ISNULL(MAX(id_equipe), 0) + 1 FROM EQUIPE),
                    ?, ?,
                    (SELECT MAX(id_personne) FROM PERSONNE)
                )
                """;

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(sqlPersonne)) {
                    statement.setString(1, equipe.getEntraineur().getNom());
                    statement.setString(2, equipe.getEntraineur().getPrenom());
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(sqlEntraineur)) {
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(sqlEquipe)) {
                    statement.setString(1, "Equipe " + equipe.getNiveau().getNom());
                    statement.setInt(2, mapNiveauToId(equipe.getNiveau()));
                    statement.executeUpdate();
                }

                connection.commit();
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de l'ajout de l'équipe.", e);
        }
    }

    public void delete(Equipe equipe) {
        String nomEquipe = "Equipe " + equipe.getNiveau().getNom();

        String sqlEquipeId = """
                SELECT E.id_equipe
                FROM EQUIPE E
                INNER JOIN NIVEAU N ON E.id_niveau = N.id_niveau
                WHERE E.nom_equipe = ?
                """;

        String sqlDeleteJoueurs = "DELETE FROM JOUEURS WHERE id_equipe = ?";
        String sqlDeleteEquipe = "DELETE FROM EQUIPE WHERE id_equipe = ?";

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);
            try {
                int idEquipe = -1;

                try (PreparedStatement statement = connection.prepareStatement(sqlEquipeId)) {
                    statement.setString(1, nomEquipe);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            idEquipe = rs.getInt("id_equipe");
                        }
                    }
                }

                if (idEquipe == -1) {
                    throw new EquipeNotFoundException(nomEquipe);
                }

                try (PreparedStatement statement = connection.prepareStatement(sqlDeleteJoueurs)) {
                    statement.setInt(1, idEquipe);
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(sqlDeleteEquipe)) {
                    statement.setInt(1, idEquipe);
                    statement.executeUpdate();
                }

                connection.commit();
            } catch (Exception e) {
                connection.rollback();
                throw e;
            }
        } catch (EquipeNotFoundException e) {
            throw e;
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la suppression de l'équipe : " + nomEquipe, e);
        }
    }

    private Niveau mapNiveau(String libelle) {
        if (libelle == null) return Niveau.LIGUE_1;
        return switch (libelle.toUpperCase()) {
            case "LIGUE 1" -> Niveau.LIGUE_1;
            case "LIGUE 2" -> Niveau.LIGUE_2;
            case "LIGUE 3" -> Niveau.NATIONAL_1;
            case "NATIONAL" -> Niveau.NATIONAL_2;
            case "NATIONAL 2" -> Niveau.NATIONAL_3;
            case "RÉGIONAL 1", "REGIONAL 1" -> Niveau.REGIONAL_1;
            case "RÉGIONAL 2", "REGIONAL 2" -> Niveau.REGIONAL_2;
            case "RÉGIONAL 3", "REGIONAL 3" -> Niveau.REGIONAL_3;
            case "DÉPARTEMENTAL 1", "DEPARTEMENTAL 1" -> Niveau.DEPARTEMENTAL_1;
            case "DÉPARTEMENTAL 2", "DEPARTEMENTAL 2" -> Niveau.DEPARTEMENTAL_2;
            case "DÉPARTEMENTAL 3", "DEPARTEMENTAL 3" -> Niveau.DEPARTEMENTAL_3;
            case "DÉPARTEMENTAL 4", "DEPARTEMENTAL 4" -> Niveau.DEPARTEMENTAL_4;
            default -> Niveau.LIGUE_1;
        };
    }

    private int mapNiveauToId(Niveau niveau) {
        return switch (niveau) {
            case LIGUE_1 -> 1;
            case LIGUE_2 -> 2;
            case NATIONAL_1 -> 3;
            case NATIONAL_2 -> 4;
            case NATIONAL_3 -> 5;
            default -> 1;
        };
    }
}
