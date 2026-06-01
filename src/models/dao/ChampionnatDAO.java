package models.dao;

import models.database.DatabaseConnection;
import models.entities.Manage.Championnat;
import models.entities.Manage.Club;
import models.exceptions.ClubNotFoundException;
import models.exceptions.DatabaseException;
import models.exceptions.EntiteDejaExistanteException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ChampionnatDAO {

    private Connection getConnection() throws SQLException {
        try {
            return DatabaseConnection.getConnection();
        } catch (Exception e) {
            throw new SQLException("Impossible d'obtenir une connexion à la base de données.", e);
        }
    }

    public void insert(Championnat championnat) {
        if (exists(championnat.getNom(), championnat.getSaison())) {
            throw new EntiteDejaExistanteException(
                    "Championnat", championnat.getNom() + " (" + championnat.getSaison() + ")"
            );
        }

        String sql = "INSERT INTO championnat (nom, saison) VALUES (?, ?)";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, championnat.getNom());
            statement.setString(2, championnat.getSaison());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de l'ajout du championnat : " + championnat.getNom(), e);
        }
    }

    public int findId(String nom, String saison) {
        String sql = "SELECT id_championnat FROM championnat WHERE nom = ? AND saison = ?";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, nom);
            statement.setString(2, saison);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id_championnat");
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la recherche du championnat : " + nom, e);
        }

        throw new DatabaseException("Championnat introuvable : " + nom + " (" + saison + ")");
    }

    public boolean exists(String nom, String saison) {
        String sql = "SELECT 1 FROM championnat WHERE nom = ? AND saison = ?";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, nom);
            statement.setString(2, saison);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la vérification du championnat : " + nom, e);
        }
    }

    public void ajouterClubAuClassement(Championnat championnat, Club club) {
        int idChampionnat = findId(championnat.getNom(), championnat.getSaison());

        String sqlClub = "SELECT id_club FROM club WHERE nom_club = ?";
        String sqlInsert = """
                INSERT INTO classement (id_championnat, id_club, points, victoires, nuls, defaites, buts_pour, buts_contre)
                VALUES (?, ?, 0, 0, 0, 0, 0, 0)
                """;

        try (Connection connection = getConnection()) {
            int idClub = -1;

            try (PreparedStatement statement = connection.prepareStatement(sqlClub)) {
                statement.setString(1, club.getNom());
                try (ResultSet rs = statement.executeQuery()) {
                    if (rs.next()) {
                        idClub = rs.getInt("id_club");
                    }
                }
            }

            if (idClub == -1) {
                throw new ClubNotFoundException(club.getNom());
            }

            try (PreparedStatement statement = connection.prepareStatement(sqlInsert)) {
                statement.setInt(1, idChampionnat);
                statement.setInt(2, idClub);
                statement.executeUpdate();
            }
        } catch (ClubNotFoundException e) {
            throw e;
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de l'ajout du club au classement.", e);
        }
    }
}
