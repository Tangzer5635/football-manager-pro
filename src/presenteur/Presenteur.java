package presenteur;

import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.facades.IModel;
import models.referencies.Niveau;
import models.referencies.Poste;
import views.facades.IView;
import views.utils.AffichageConsole;
import views.utils.JsonExporter;

import java.time.LocalDate;
import java.util.*;

public class Presenteur {
    private IModel model;
    private IView view;
    private Set<Joueur> joueurs = new HashSet<>();

    private final int CHOIX_SORTIE = 0;

    public Presenteur(IModel model, IView view) {
        this.model = model;
        this.view = view;
    }

    private final List<String> MENU_PRINCIPAL = new ArrayList<>(Arrays.asList(
            "Gerer les clubs",
            "Gerer les equipes",
            "Gerer les joueurs"
    ));

    private final List<String> MENU_CLUB = new ArrayList<>(Arrays.asList(
            "Ajouter un club",
            "Afficher tous les clubs",
            "Supprimer un club"
    ));

    private final List<String> MENU_EQUIPE = new ArrayList<>(Arrays.asList(
            "Créer une équipe dans un club",
            "Afficher les informations d'une équipe",
            "Afficher les joueurs titulaires",
            "Supprimer un joueur d’une équipe",
            "Supprimer une équipe"
    ));

    private final List<String> MENU_JOUEUR = new ArrayList<>(Arrays.asList(
            "Ajouter un joueur dans une équipe",
            "Afficher tous les joueurs",
            "Supprimer un joueur d'une équipe"
    ));


    private final int TAILLE_MENU = MENU_PRINCIPAL.size();
    private final int TAILLE_MENU_CLUB = MENU_CLUB.size();
    private final int TAILLE_MENU_EQUIPE = MENU_EQUIPE.size();
    private final int TAILLE_MENU_JOUEUR = MENU_JOUEUR.size();

    public void start() {
        int choix;
        do {
            view.afficherMenuPrincipal(MENU_PRINCIPAL);
            choix = view.saisirChoixMenu(TAILLE_MENU);
            gestionMenu(choix);
        } while (choix != CHOIX_SORTIE);
    }

    private void gestionMenuClub() {
        int choix;
        do {
            view.afficherMenuClub(MENU_CLUB);
            choix = view.saisirChoixMenu(TAILLE_MENU_CLUB);
            menuClub(choix);
        } while (choix != CHOIX_SORTIE);
    }

    private void gestionMenuEquipe() {
        int choix;
        do {
            view.afficherMenuEquipe(MENU_EQUIPE);
            choix = view.saisirChoixMenu(TAILLE_MENU_EQUIPE);
            menuEquipe(choix);
        } while (choix != CHOIX_SORTIE);
    }

    private void gestionMenuJoueur() {
        int choix;
        do {
            view.afficherMenuJoueur(MENU_JOUEUR);
            choix = view.saisirChoixMenu(TAILLE_MENU_JOUEUR);
            menuJoueur(choix);
        } while (choix != CHOIX_SORTIE);
    }

    private void gestionMenu(int choix) {
        switch (choix) {
            case 1 -> gestionMenuClub();
            case 2 -> gestionMenuEquipe();
            case 3 -> gestionMenuJoueur();
        }
    }

    private void menuClub(int choix) {
        switch (choix) {
            case 1 -> saisirClub();
            case 2 -> afficherClub();
            case 3 -> supprimerClub();
        }
    }

    private void menuEquipe(int choix) {
        switch (choix) {
            case 1 -> creerEquipeDansClub();
            case 2 -> afficherInfoEquipe();
            case 3 -> afficherJoueurTitulaires();
            case 4 -> supprimerJoueurDansEquipe();
            case 5 -> supprimerEquipe();
        }
    }

    private void menuJoueur(int choix) {
        switch (choix) {
            case 1 -> ajouterJoueurDansEquipe();
            case 2 -> afficherJoueur();
            case 3 -> supprimerJoueurDansEquipe();
        }
    }

    //CLUBS

    private void saisirClub() {
        String nom = view.saisirNom();
        LocalDate dateCreation = view.saisirDateCreation();
        Club club = FactoryManage.createClub(nom, dateCreation);
        model.ajouterClub(club);
        AffichageConsole.afficherMessageAvecSautLigne("Club ajouté avec succès !");
        JsonExporter.exporter(model.recupererClubs());
    }

    private void afficherClub() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
    }

    private void supprimerClub() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);
        model.supprimerClub(club);
    }

    //EQUIPES

    private void creerEquipeDansClub() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Niveau niveau = view.choisirNiveau();
        AffichageConsole.afficherMessageAvecSautLigne("Saisir les informations de l'entraineur : ");
        String nomEntraineur = view.saisirNom();
        String prenomEntraineur = view.saisirPrenom();

        Entraineur entraineur = FactoryHuman.createEntraineur(nomEntraineur, prenomEntraineur);
        Equipe equipe = FactoryManage.createEquipe(niveau, entraineur);

        model.ajouterEquipe(club, equipe);

        AffichageConsole.afficherMessageAvecSautLigne("Equipe bien ajouté au club : " + club.getNom());
        JsonExporter.exporter(model.recupererClubs());
    }


    private void afficherInfoEquipe() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);

        view.afficherMessageSansSaut("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);

        view.afficherMessageSansSaut("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        Entraineur entraineur = equipe.getEntraineur();
        Niveau niveau = equipe.getNiveau();
        Set<Joueur> joueurs = equipe.getJoueur();

        view.afficherInfosEquipe(
                entraineur.presentation(),
                niveau.getNom(),
                joueurs
        );
    }

    private void afficherJoueurTitulaires() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        Set<Joueur> joueurs = equipe.getJoueur();
        view.afficherJoueursTitulaires(joueurs);
    }

    private void supprimerEquipe() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        model.supprimerEquipe(club, equipe);
    }

    //JOUEURS


    private void ajouterJoueurDansEquipe() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        String nom = view.saisirNom();
        String prenom = view.saisirPrenom();
        LocalDate dateNaissance = view.saisirDateNaissance();
        Poste poste = view.choisirPoste();
        double prix = view.saisirPrix();
        boolean titulaire = view.estTitulaire();

        Joueur joueur = FactoryHuman.createJoueur(nom, prenom, dateNaissance);
        joueur.setPrix(prix);
        joueur.setPoste(poste);
        joueur.setEstTitulaire(titulaire);

        model.ajouterJoueur(equipe, joueur);
        JsonExporter.exporter(model.recupererClubs());
        if (joueurs.size() >= 18) {
            System.out.println("Maximum 18 joueurs dans une équipe");
        }
        if (joueur.age() < 7) {
            System.out.println("Le joueur doit avoir au moins 7 ans");
        }
        long nbTitulaires = joueurs.stream()
                .filter(Joueur::isEstTitulaire)
                .count();
        if (joueur.isEstTitulaire() && nbTitulaires >= 11) {
            System.out.println("Maximum 11 titulaires");
        }
        boolean gardienTitulaireExiste = joueurs.stream()
                .anyMatch(j -> j.getPoste() == Poste.GARDIEN && j.isEstTitulaire());

        if (joueur.getPoste() == Poste.GARDIEN && joueur.isEstTitulaire() && gardienTitulaireExiste) {
            System.out.println("Un seul gardien titulaire autorisé");
        }
        AffichageConsole.afficherMessageAvecSautLigne("Joueur bien ajouté dans l'équipe !");
    }

    private void afficherJoueur() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        Set<Joueur> joueurs = equipe.getJoueur();
        view.afficherJoueurs(joueurs);
    }

    private void supprimerJoueurDansEquipe() {
        List<Club> clubs = model.recupererClubs();
        view.afficherClubs(clubs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixClub = view.saisirChoixMenu(clubs.size());
        Club club = clubs.get(choixClub - 1);

        Set<Equipe> equipes = club.getEquipes();
        view.afficherEquipes(equipes);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixEquipe = view.saisirChoixMenu(equipes.size());
        Equipe equipe = equipes.toArray(new Equipe[0])[choixEquipe - 1];

        Set<Joueur> joueurs = equipe.getJoueur();
        view.afficherJoueurs(joueurs);
        AffichageConsole.afficherMessageSansSautLigne("CHOIX : ");
        int choixJoueur = view.saisirChoixMenu(joueurs.size());
        Joueur joueur = joueurs.toArray(new Joueur[0])[choixJoueur - 1];

        model.supprimerJoueur(equipe, joueur);
        JsonExporter.exporter(model.recupererClubs());
        AffichageConsole.afficherMessageAvecSautLigne("Le joueur " + joueur.getNom() + " a bien été supprimé de l'équipe " + equipe.getNiveau().getNom() + " du " + club.getNom() + " !");
    }
}
