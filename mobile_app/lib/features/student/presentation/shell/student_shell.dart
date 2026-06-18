import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../settings/presentation/sehily_lang_switch.dart';
import '../../application/student_providers.dart';
import '../widgets/student_widgets.dart';

class StudentShell extends ConsumerStatefulWidget {
  const StudentShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends ConsumerState<StudentShell> {
  static const _tabs = [
    ('/student/dashboard', 'Accueil', Icons.home_outlined),
    ('/student/dossier', 'Dossier', Icons.folder_outlined),
    ('/student/suivi', 'Suivi', Icons.track_changes_outlined),
    ('/student/profil', 'Profil', Icons.person_outline),
  ];

  static const _tabTitles = {
    '/student/dashboard': 'Mon tableau de bord',
    '/student/dossier': 'Mon dossier',
    '/student/suivi': 'Suivi de mon dossier',
    '/student/profil': 'Profil',
  };

  static const _linkedPaths = [
    '/student/paiements',
    '/student/reclamations',
    '/student/attestation',
    '/student/notifications',
    '/student/messages',
  ];

  int _selectedIndex(String location) {
    for (var i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].$1)) return i;
    }
    if (_linkedPaths.any(location.startsWith)) return 0;
    return 0;
  }

  String _title(String location) {
    for (final entry in _tabTitles.entries) {
      if (location.startsWith(entry.key)) return entry.value;
    }
    if (location.startsWith('/student/paiements')) return 'Paiements';
    if (location.startsWith('/student/notifications')) return 'Notifications';
    if (location.startsWith('/student/messages')) return 'Messagerie';
    if (location.startsWith('/student/reclamations')) return 'Réclamations';
    if (location.startsWith('/student/attestation')) return 'Attestation';
    return 'Mon espace';
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final selected = _selectedIndex(location);
    final notifAsync = ref.watch(notificationsProvider);
    final unread = notifAsync.maybeWhen(
      data: (items) => items.where((n) => !n.lu).length,
      orElse: () => 0,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: SehilyColors.header,
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
        actionsIconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          _title(location),
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                tooltip: 'Notifications',
                onPressed: () => context.go('/student/notifications'),
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
              ),
              if (unread > 0)
                Positioned(
                  right: 10,
                  top: 10,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: SehilyColors.coral, shape: BoxShape.circle),
                  ),
                ),
            ],
          ),
          const SehilyLangSwitch(),
        ],
      ),
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: [
                for (var i = 0; i < _tabs.length; i++)
                  _BottomNavItem(
                    icon: _tabs[i].$3,
                    label: _tabs[i].$2,
                    selected: selected == i,
                    onTap: () => context.go(_tabs[i].$1),
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
    final color = selected ? SehilyColors.coral : SehilyColors.textMuted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
