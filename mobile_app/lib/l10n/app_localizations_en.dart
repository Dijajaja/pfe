// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get loginTitle => 'Login';

  @override
  String get loginSubtitle => 'Sign in to access your student space.';

  @override
  String get loginAction => 'Sign in';

  @override
  String get goToRegister => 'Create an account';

  @override
  String get registerTitle => 'Register';

  @override
  String get registerAction => 'Register';

  @override
  String get backToLogin => 'Back to login';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get matricule => 'Student ID';

  @override
  String get requiredField => 'Required field';

  @override
  String get loginError => 'Login failed. Please check your credentials.';

  @override
  String get registerError => 'Registration failed. Please try again.';
}
