package models.entities.Manage;

import models.entities.Human.Entraineur;
import models.entities.Human.Joueur;
import models.referencies.Niveau;
import models.referencies.Poste;

import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Equipe {
    private Set<Joueur> joueurs = new HashSet<>();
    private Niveau niveau;
    private Entraineur entraineur;

    public Set<Joueur> getJoueur() {
        return Collections.unmodifiableSet(joueurs);
    }

    public void setJoueur(Set<Joueur> joueur) {
        this.joueurs = joueur;
    }

    public Niveau getNiveau() {
        return niveau;
    }

    public void setNiveau(Niveau niveau) {
        this.niveau = niveau;
    }

    public Entraineur getEntraineur() {
        return entraineur;
    }

    public void setEntraineur(Entraineur entraineur) {
        this.entraineur = entraineur;
    }

    Equipe(Niveau niveau, Entraineur entraineur) {
        setNiveau(niveau);
        setEntraineur(entraineur);
    }

    public void ajouterJoueur(Joueur joueur) {
        joueurs.add(joueur);
    }

    public void supprimerJoueur(Joueur joueur) {
        joueurs.remove(joueur);
    }

    public String toString() {
        return "Equipe de niveau " + niveau.getNom() +", entraîné par " + entraineur.presentation();
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Equipe equipe = (Equipe) o;
        return niveau == equipe.niveau && Objects.equals(entraineur, equipe.entraineur);
    }

    @Override
    public int hashCode() {
        return Objects.hash(niveau, entraineur);
    }

}
