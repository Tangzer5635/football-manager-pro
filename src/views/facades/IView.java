package views.facades;

import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.referencies.Niveau;
import models.referencies.Poste;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface IView {
    void afficherMenuPrincipal(List<String> menu);
    void afficherMenuClub(List<String> menu);
    void afficherMenuEquipe(List<String> menu);
    void afficherMenuJoueur(List<String> menu);

    int saisirChoixMenu(int tailleMenu);

    //Saisie - Lecture

    String saisirNom();
    String saisirPrenom();
    LocalDate saisirDateCreation();
    Niveau choisirNiveau();

    LocalDate saisirDateNaissance();
    Poste choisirPoste();
    double saisirPrix();
    boolean estTitulaire();

    //Affichage

    void afficherClubs(List<Club> clubs);

    void afficherEquipes(Set<Equipe> equipes);

    void afficherJoueurs(Set<Joueur> joueurs);

    void afficherJoueursTitulaires(Set<Joueur> joueurs);

    void afficherMessage(String message);
    void afficherMessageSansSaut(String message);
    void afficherInfosEquipe(String entraineur, String niveau, Set<Joueur> joueurs);


}
