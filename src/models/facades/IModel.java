package models.facades;

import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;

import java.util.List;
import java.util.Set;

public interface IModel {

    void ajouterClub(Club club);

    void ajouterEquipe(Club club, Equipe equipe);
    void ajouterJoueur(Equipe equipe, Joueur joueur);
    void supprimerJoueur(Equipe equipe, Joueur joueur);
    void supprimerEquipe(Club club, Equipe equipe);
    void supprimerClub(Club club);

    //Affichage

    List<Club> recupererClubs();
    Set<Equipe> recupererEquipesDuClub(int idClub);
    Set<Joueur> recupererJoueursDeLEquipe(int idEquipe);

}
