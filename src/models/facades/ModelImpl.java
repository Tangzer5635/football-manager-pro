package models.facades;

import models.dao.ChampionnatDAO;
import models.dao.ClassementDAO;
import models.dao.ClubDAO;
import models.dao.EquipeDAO;
import models.dao.JoueurDAO;
import models.entities.Human.Entraineur;
import models.entities.Human.FactoryHuman;
import models.entities.Human.Joueur;
import models.entities.Manage.Championnat;
import models.entities.Manage.Classement;
import models.entities.Manage.Club;
import models.entities.Manage.Equipe;
import models.entities.Manage.FactoryManage;
import models.referencies.Niveau;
import models.referencies.Poste;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public class ModelImpl implements IModel {

    private final ClubDAO clubDAO = new ClubDAO();
    private final EquipeDAO equipeDAO = new EquipeDAO();
    private final JoueurDAO joueurDAO = new JoueurDAO();
    private final ChampionnatDAO championnatDAO = new ChampionnatDAO();
    private final ClassementDAO classementDAO = new ClassementDAO();

    public ModelImpl() {
        List<Club> clubs = clubDAO.findAll();
        if (clubs.isEmpty()) {
            init();
        }
    }

    private void init() {
        Club club = FactoryManage.createClub(
                "Football Club de Lorient",
                LocalDate.of(1926, 4, 2)
        );

        Entraineur entraineur = FactoryHuman.createEntraineur("Le Buhé", "Tanguy");
        Equipe equipe = FactoryManage.createEquipe(Niveau.LIGUE_1, entraineur);

        Joueur joueur = FactoryHuman.createJoueur("Mvogo", "Yvon", LocalDate.of(1994, 6, 6));
        joueur.setPoste(Poste.GARDIEN);
        joueur.setPrix(2_000_000);
        joueur.setEstTitulaire(true);

        equipe.ajouterJoueur(joueur);
        club.ajouterEquipe(equipe);

        ajouterClub(club);

        Championnat ligue1 = new Championnat("Ligue 1", "2025-2026");
        ligue1.ajouterClub(club);
    }

    @Override
    public void ajouterClub(Club club) {
        clubDAO.insert(club);
    }

    @Override
    public void supprimerClub(Club club) {
        clubDAO.delete(club);
    }

    @Override
    public void ajouterEquipe(Club club, Equipe equipe) {
        equipeDAO.insert(equipe);
    }

    @Override
    public void supprimerEquipe(Club club, Equipe equipe) {
        equipeDAO.delete(equipe);
    }

    @Override
    public void ajouterJoueur(Equipe equipe, Joueur joueur) {
        boolean estTitulaire = joueur.isEstTitulaire();
        joueurDAO.insert(equipe, joueur);
        joueur.setEstTitulaire(estTitulaire);
    }

    @Override
    public void supprimerJoueur(Equipe equipe, Joueur joueur) {
        joueurDAO.delete(joueur);
    }

    @Override
    public List<Club> recupererClubs() {
        return clubDAO.findAll();
    }

    @Override
    public Set<Equipe> recupererEquipesDuClub(int idClub) {
        return equipeDAO.findByClub(idClub);
    }

    @Override
    public Set<Joueur> recupererJoueursDeLEquipe(int idEquipe) {
        return joueurDAO.findByEquipe(idEquipe);
    }

    public void ajouterChampionnat(Championnat championnat) {
        championnatDAO.insert(championnat);
    }

    public void ajouterClubClassement(Championnat championnat, Club club) {
        championnatDAO.ajouterClubAuClassement(championnat, club);
    }

    public List<Classement> recupererClassement() {
        return classementDAO.findAll();
    }
}
