package start;

import models.entities.Manage.Classement;
import models.entities.Manage.Club;

import java.time.LocalDate;

public class MainTest {
    public static void main(String[] args) {
        Club club = new Club("Football Club de Lorient", LocalDate.of(2022, 1, 1));
        Classement classement = new Classement(club);

        classement.ajouterVictoire();
        classement.ajouterVictoire();
        classement.ajouterNul();

        classement.ajouterButsPour(5);
        classement.ajouterButsContre(2);

        System.out.println(classement);
    }
}
