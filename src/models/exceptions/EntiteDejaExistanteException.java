package models.exceptions;

public class EntiteDejaExistanteException extends DatabaseException {

    public EntiteDejaExistanteException(String typeEntite, String identifiant) {
        super(typeEntite + " existe déjà : " + identifiant);
    }
}
