import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../settings/presentation/sehily_lang_switch.dart';
import '../../../student/presentation/widgets/sehily_brand.dart';
import '../../../student/presentation/widgets/student_widgets.dart';

/// En-tête public (logo + langue) comme la zone web avant connexion.
class PublicPageScaffold extends StatelessWidget {
  const PublicPageScaffold({
    super.key,
    required this.body,
    this.showBack = false,
    this.pageTitle,
  });

  final Widget body;
  final bool showBack;
  final String? pageTitle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: showBack
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                tooltip: 'Retour à l\'accueil',
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/');
                  }
                },
              )
            : null,
        backgroundColor: SehilyColors.header,
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: showBack
            ? (pageTitle != null ? const SizedBox.shrink() : null)
            : const SehilyAppBarTitle(onLightBackground: false),
        centerTitle: false,
        actions: const [
          SehilyLangSwitch(),
        ],
        flexibleSpace: showBack && pageTitle != null
            ? SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 72),
                    child: Text(
                      pageTitle!,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                      ),
                    ),
                  ),
                ),
              )
            : null,
      ),
      body: body,
    );
  }
}
