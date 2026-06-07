import 'package:flutter/widgets.dart';

import 'app_localizations.dart';

extension L10nX on BuildContext {
  AppLocalizations get t => AppLocalizations.of(this)!;
}

