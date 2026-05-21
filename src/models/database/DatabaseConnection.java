package models.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class DatabaseConnection {

    private static final String URL =
            "jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";

    private static final String USER =
            "postgres.zqavhuzfgzkimduzabbz";

    private static final String PASSWORD =
            "AbZnVa159*";

    static {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }

    private DatabaseConnection() {
    }

    public static Connection getConnection()
            throws SQLException {

        DriverManager.setLoginTimeout(10);

        return DriverManager.getConnection(
                URL,
                USER,
                PASSWORD
        );
    }
}