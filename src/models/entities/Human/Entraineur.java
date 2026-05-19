package models.entities.Human;

public class Entraineur extends Personne{
    Entraineur(String nom, String prenom) {
        super(nom, prenom);
    }

    @Override
    public String presentation() {
        return getNom()+" "+getPrenom();
    }

}