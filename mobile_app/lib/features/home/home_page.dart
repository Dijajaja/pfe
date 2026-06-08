import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../settings/presentation/sehily_lang_switch.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SEHILY Mobile'),
        actions: const [
          SehilyLangSwitch(),
        ],
      ),
      body: const Center(
        child: Text(
          'Base Dev A prête:\nAuth + Guards + i18n + Notifications',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

