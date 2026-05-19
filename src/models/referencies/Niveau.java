package models.referencies;

public enum Niveau {
    LIGUE_1("L1"),
    LIGUE_2("L2"),
    NATIONAL_1("N1"),
    NATIONAL_2("N2"),
    NATIONAL_3("N3"),
    REGIONAL_1("R1"),
    REGIONAL_2("R2"),
    REGIONAL_3("R3"),
    DEPARTEMENTAL_1("D1"),
    DEPARTEMENTAL_2("D2"),
    DEPARTEMENTAL_3("D3"),
    DEPARTEMENTAL_4("D4");

    private final String libellé;

    Niveau(String nom) {
        this.libellé = nom;
    }

    public String getNom() {
        return libellé;
    }
}
