package models.facades;

import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.referencies.Niveau;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ModelImpl implements IModel {

    private static final List<Club> CLUBS = new ArrayList<>();
    private static final Path JSON_PATH = Path.of("web/data.json");

    public ModelImpl() {
        if (CLUBS.isEmpty()) {
            if (!chargerDepuisJson()) {
                init();

                try {
                    sauvegarderJson();
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        }
    }

    // ======================================================
    // DONNÉES PAR DÉFAUT
    // ======================================================

    private static void init() {
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

    // ======================================================
    // SAUVEGARDE JSON
    // ======================================================

    private static void sauvegarderJson() throws IOException {
        StringBuilder json = new StringBuilder();

        json.append("{\n");
        json.append("  \"clubs\": [\n");

        for (int i = 0; i < CLUBS.size(); i++) {
            Club club = CLUBS.get(i);

            json.append("    {\n");
            json.append("      \"nom\": \"")
                    .append(escapeJson(club.getNom()))
                    .append("\",\n");

            json.append("      \"dateCreation\": \"")
                    .append(club.getDateCreation())
                    .append("\",\n");

            json.append("      \"equipes\": [\n");

            List<Equipe> equipes = new ArrayList<>(club.getEquipes());

            for (int j = 0; j < equipes.size(); j++) {
                Equipe equipe = equipes.get(j);

                json.append("        {\n");

                json.append("          \"niveau\": \"")
                        .append(escapeJson(equipe.getNiveau().getNom()))
                        .append("\",\n");

                json.append("          \"entraineur\": \"")
                        .append(escapeJson(
                                equipe.getEntraineur().getPrenom()
                                        + " "
                                        + equipe.getEntraineur().getNom()
                        ))
                        .append("\",\n");

                json.append("          \"joueurs\": [\n");

                List<Joueur> joueurs = new ArrayList<>(equipe.getJoueur());

                for (int k = 0; k < joueurs.size(); k++) {
                    Joueur joueur = joueurs.get(k);

                    json.append("            {\n");

                    // Nom
                    json.append("              \"nom\": \"")
                            .append(escapeJson(joueur.getNom()))
                            .append("\",\n");

                    // Prénom
                    json.append("              \"prenom\": \"")
                            .append(escapeJson(joueur.getPrenom()))
                            .append("\",\n");

                    // Date de naissance
                    json.append("              \"dateNaissance\": \"")
                            .append(
                                    joueur.getDateNaissance() != null
                                            ? joueur.getDateNaissance().toString()
                                            : ""
                            )
                            .append("\",\n");

                    // Âge calculé automatiquement
                    json.append("              \"age\": ")
                            .append(
                                    joueur.getDateNaissance() != null
                                            ? joueur.getAge()
                                            : 0
                            )
                            .append(",\n");

                    // Poste
                    json.append("              \"poste\": \"")
                            .append(
                                    joueur.getPoste() != null
                                            ? joueur.getPoste().toString()
                                            : ""
                            )
                            .append("\",\n");

                    // Prix
                    json.append("              \"prix\": ")
                            .append(joueur.getPrix())
                            .append(",\n");

                    // Titulaire
                    json.append("              \"titulaire\": ")
                            .append(joueur.isEstTitulaire())
                            .append("\n");

                    json.append("            }");

                    if (k < joueurs.size() - 1) {
                        json.append(",");
                    }

                    json.append("\n");
                }

                json.append("          ]\n");
                json.append("        }");

                if (j < equipes.size() - 1) {
                    json.append(",");
                }

                json.append("\n");
            }

            json.append("      ]\n");
            json.append("    }");

            if (i < CLUBS.size() - 1) {
                json.append(",");
            }

            json.append("\n");
        }

        json.append("  ]\n");
        json.append("}\n");

        // Crée le dossier web si nécessaire
        if (JSON_PATH.getParent() != null) {
            Files.createDirectories(JSON_PATH.getParent());
        }

        // Écrit dans web/data.json
        Files.writeString(
                JSON_PATH,
                json.toString(),
                StandardCharsets.UTF_8
        );
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ======================================================
    // CLASSES POUR GSON
    // ======================================================

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

    // ======================================================
    // CHARGEMENT JSON
    // ======================================================

    private boolean chargerDepuisJson() {
        File file = JSON_PATH.toFile();

        if (!file.exists() || file.length() == 0) {
            return false;
        }

        try (FileReader reader = new FileReader(file)) {
            com.google.gson.Gson gson = new com.google.gson.Gson();

            DataWrapper wrapper = gson.fromJson(reader, DataWrapper.class);

            if (wrapper == null || wrapper.clubs == null) {
                return false;
            }

            CLUBS.clear();

            for (ClubData clubData : wrapper.clubs) {
                LocalDate dateCreation = LocalDate.parse(clubData.dateCreation);

                Club club = FactoryManage.createClub(
                        clubData.nom,
                        dateCreation
                );

                if (clubData.equipes != null) {
                    for (EquipeData equipeData : clubData.equipes) {

                        // Entraîneur
                        String prenomEnt = "";
                        String nomEnt = "Inconnu";

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

                        // Joueurs
                        if (equipeData.joueurs != null) {
                            for (JoueurData joueurData : equipeData.joueurs) {

                                LocalDate dateNaissance =
                                        LocalDate.of(2000, 1, 1);

                                if (joueurData.dateNaissance != null
                                        && !joueurData.dateNaissance.isBlank()) {
                                    dateNaissance =
                                            LocalDate.parse(
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

                                equipe.ajouterJoueur(joueur);
                            }
                        }

                        club.ajouterEquipe(equipe);
                    }
                }

                CLUBS.add(club);
            }

            return true;

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
        sauvegarder();
    }

    @Override
    public void supprimerClub(Club club) {
        CLUBS.remove(club);
        sauvegarder();
    }

    // ======================================================
    // ÉQUIPES
    // ======================================================

    @Override
    public void ajouterEquipe(Club club, Equipe equipe) {
        club.ajouterEquipe(equipe);
        sauvegarder();
    }

    @Override
    public void supprimerEquipe(Club club, Equipe equipe) {
        club.supprimerEquipe(equipe);
        sauvegarder();
    }

    // ======================================================
    // JOUEURS
    // ======================================================

    @Override
    public void ajouterJoueur(Equipe equipe, Joueur joueur) {
        equipe.ajouterJoueur(joueur);
        sauvegarder();
    }

    @Override
    public void supprimerJoueur(Equipe equipe, Joueur joueur) {
        equipe.supprimerJoueur(joueur);
        sauvegarder();
    }

    // ======================================================
    // LECTURE
    // ======================================================

    @Override
    public List<Club> recupererClubs() {
        return Collections.unmodifiableList(CLUBS);
    }

    // ======================================================
    // MÉTHODE UTILITAIRE
    // ======================================================

    private void sauvegarder() {
        try {
            sauvegarderJson();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}