package models.entities.Manage;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Championnat {

    private final String nom;
    private final String saison;

    private List<Classement> classements = new ArrayList<>();

    public Championnat(String nom, String saison) {
        this.nom = nom;
        this.saison = saison;
    }

    public String getNom() {
        return nom;
    }

    public String getSaison() {
        return saison;
    }

    public List<Classement> getClassements() {
        return classements;
    }

    public void ajouterClub(Club club) {
        classements.add(new Classement(club));
    }

    public void afficherClassement() {

        classements.stream()
                .sorted(
                        Comparator.comparingInt(Classement::getPoints)
                                .thenComparingInt(Classement::differenceDeBut)
                                .thenComparingInt(Classement::getButsPour)
                                .reversed()
                )
                .forEach(System.out::println);
    }
}