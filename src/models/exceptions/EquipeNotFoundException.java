package models.exceptions;

public class EquipeNotFoundException extends DatabaseException {

    public EquipeNotFoundException(String nomEquipe) {
        super("Équipe introuvable : " + nomEquipe);
    }

    public EquipeNotFoundException(int idEquipe) {
        super("Équipe introuvable avec l'id : " + idEquipe);
    }
}
