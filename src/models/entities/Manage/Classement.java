package models.entities.Manage;

public class Classement {

    private Club club;

    private int points;
    private int victoires;
    private int nuls;
    private int defaites;

    private int butsPour;
    private int butsContre;

    public Classement(Club club) {
        this.club = club;
    }

    public Club getClub() {
        return club;
    }

    public int getPoints() {
        return points;
    }

    public int getVictoires() {
        return victoires;
    }

    public int getNuls() {
        return nuls;
    }

    public int getDefaites() {
        return defaites;
    }

    public int getButsPour() {
        return butsPour;
    }

    public int getButsContre() {
        return butsContre;
    }

    public int differenceDeBut() {
        return butsPour - butsContre;
    }

    public void ajouterVictoire() {
        victoires++;
        points += 3;
    }

    public void ajouterNul() {
        nuls++;
        points += 1;
    }

    public void ajouterDefaite() {
        defaites++;
    }

    public void ajouterButsPour(int buts) {
        butsPour += buts;
    }

    public void ajouterButsContre(int buts) {
        butsContre += buts;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public void setVictoires(int victoires) {
        this.victoires = victoires;
    }

    public void setNuls(int nuls) {
        this.nuls = nuls;
    }

    public void setDefaites(int defaites) {
        this.defaites = defaites;
    }

    public void setButsPour(int butsPour) {
        this.butsPour = butsPour;
    }

    public void setButsContre(int butsContre) {
        this.butsContre = butsContre;
    }

    @Override
    public String toString() {
        return String.format(
                "%s | %d pts | V:%d N:%d D:%d | BP:%d BC:%d Diff:%d",
                club.getNom(),
                points,
                victoires,
                nuls,
                defaites,
                butsPour,
                butsContre,
                differenceDeBut()
        );
    }
}