// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get loginTitle => 'Connexion';

  @override
  String get loginSubtitle =>
      'Connectez-vous pour accéder à votre espace étudiant.';

  @override
  String get loginAction => 'Se connecter';

  @override
  String get goToRegister => 'Créer un compte';

  @override
  String get registerTitle => 'Inscription';

  @override
  String get registerAction => 'S\'inscrire';

  @override
  String get backToLogin => 'Retour à la connexion';

  @override
  String get email => 'Email';

  @override
  String get password => 'Mot de passe';

  @override
  String get matricule => 'Matricule';

  @override
  String get requiredField => 'Champ obligatoire';

  @override
  String get loginError => 'Échec de connexion. Vérifiez vos informations.';

  @override
  String get registerError => 'Échec d\'inscription. Veuillez réessayer.';
}
