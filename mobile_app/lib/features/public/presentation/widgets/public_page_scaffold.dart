import 'package:flutter/material.dart';

import '../../../settings/presentation/sehily_lang_switch.dart';
import '../../../student/presentation/widgets/sehily_brand.dart';
import '../../../student/presentation/widgets/student_widgets.dart';

/// En-tête public (logo + langue) comme la zone web avant connexion.
class PublicPageScaffold extends StatelessWidget {
  const PublicPageScaffold({
    super.key,
    required this.body,
    this.showBack = false,
  });

  final Widget body;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SehilyColors.cream,
      appBar: AppBar(
        automaticallyImplyLeading: showBack,
        title: showBack ? null : const SehilyAppBarTitle(),
        centerTitle: false,
        actions: const [
          SehilyLangSwitch(),
        ],
      ),
      body: body,
    );
  }
}
