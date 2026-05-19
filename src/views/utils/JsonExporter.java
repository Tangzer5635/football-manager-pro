package views.utils;

import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;

import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

public final class JsonExporter {

    private JsonExporter() {
    }

    public static void exporter(List<Club> clubs) {
        try (FileWriter writer = new FileWriter("web/data.json")) {
            writer.write("{\n");
            writer.write("  \"clubs\": [\n");

            for (int i = 0; i < clubs.size(); i++) {
                Club club = clubs.get(i);

                writer.write("    {\n");
                writer.write("      \"nom\": \"" + escape(club.getNom()) + "\",\n");
                writer.write("      \"dateCreation\": \"" + club.getDateCreation() + "\",\n");

                // Équipes
                writer.write("      \"equipes\": [\n");

                Equipe[] equipes = club.getEquipes().toArray(new Equipe[0]);

                for (int j = 0; j < equipes.length; j++) {
                    Equipe equipe = equipes[j];

                    writer.write("        {\n");
                    writer.write("          \"niveau\": \"" + equipe.getNiveau().getNom() + "\",\n");
                    writer.write("          \"entraineur\": \"" +
                            escape(equipe.getEntraineur().presentation()) + "\",\n");

                    // Joueurs
                    writer.write("          \"joueurs\": [\n");

                    Joueur[] joueurs = equipe.getJoueur().toArray(new Joueur[0]);

                    for (int k = 0; k < joueurs.length; k++) {
                        Joueur joueur = joueurs[k];

                        writer.write("            {\n");
                        writer.write("              \"nom\": \"" + escape(joueur.getNom()) + "\",\n");
                        writer.write("              \"prenom\": \"" + escape(joueur.getPrenom()) + "\",\n");
                        writer.write("              \"poste\": \"" + joueur.getPoste() + "\",\n");
                        writer.write("              \"prix\": " + joueur.getPrix() + ",\n");
                        writer.write("              \"titulaire\": " + joueur.isEstTitulaire() + "\n");
                        writer.write("            }");

                        if (k < joueurs.length - 1) {
                            writer.write(",");
                        }

                        writer.write("\n");
                    }

                    writer.write("          ]\n");
                    writer.write("        }");

                    if (j < equipes.length - 1) {
                        writer.write(",");
                    }

                    writer.write("\n");
                }

                writer.write("      ]\n");
                writer.write("    }");

                if (i < clubs.size() - 1) {
                    writer.write(",");
                }

                writer.write("\n");
            }

            writer.write("  ]\n");
            writer.write("}\n");

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}