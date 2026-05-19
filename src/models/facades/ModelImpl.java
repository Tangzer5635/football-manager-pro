package models.facades;

import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.referencies.Niveau;
import views.utils.JsonExporter;
import com.google.gson.Gson;
import java.io.File;
import java.io.FileReader;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ModelImpl implements IModel {

    private static final List<Club> CLUBS = new ArrayList<>();

    public ModelImpl() {
        if (CLUBS.isEmpty()) {
            if (!chargerDepuisJson()) {
                init();           // Données par défaut (Lorient, joueurs, etc.)
                sauvegarderJson();
            }
        }
    }

    private static void init() {
        System.out.println("Nombre de clubs chargés : " + CLUBS.size());
        Club club = FactoryManage.createClub(
                "Football Club de Lorient",
                LocalDate.of(1926, 4, 2)
        );

        Entraineur entraineur = FactoryHuman.createEntraineur(
                "Le Buhé",
                "Tanguy"
        );

        Equipe equipe = FactoryManage.createEquipe(
                Niveau.LIGUE_1,
                entraineur
        );

        club.ajouterEquipe(equipe);

        CLUBS.add(club);
    }

    /**
     * Génère le fichier web/data.json.
     */
    private void sauvegarderJson() {
        System.out.println("Export JSON avec " + CLUBS.size() + " club(s)");
        JsonExporter.exporter(CLUBS);
    }

    private static class DataWrapper {
        List<ClubData> clubs;
    }

    private static class ClubData {
        String nom;
        String dateCreation;
        List<EquipeData> equipes;
    }

    private static class EquipeData {
        String niveau;
        String entraineur;
        List<JoueurData> joueurs;
    }

    private static class JoueurData {
        String nom;
        String prenom;
        String dateNaissance;
        String poste;
        double prix;
        boolean titulaire;
    }

    private boolean chargerDepuisJson() {
        File file = new File("web/data.json");

        if (!file.exists() || file.length() == 0) {
            return false;
        }

        try {
            com.google.gson.Gson gson = new com.google.gson.GsonBuilder()
                    .registerTypeAdapter(
                            java.time.LocalDate.class,
                            (com.google.gson.JsonDeserializer<java.time.LocalDate>)
                                    (json, type, context) ->
                                            java.time.LocalDate.parse(json.getAsString())
                    )
                    .create();

            try (FileReader reader = new FileReader(file)) {
                DataWrapper wrapper = gson.fromJson(reader, DataWrapper.class);

                if (wrapper == null || wrapper.clubs == null) {
                    return false;
                }

                // IMPORTANT : on recharge entièrement les données
                CLUBS.clear();

                for (ModelImpl.ClubData clubData : wrapper.clubs) {

                    // -------------------------
                    // Club
                    // -------------------------
                    LocalDate dateCreation = LocalDate.now();

                    if (clubData.dateCreation != null
                            && !clubData.dateCreation.isBlank()) {
                        dateCreation = LocalDate.parse(clubData.dateCreation);
                    }

                    Club club = FactoryManage.createClub(
                            clubData.nom,
                            dateCreation
                    );

                    // -------------------------
                    // Equipes
                    // -------------------------
                    if (clubData.equipes != null) {
                        for (ModelImpl.EquipeData equipeData
                                : clubData.equipes) {

                            // Reconstruction de l'entraîneur
                            String nomEnt = "Inconnu";
                            String prenomEnt = "";

                            if (equipeData.entraineur != null
                                    && !equipeData.entraineur.isBlank()) {

                                String[] parts =
                                        equipeData.entraineur.trim().split("\\s+", 2);

                                prenomEnt = parts[0];

                                if (parts.length > 1) {
                                    nomEnt = parts[1];
                                }
                            }

                            Entraineur entraineur =
                                    FactoryHuman.createEntraineur(
                                            nomEnt,
                                            prenomEnt
                                    );

                            // Niveau
                            Niveau niveau;

                            try {
                                niveau = Niveau.valueOf(equipeData.niveau);
                            } catch (Exception e) {
                                // Si jamais le JSON contient "L1", "L2", etc.
                                niveau = java.util.Arrays.stream(Niveau.values())
                                        .filter(n ->
                                                n.getNom().equalsIgnoreCase(
                                                        equipeData.niveau
                                                )
                                        )
                                        .findFirst()
                                        .orElse(Niveau.LIGUE_1);
                            }

                            Equipe equipe =
                                    FactoryManage.createEquipe(
                                            niveau,
                                            entraineur
                                    );

                            // -------------------------
                            // Joueurs
                            // -------------------------
                            if (equipeData.joueurs != null) {
                                for (ModelImpl.JoueurData joueurData
                                        : equipeData.joueurs) {

                                    LocalDate dateNaissance =
                                            LocalDate.of(2000, 1, 1);

                                    if (joueurData.dateNaissance != null
                                            && !joueurData.dateNaissance.isBlank()) {
                                        dateNaissance = LocalDate.parse(
                                                joueurData.dateNaissance
                                        );
                                    }

                                    Joueur joueur =
                                            FactoryHuman.createJoueur(
                                                    joueurData.nom,
                                                    joueurData.prenom,
                                                    dateNaissance
                                            );

                                    // Poste
                                    if (joueurData.poste != null
                                            && !joueurData.poste.isBlank()) {
                                        try {
                                            joueur.setPoste(
                                                    models.referencies.Poste.valueOf(
                                                            joueurData.poste
                                                    )
                                            );
                                        } catch (Exception ignored) {
                                        }
                                    }

                                    // Prix
                                    joueur.setPrix(joueurData.prix);

                                    // Titulaire
                                    joueur.setEstTitulaire(
                                            joueurData.titulaire
                                    );

                                    // Ajout du joueur à l'équipe
                                    equipe.ajouterJoueur(joueur);
                                }
                            }

                            // Ajout de l'équipe au club
                            club.ajouterEquipe(equipe);
                        }
                    }

                    // Ajout du club à la liste principale
                    CLUBS.add(club);
                }

                System.out.println(
                        "Chargement JSON : " + CLUBS.size() + " club(s)"
                );

                // IMPORTANT :
                // retourne true même s'il y a 0 club,
                // car le fichier existe déjà.
                return true;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ======================================================
    // CLUBS
    // ======================================================

    @Override
    public void ajouterClub(Club club) {
        CLUBS.add(club);
        sauvegarderJson();
    }

    @Override
    public void supprimerClub(Club club) {
        CLUBS.remove(club);
        sauvegarderJson();
    }

    // ======================================================
    // EQUIPES
    // ======================================================

    @Override
    public void ajouterEquipe(Club club, Equipe equipe) {
        club.ajouterEquipe(equipe);
        sauvegarderJson();
    }

    @Override
    public void supprimerEquipe(Club club, Equipe equipe) {
        club.supprimerEquipe(equipe);
        sauvegarderJson();
    }

    // ======================================================
    // JOUEURS
    // ======================================================

    @Override
    public void ajouterJoueur(Equipe equipe, Joueur joueur) {
        equipe.ajouterJoueur(joueur);
        sauvegarderJson();
    }

    @Override
    public void supprimerJoueur(Equipe equipe, Joueur joueur) {
        equipe.supprimerJoueur(joueur);
        sauvegarderJson();
    }

    // ======================================================
    // LECTURE
    // ======================================================

    @Override
    public List<Club> recupererClubs() {
        return Collections.unmodifiableList(CLUBS);
    }
}