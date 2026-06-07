// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get loginTitle => 'تسجيل الدخول';

  @override
  String get loginSubtitle => 'قم بتسجيل الدخول للوصول إلى مساحة الطالب.';

  @override
  String get loginAction => 'دخول';

  @override
  String get goToRegister => 'إنشاء حساب';

  @override
  String get registerTitle => 'التسجيل';

  @override
  String get registerAction => 'تسجيل';

  @override
  String get backToLogin => 'العودة لتسجيل الدخول';

  @override
  String get email => 'البريد الإلكتروني';

  @override
  String get password => 'كلمة المرور';

  @override
  String get matricule => 'الرقم الجامعي';

  @override
  String get requiredField => 'حقل مطلوب';

  @override
  String get loginError => 'فشل تسجيل الدخول. تحقق من بياناتك.';

  @override
  String get registerError => 'فشل التسجيل. حاول مرة أخرى.';
}
