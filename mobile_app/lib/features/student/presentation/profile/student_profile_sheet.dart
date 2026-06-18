import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/application/auth_controller.dart';
import '../../application/student_providers.dart';
import '../widgets/student_widgets.dart';

void showStudentProfileSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const StudentProfileSheet(),
  );
}

class StudentProfileSheet extends ConsumerWidget {
  const StudentProfileSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final notifAsync = ref.watch(notificationsProvider);
    final unread = notifAsync.maybeWhen(
      data: (items) => items.where((n) => !n.lu).length,
      orElse: () => 0,
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.92,
      builder: (context, scrollController) {
        return DecoratedBox(
          decoration: const BoxDecoration(
            color: SehilyColors.cream,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: [
                    Text('Profil', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      color: SehilyColors.petrol,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: AsyncSection(
                  value: profileAsync,
                  onRetry: () => ref.invalidate(profileProvider),
                  builder: (profile) {
                    final pe = profile['profil_etudiant'] as Map<String, dynamic>?;
                    final prenom = (pe?['prenom'] ?? profile['first_name'] ?? '') as String;
                    final nom = (pe?['nom'] ?? profile['last_name'] ?? '') as String;
                    final email = (profile['email'] ?? '') as String;
                    final matricule = (pe?['matricule'] ?? '—') as String;
                    final etablissement = (pe?['etablissement'] ?? '—') as String;
                    final filiere = (pe?['filiere'] ?? '—') as String;
                    final displayName = '$prenom $nom'.trim().isEmpty ? email : '$prenom $nom'.trim();
                    final initials = _initials(prenom, nom, email);

                    return ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      children: [
                        SehilyCard(
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 32,
                                backgroundColor: SehilyColors.petrol,
                                child: Text(
                                  initials,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 22,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                displayName,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: SehilyColors.petrol,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(email, style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500)),
                              const SizedBox(height: 16),
                              _ProfileRow(label: 'Matricule', value: matricule),
                              _ProfileRow(label: 'Établissement', value: etablissement),
                              _ProfileRow(label: 'Filière', value: filiere),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text('Autres sections', style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        _NavTile(
                          icon: Icons.mail_outline,
                          label: 'Messagerie',
                          onTap: () {
                            Navigator.pop(context);
                            context.go('/student/messages');
                          },
                        ),
                        _NavTile(
                          icon: Icons.notifications_outlined,
                          label: 'Notifications',
                          badge: unread > 0 ? '$unread' : null,
                          onTap: () {
                            Navigator.pop(context);
                            context.go('/student/notifications');
                          },
                        ),
                        const SizedBox(height: 8),
                        Text('Finances & dossier', style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        _NavTile(
                          icon: Icons.payments_outlined,
                          label: 'Paiements',
                          onTap: () {
                            Navigator.pop(context);
                            context.go('/student/paiements');
                          },
                        ),
                        _NavTile(
                          icon: Icons.description_outlined,
                          label: 'Réclamations',
                          onTap: () {
                            Navigator.pop(context);
                            context.go('/student/reclamations');
                          },
                        ),
                        _NavTile(
                          icon: Icons.verified_outlined,
                          label: 'Attestation',
                          onTap: () {
                            Navigator.pop(context);
                            context.go('/student/attestation');
                          },
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              Navigator.pop(context);
                              await ref.read(authControllerProvider.notifier).logout();
                              if (context.mounted) context.go('/');
                            },
                            icon: const Icon(Icons.logout, size: 20),
                            label: const Text('Déconnexion'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: SehilyColors.coral,
                              side: const BorderSide(color: SehilyColors.coral),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _initials(String prenom, String nom, String email) {
    if (prenom.isNotEmpty && nom.isNotEmpty) {
      return '${prenom[0]}${nom[0]}'.toUpperCase();
    }
    if (prenom.isNotEmpty) return prenom[0].toUpperCase();
    if (email.isNotEmpty) return email[0].toUpperCase();
    return 'U';
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: TextStyle(color: SehilyColors.textSecondary, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.petrol)),
          ),
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(icon, color: SehilyColors.petrol, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.w500, color: SehilyColors.petrol),
                  ),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: SehilyColors.coral,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                Icon(Icons.chevron_right, color: SehilyColors.textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
