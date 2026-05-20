package start;

import java.sql.Connection;
import java.sql.DriverManager;

public class TestConnexion {
    public static void main(String[] args) {
        try {
            String url =
                    "jdbc:sqlserver://201201-17;databaseName=FOOTBALL;encrypt=false";

            String user = "football_user";
            String password = "Football123!";

            Connection con = DriverManager.getConnection(url, user, password);

            System.out.println("Connexion réussie !");
            con.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}