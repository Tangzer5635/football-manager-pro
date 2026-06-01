package models.exceptions;

public class ClubNotFoundException extends DatabaseException {

    public ClubNotFoundException(String nomClub) {
        super("Club introuvable : " + nomClub);
    }

    public ClubNotFoundException(int idClub) {
        super("Club introuvable avec l'id : " + idClub);
    }
}
