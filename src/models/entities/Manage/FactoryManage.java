package models.entities.Manage;

import models.entities.Human.Entraineur;
import models.referencies.Niveau;

import java.time.LocalDate;

public final class FactoryManage {
    private FactoryManage() {

    }

    public static Club createClub(String nom, LocalDate dateCreation) {
        return new Club(nom, dateCreation);
    }

    public static Equipe createEquipe(Niveau niveau, Entraineur entraineur) {
        return new Equipe(niveau, entraineur);
    }
}
