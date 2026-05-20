package models.entities.Human;

import models.referencies.Poste;

import java.time.LocalDate;
import java.time.Period;
import java.util.Objects;

public class Joueur extends Personne{
    private double prix;
    private LocalDate dateNaissance;
    private Poste poste;
    private boolean estTitulaire;

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public LocalDate getDateNaissance() {
        return dateNaissance;
    }

    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }

    public int age() {
        return Period.between(dateNaissance, LocalDate.now()).getYears();
    }

    public int getAge() {
        return age();
    }

    public Poste getPoste() {
        return poste;
    }

    public void setPoste(Poste poste) {
        this.poste = poste;
    }

    public boolean isEstTitulaire() {
        return estTitulaire;
    }

    public void setEstTitulaire(boolean estTitulaire) {
        this.estTitulaire = estTitulaire;
    }

    @Override
    public String presentation() {
        return String.format(
                "Je suis %s %s, j'ai %d ans, je joue %s, je coûte %s et suis-je titulaire ? %s",
                getNom(),
                getPrenom(),
                age(),
                poste,
                formaterPrix(),
                isEstTitulaire()
        );
    }

    private String formaterPrix() {
        if (prix >= 1_000_000_000) {
            return String.format("%.1f Md€", prix / 1_000_000_000);
        } else if (prix >= 1_000_000) {
            double millions = prix / 1_000_000;

            // Si c'est un nombre entier (ex: 1.0), on affiche 1M€
            if (millions == Math.floor(millions)) {
                return String.format("%.0fM€", millions);
            }

            // Sinon on affiche 1.5M€, 2.3M€, etc.
            return String.format("%.1fM€", millions);
        } else if (prix >= 1_000) {
            double milliers = prix / 1_000;

            if (milliers == Math.floor(milliers)) {
                return String.format("%.0fk€", milliers);
            }

            return String.format("%.1fk€", milliers);
        } else {
            return String.format("%.0f€", prix);
        }
    }

    Joueur(String nom, String prenom,LocalDate dateNaissance) {
        super(nom, prenom);
        setDateNaissance(dateNaissance);
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        Joueur joueur = (Joueur) o;
        return Objects.equals(dateNaissance, joueur.dateNaissance);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), dateNaissance);
    }
}
