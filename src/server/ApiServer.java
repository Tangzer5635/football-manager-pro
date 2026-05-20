// =======================
// ApiServer.java
// =======================
package server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.facades.IModel;
import models.referencies.Niveau;
import models.referencies.Poste;
import views.utils.JsonExporter;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.Optional;

public class ApiServer {

    private ApiServer() {
    }

    public static void start(IModel model) {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

            // ==========================
            // GET /data
            // ==========================
            server.createContext("/data", exchange -> {
                addCors(exchange);

                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    send(exchange, 204, "");
                    return;
                }

                File file = new File("web/data.json");
                if (!file.exists()) {
                    send(exchange, 404, "{\"error\":\"data.json introuvable\"}");
                    return;
                }

                String json = Files.readString(file.toPath(), StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                send(exchange, 200, json);
            });

            // ==========================
            // POST /clubs
            // ==========================
            server.createContext("/clubs", exchange -> {
                addCors(exchange);

                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    send(exchange, 204, "");
                    return;
                }

                if ("POST".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    String nom = getParam(body, "nom");
                    String dateCreation = getParam(body, "dateCreation");

                    Club club = FactoryManage.createClub(
                            nom,
                            LocalDate.parse(dateCreation)
                    );

                    model.ajouterClub(club);

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Club créé\"}");
                    return;
                }

                if ("DELETE".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    // Le front envoie simplement : nom=NomDuClub
                    String nom = getParam(body, "nom");

                    Optional<Club> clubOpt = model.recupererClubs()
                            .stream()
                            .filter(c -> c.getNom().equals(nom))
                            .findFirst();

                    if (clubOpt.isPresent()) {
                        model.supprimerClub(clubOpt.get());
                    }

                    exchange.getResponseHeaders().set(
                            "Content-Type",
                            "application/json; charset=UTF-8"
                    );

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Club supprimé\"}");
                    return;
                }

                send(exchange, 405, "{\"error\":\"Méthode non autorisée\"}");
            });

            // ==========================
            // POST /equipes
            // ==========================
            server.createContext("/equipes", exchange -> {
                addCors(exchange);

                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    send(exchange, 204, "");
                    return;
                }

                if ("POST".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    String clubNom = getParam(body, "clubNom");
                    String niveauStr = getParam(body, "niveau");
                    String nomEnt = getParam(body, "nom");
                    String prenomEnt = getParam(body, "prenom");

                    Optional<Club> clubOpt = model.recupererClubs()
                            .stream()
                            .filter(c -> c.getNom().equals(clubNom))
                            .findFirst();

                    if (clubOpt.isEmpty()) {
                        send(exchange, 404, "{\"error\":\"Club introuvable\"}");
                        return;
                    }

                    Entraineur entraineur =
                            FactoryHuman.createEntraineur(nomEnt, prenomEnt);

                    Equipe equipe = FactoryManage.createEquipe(
                            Niveau.valueOf(niveauStr),
                            entraineur
                    );

                    model.ajouterEquipe(clubOpt.get(), equipe);
                    

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Équipe créée\"}");
                    return;
                }

                if ("DELETE".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    String clubNom = getParam(body, "clubNom");
                    String niveauStr = getParam(body, "niveau");

                    Optional<Club> clubOpt = model.recupererClubs()
                            .stream()
                            .filter(c -> c.getNom().equals(clubNom))
                            .findFirst();

                    if (clubOpt.isPresent()) {
                        Club club = clubOpt.get();

                        Optional<Equipe> equipeOpt = club.getEquipes()
                                .stream()
                                .filter(e -> e.getNiveau().name().equalsIgnoreCase(niveauStr) || e.getNiveau().getNom().equalsIgnoreCase(niveauStr))
                                .findFirst();

                        if (equipeOpt.isPresent()) {
                            model.supprimerEquipe(club, equipeOpt.get());
                            
                        }
                    }

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Équipe supprimée\"}");
                    return;
                }

                send(exchange, 405, "{\"error\":\"Méthode non autorisée\"}");
            });

            // ==========================
            // POST /joueurs
            // ==========================
            server.createContext("/joueurs", exchange -> {
                addCors(exchange);

                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    send(exchange, 204, "");
                    return;
                }

                if ("POST".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    String clubNom = getParam(body, "clubNom");
                    String niveauStr = getParam(body, "niveau");

                    String nom = getParam(body, "nom");
                    String prenom = getParam(body, "prenom");
                    String dateNaissance = getParam(body, "dateNaissance");
                    String posteStr = getParam(body, "poste");
                    String prixStr = getParam(body, "prix");
                    String titulaireStr = getParam(body, "titulaire");

                    Optional<Club> clubOpt = model.recupererClubs()
                            .stream()
                            .filter(c -> c.getNom().equals(clubNom))
                            .findFirst();

                    if (clubOpt.isEmpty()) {
                        send(exchange, 404, "{\"error\":\"Club introuvable\"}");
                        return;
                    }

                    Optional<Equipe> equipeOpt = clubOpt.get().getEquipes()
                            .stream()
                            .filter(e -> e.getNiveau().name().equalsIgnoreCase(niveauStr) || e.getNiveau().getNom().equalsIgnoreCase(niveauStr))
                            .findFirst();

                    if (equipeOpt.isEmpty()) {
                        send(exchange, 404, "{\"error\":\"Équipe introuvable\"}");
                        return;
                    }

                    Joueur joueur = FactoryHuman.createJoueur(
                            nom,
                            prenom,
                            LocalDate.parse(dateNaissance)
                    );

                    joueur.setPoste(Poste.valueOf(posteStr));
                    joueur.setPrix(Double.parseDouble(prixStr));
                    joueur.setEstTitulaire(Boolean.parseBoolean(titulaireStr));

                    model.ajouterJoueur(equipeOpt.get(), joueur);
                    

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Joueur ajouté\"}");
                    return;
                }

                if ("DELETE".equals(exchange.getRequestMethod())) {
                    String body = readBody(exchange);

                    String clubNom = getParam(body, "clubNom");
                    String niveauStr = getParam(body, "niveau");
                    String nom = getParam(body, "nom");
                    String prenom = getParam(body, "prenom");

                    Optional<Club> clubOpt = model.recupererClubs()
                            .stream()
                            .filter(c -> c.getNom().equals(clubNom))
                            .findFirst();

                    if (clubOpt.isPresent()) {
                        Optional<Equipe> equipeOpt = clubOpt.get().getEquipes()
                                .stream()
                                .filter(e -> e.getNiveau().name().equalsIgnoreCase(niveauStr) || e.getNiveau().getNom().equalsIgnoreCase(niveauStr))
                                .findFirst();

                        if (equipeOpt.isPresent()) {
                            Optional<Joueur> joueurOpt =
                                    equipeOpt.get().getJoueur()
                                            .stream()
                                            .filter(j ->
                                                    j.getNom().equals(nom)
                                                            && j.getPrenom().equals(prenom))
                                            .findFirst();

                            if (joueurOpt.isPresent()) {
                                model.supprimerJoueur(
                                        equipeOpt.get(),
                                        joueurOpt.get()
                                );
                                
                            }
                        }
                    }

                    send(exchange, 200,
                            "{\"success\":true,\"message\":\"Joueur supprimé\"}");
                    return;
                }

                send(exchange, 405, "{\"error\":\"Méthode non autorisée\"}");
            });

            server.start();
            System.out.println("API démarrée sur http://localhost:8080");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        return new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );
    }

    private static void addCors(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add(
                "Access-Control-Allow-Methods",
                "GET, POST, DELETE, OPTIONS"
        );
        exchange.getResponseHeaders().add(
                "Access-Control-Allow-Headers",
                "Content-Type"
        );
    }

    private static void send(
            HttpExchange exchange,
            int code,
            String body
    ) throws IOException {

        if (code == 204) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        exchange.sendResponseHeaders(code, bytes.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String getParam(String body, String key) {
        if (body == null || body.isBlank()) {
            return null;
        }

        for (String param : body.split("&")) {
            String[] pair = param.split("=", 2);

            if (pair.length == 2 && pair[0].equals(key)) {
                return URLDecoder.decode(
                        pair[1],
                        StandardCharsets.UTF_8
                );
            }
        }

        return null;
    }
}