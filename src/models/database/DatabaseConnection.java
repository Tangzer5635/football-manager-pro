package models.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class DatabaseConnection {

    private static final String URL =
            "jdbc:sqlserver://201201-17;databaseName=FOOTBALL;encrypt=false";

    private static final String USER = "football_user";
    private static final String PASSWORD = "Football123!";

    private DatabaseConnection() {
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}