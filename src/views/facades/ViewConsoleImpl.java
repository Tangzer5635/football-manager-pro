package views.facades;

import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.referencies.Niveau;
import models.referencies.Poste;
import views.utils.AffichageConsole;
import views.utils.LectureConsole;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ViewConsoleImpl implements IView {
    @Override
    public void afficherMenuPrincipal(List<String> menu) {
        AffichageConsole.afficherMenuEntoureAvecOptionSortie(menu, "MENU_PRINCIPAL");
    }

    public void afficherMenuClub(List<String> menu) {
        AffichageConsole.afficherMenuEntoureAvecOptionSortie(menu, "MENU CLUB");
    }

    public void afficherMenuEquipe(List<String> menu) {
        AffichageConsole.afficherMenuEntoureAvecOptionSortie(menu, "MENU EQUIPE");
    }

    public void afficherMenuJoueur(List<String> menu) {
        AffichageConsole.afficherMenuEntoureAvecOptionSortie(menu, "MENU JOUEUR");
    }

    @Override
    public int saisirChoixMenu(int tailleMenu) {
        return LectureConsole.lectureChoixInt(0, tailleMenu);
    }

    //Saisie - Lecture

    @Override
    public String saisirNom() {
        return LectureConsole.lectureChaineCaracteres("Entrer un nom : ");
    }

    @Override
    public String saisirPrenom() {
        return LectureConsole.lectureChaineCaracteres("Entrer un prenom : ");
    }

    @Override
    public LocalDate saisirDateCreation() {
        return LectureConsole.lectureLocalDate("Entrer une date (JJ/MM/AAAA) : ", "dd/MM/yyyy");
    }

    @Override
    public Niveau choisirNiveau() {
        Niveau[] niveaux = Niveau.values();
        List<String> menu = new ArrayList<>();
        for (Niveau n : niveaux) {
            menu.add(n.getNom());
        }

        AffichageConsole.afficherMenuSimple(menu);
        int choix = LectureConsole.lectureChoixInt(0, menu.size());
        return niveaux[choix - 1];
    }

    @Override
    public LocalDate saisirDateNaissance() {
        return LectureConsole.lectureLocalDate("Entrer une date de naissance (JJ/MM/AAAA) : ", "dd/MM/yyyy");
    }

    @Override
    public Poste choisirPoste() {
        Poste[] postes = Poste.values();
        List<String> menu = new ArrayList<>();
        for (Poste p : postes) {
            menu.add(p.name());
        }
        AffichageConsole.afficherMenuSimple(menu);
        int choix = LectureConsole.lectureChoixInt(0, menu.size());
        return postes[choix - 1];
    }

    @Override
    public double saisirPrix() {
        return LectureConsole.lectureDouble("Entrer un prix : ");
    }

    @Override
    public boolean estTitulaire(){
        return LectureConsole.lectureBoolean("Est titulaire ?:");
    }

    //Affichage

    @Override
    public void afficherClubs(List<Club> clubs) {
        int index = 1;
        AffichageConsole.afficherMessageAvecSautLigne("Liste des clubs : ");
        for (Club club : clubs) {
            AffichageConsole.afficherMessageAvecSautLigne(String.format("%d - %s", index++, club.getNom()));
        }
    }

    @Override
    public void afficherEquipes(Set<Equipe> equipes) {
        int index = 1;
        AffichageConsole.afficherMessageAvecSautLigne("Liste des equipes : ");
        for (Equipe equipe : equipes) {
            AffichageConsole.afficherMessageAvecSautLigne(String.format("%d - %s", index++, equipe.toString()));
        }
    }

    @Override
    public void afficherJoueurs(Set<Joueur> joueurs) {
        int index = 1;
        AffichageConsole.afficherMessageAvecSautLigne("Liste des joueurs : ");
        for (Joueur joueur : joueurs) {
            AffichageConsole.afficherMessageAvecSautLigne(String.format("%d - %s", index++, joueur.presentation()));
        }
    }

    @Override
    public void afficherJoueursTitulaires(Set<Joueur> joueurs) {
        int index = 1;
        AffichageConsole.afficherMessageAvecSautLigne("Liste des joueurs titulaires : ");
        for (Joueur joueur : joueurs) {
            if ( joueur.isEstTitulaire()){
                AffichageConsole.afficherMessageAvecSautLigne(String.format("%d - %s", index++, joueur.presentation()));
            }
        }
    }

    @Override
    public void afficherMessage(String message) {
        AffichageConsole.afficherMessageAvecSautLigne(message);
    }

    @Override
    public void afficherMessageSansSaut(String message) {
        AffichageConsole.afficherMessageSansSautLigne(message);
    }

    @Override
    public void afficherInfosEquipe(String entraineur, String niveau, Set<Joueur> joueurs) {
        AffichageConsole.afficherMessageAvecSautLigne("Entraineur : " + entraineur);
        AffichageConsole.afficherMessageAvecSautLigne("Niveau : " + niveau);
        AffichageConsole.afficherMessageAvecSautLigne("Joueurs : ");
        for (Joueur j : joueurs) {
            AffichageConsole.afficherMessageAvecSautLigne(j.presentation());
        }
    }
}
