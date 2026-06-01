package models.dao;

import models.database.DatabaseConnection;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.exceptions.ClubNotFoundException;
import models.exceptions.DatabaseException;
import models.exceptions.EntiteDejaExistanteException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ClubDAO {

    private final EquipeDAO equipeDAO = new EquipeDAO();

    private Connection getConnection() throws SQLException {
        try {
            return DatabaseConnection.getConnection();
        } catch (Exception e) {
            throw new SQLException("Impossible d'obtenir une connexion à la base de données.", e);
        }
    }

    public List<Club> findAll() {
        List<Club> clubs = new ArrayList<>();

        String sql = """
                SELECT id_club, nom_club, date_creation
                FROM CLUB
                ORDER BY nom_club
                """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet rs = statement.executeQuery()
        ) {
            while (rs.next()) {
                int idClub = rs.getInt("id_club");
                String nomClub = rs.getString("nom_club");
                LocalDate dateCreation = rs.getDate("date_creation").toLocalDate();

                Club club = FactoryManage.createClub(nomClub, dateCreation);

                Set<Equipe> equipes = equipeDAO.findByClub(idClub);
                for (Equipe equipe : equipes) {
                    club.ajouterEquipe(equipe);
                }

                clubs.add(club);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la récupération des clubs.", e);
        }

        return clubs;
    }

    public int findIdByNom(String nomClub) {
        String sql = "SELECT id_club FROM CLUB WHERE nom_club = ?";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, nomClub);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id_club");
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la recherche du club : " + nomClub, e);
        }

        throw new ClubNotFoundException(nomClub);
    }

    public boolean exists(String nomClub) {
        String sql = "SELECT 1 FROM CLUB WHERE nom_club = ?";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, nomClub);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la vérification du club : " + nomClub, e);
        }
    }

    public void insert(Club club) {
        if (exists(club.getNom())) {
            throw new EntiteDejaExistanteException("Club", club.getNom());
        }

        String sql = "INSERT INTO CLUB (nom_club, date_creation) VALUES (?, ?)";

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, club.getNom());
            statement.setDate(2, java.sql.Date.valueOf(club.getDateCreation()));
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de l'ajout du club : " + club.getNom(), e);
        }
    }

    public void delete(Club club) {
        if (!exists(club.getNom())) {
            throw new ClubNotFoundException(club.getNom());
        }

        String deleteJoueurs = """
                DELETE FROM JOUEURS
                WHERE id_club = (SELECT id_club FROM CLUB WHERE nom_club = ?)
                """;

        String deleteClub = "DELETE FROM CLUB WHERE nom_club = ?";

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(deleteJoueurs)) {
                    statement.setString(1, club.getNom());
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(deleteClub)) {
                    statement.setString(1, club.getNom());
                    statement.executeUpdate();
                }

                connection.commit();
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la suppression du club : " + club.getNom(), e);
        }
    }
}
