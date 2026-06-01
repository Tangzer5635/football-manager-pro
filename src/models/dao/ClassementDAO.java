package models.dao;

import models.database.DatabaseConnection;
import models.entities.Manage.Classement;
import models.entities.Manage.Club;
import models.entities.Manage.FactoryManage;
import models.exceptions.DatabaseException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClassementDAO {

    private Connection getConnection() throws SQLException {
        try {
            return DatabaseConnection.getConnection();
        } catch (Exception e) {
            throw new SQLException("Impossible d'obtenir une connexion à la base de données.", e);
        }
    }

    public List<Classement> findAll() {
        List<Classement> classements = new ArrayList<>();

        String sql = """
                SELECT C.nom_club, C.date_creation,
                       CL.points, CL.victoires, CL.nuls, CL.defaites,
                       CL.buts_pour, CL.buts_contre
                FROM classement CL
                INNER JOIN club C ON C.id_club = CL.id_club
                ORDER BY CL.points DESC,
                         (CL.buts_pour - CL.buts_contre) DESC,
                         CL.buts_pour DESC
                """;

        try (
                Connection connection = getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet rs = statement.executeQuery()
        ) {
            while (rs.next()) {
                Club club = FactoryManage.createClub(
                        rs.getString("nom_club"),
                        rs.getDate("date_creation").toLocalDate()
                );

                Classement classement = new Classement(club);
                classement.setPoints(rs.getInt("points"));
                classement.setVictoires(rs.getInt("victoires"));
                classement.setNuls(rs.getInt("nuls"));
                classement.setDefaites(rs.getInt("defaites"));
                classement.setButsPour(rs.getInt("buts_pour"));
                classement.setButsContre(rs.getInt("buts_contre"));

                classements.add(classement);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erreur lors de la récupération du classement.", e);
        }

        return classements;
    }
}
