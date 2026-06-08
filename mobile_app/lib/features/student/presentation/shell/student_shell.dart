import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../settings/presentation/sehily_lang_switch.dart';
import '../profile/student_profile_sheet.dart';
import '../widgets/sehily_brand.dart';
import '../widgets/student_widgets.dart';

class StudentShell extends ConsumerStatefulWidget {
  const StudentShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends ConsumerState<StudentShell> {
  static const _mainPaths = [
    '/student/dashboard',
    '/student/dossier',
    '/student/suivi',
  ];

  static const _profilePaths = [
    '/student/paiements',
    '/student/reclamations',
    '/student/attestation',
    '/student/notifications',
    '/student/messages',
  ];

  int _selectedIndex(String location) {
    for (var i = 0; i < _mainPaths.length; i++) {
      if (location.startsWith(_mainPaths[i])) return i;
    }
    if (_profilePaths.any(location.startsWith)) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final selected = _selectedIndex(location);

    return Scaffold(
      backgroundColor: SehilyColors.cream,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const SehilyAppBarTitle(),
        centerTitle: false,
        actions: [
          IconButton(
            tooltip: 'Messagerie',
            onPressed: () => context.go('/student/messages'),
            icon: const Icon(Icons.mail_outline),
          ),
          const SehilyLangSwitch(),
        ],
      ),
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: [
                _BottomNavItem(
                  icon: Icons.home_outlined,
                  label: 'Accueil',
                  selected: selected == 0,
                  onTap: () => context.go(_mainPaths[0]),
                ),
                _BottomNavItem(
                  icon: Icons.folder_outlined,
                  label: 'Dossier',
                  selected: selected == 1,
                  onTap: () => context.go(_mainPaths[1]),
                ),
                _BottomNavItem(
                  icon: Icons.timeline_outlined,
                  label: 'Suivi',
                  selected: selected == 2,
                  onTap: () => context.go(_mainPaths[2]),
                ),
                _BottomNavItem(
                  icon: Icons.person_outline,
                  label: 'Profil',
                  selected: selected == 3,
                  onTap: () => showStudentProfileSheet(context),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (selected)
              Container(
                height: 3,
                width: 36,
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: SehilyColors.coral,
                  borderRadius: BorderRadius.circular(999),
                ),
              )
            else
              const SizedBox(height: 7),
            Icon(icon, size: 22, color: selected ? SehilyColors.coral : SehilyColors.petrol.withValues(alpha: 0.55)),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                color: selected ? SehilyColors.coral : SehilyColors.petrol.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
