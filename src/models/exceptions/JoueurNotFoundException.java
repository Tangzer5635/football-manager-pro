package models.exceptions;

public class JoueurNotFoundException extends DatabaseException {

    public JoueurNotFoundException(String nom, String prenom) {
        super("Joueur introuvable : " + prenom + " " + nom);
    }

    public JoueurNotFoundException(int idJoueur) {
        super("Joueur introuvable avec l'id : " + idJoueur);
    }
}
