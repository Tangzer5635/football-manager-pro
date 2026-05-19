package start;

import com.formdev.flatlaf.FlatDarkLaf;
import models.facades.IModel;
import models.facades.ModelImpl;
import presenteur.Presenteur;
import server.ApiServer;
import views.facades.IView;
import views.facades.ViewConsoleImpl;

import java.awt.Desktop;
import java.net.URI;

public class Main {

    public static void main(String[] args) {
        FlatDarkLaf.setup();

        IModel model = new ModelImpl();

        // Démarrage de l'API
        ApiServer.start(model);

        // Ouvre automatiquement l'interface web
        try {
            Desktop.getDesktop().browse(
                    new URI("http://localhost:63342/SGT_LEBUHE_TEST_INT_JAVABASE_WB47/web/index.html")
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

//        // Interface Swing
//        IView view = new ViewConsoleImpl();
//        Presenteur presenteur = new Presenteur(model, view);
//        presenteur.start();
    }
}