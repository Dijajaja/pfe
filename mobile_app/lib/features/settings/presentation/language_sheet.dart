import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/providers.dart';

class LanguageSheet extends ConsumerWidget {
  const LanguageSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(localeProvider);

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: const Text('Français'),
            trailing: current.languageCode == 'fr' ? const Icon(Icons.check) : null,
            onTap: () {
              ref.read(localeProvider.notifier).state = const Locale('fr');
              Navigator.of(context).pop();
            },
          ),
          ListTile(
            title: const Text('العربية'),
            trailing: current.languageCode == 'ar' ? const Icon(Icons.check) : null,
            onTap: () {
              ref.read(localeProvider.notifier).state = const Locale('ar');
              Navigator.of(context).pop();
            },
          ),
          ListTile(
            title: const Text('English'),
            trailing: current.languageCode == 'en' ? const Icon(Icons.check) : null,
            onTap: () {
              ref.read(localeProvider.notifier).state = const Locale('en');
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }
}

