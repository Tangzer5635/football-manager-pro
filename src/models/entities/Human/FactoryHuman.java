package models.entities.Human;

import java.time.LocalDate;

public final class FactoryHuman {
    private FactoryHuman() {

    }

    public static Entraineur createEntraineur(String nom, String prenom) {
        return new Entraineur(nom, prenom);
    }

    public static Joueur createJoueur(String nom, String prenom, LocalDate dateNaissance){
        Joueur joueur = new Joueur(nom, prenom, dateNaissance);
        joueur.setPrix(joueur.getPrix());
        joueur.setPoste(joueur.getPoste());
        joueur.setEstTitulaire(joueur.isEstTitulaire());
        return joueur;
    }
}
