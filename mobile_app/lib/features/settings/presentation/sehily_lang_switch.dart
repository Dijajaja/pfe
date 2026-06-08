import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/providers.dart';
import '../../student/presentation/widgets/student_widgets.dart';

/// Sélecteur FR / AR (style web).
class SehilyLangSwitch extends ConsumerWidget {
  const SehilyLangSwitch({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(localeProvider);

    return Container(
      margin: EdgeInsets.only(right: compact ? 4 : 8, top: compact ? 0 : 2, bottom: compact ? 0 : 2),
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _LangChip(
            label: 'FR',
            active: current.languageCode == 'fr',
            onTap: () => ref.read(localeProvider.notifier).state = const Locale('fr'),
          ),
          _LangChip(
            label: 'AR',
            active: current.languageCode == 'ar',
            onTap: () => ref.read(localeProvider.notifier).state = const Locale('ar'),
          ),
        ],
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? SehilyColors.petrol : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.white : const Color(0xFF647A75),
              fontSize: 12,
              fontWeight: FontWeight.w700,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}
