package models.entities.Manage;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Club {

    private Set<Equipe> equipes = new HashSet<>();
    private LocalDate dateCreation;
    private String nom;

    Club(String nom, LocalDate dateCreation) {
        setNom(nom);
        setDateCreation(dateCreation);
    }

    public void ajouterEquipe(Equipe equipe) {
        equipes.add(equipe);
    }

    public void supprimerEquipe(Equipe equipe) {
        equipes.remove(equipe);
    }

    public Set<Equipe> getEquipes() {
        return Collections.unmodifiableSet(equipes);
    }

    public LocalDate getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDate dateCreation) {
        if (dateCreation.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de création ne peut pas être dans le futur");
        }
        this.dateCreation = dateCreation;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Club club = (Club) o;
        return Objects.equals(dateCreation, club.dateCreation)
                && Objects.equals(nom, club.nom);
    }

    @Override
    public int hashCode() {
        return Objects.hash(dateCreation, nom);
    }
}