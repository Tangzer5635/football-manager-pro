package start;

import models.database.DatabaseConnection;

import java.sql.Connection;

public class TestConnexion {

    public static void main(String[] args) {

        System.setProperty(
                "java.net.preferIPv4Stack",
                "true"
        );

        System.out.println("Début test...");

        try (
                Connection connection =
                        DatabaseConnection.getConnection()
        ) {

            System.out.println("Connexion Supabase OK");

        } catch (Exception e) {
            e.printStackTrace();
        }

        System.out.println("Fin test");
    }
}