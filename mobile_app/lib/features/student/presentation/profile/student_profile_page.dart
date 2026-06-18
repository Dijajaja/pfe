import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/application/auth_controller.dart';
import '../../application/student_providers.dart';
import '../widgets/student_widgets.dart';

class StudentProfilePage extends ConsumerWidget {
  const StudentProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final notifAsync = ref.watch(notificationsProvider);
    final unread = notifAsync.maybeWhen(
      data: (items) => items.where((n) => !n.lu).length,
      orElse: () => 0,
    );

    return AsyncSection(
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
          padding: const EdgeInsets.all(16),
          children: [
            SehilyCard(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: SehilyColors.mintBg,
                    child: Text(
                      initials,
                      style: const TextStyle(
                        color: SehilyColors.petrol,
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    displayName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
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
            const SizedBox(height: 20),
            Text('Mon compte', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            _NavTile(
              icon: Icons.mail_outline,
              label: 'Messagerie',
              onTap: () => context.go('/student/messages'),
            ),
            _NavTile(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              badge: unread > 0 ? '$unread' : null,
              onTap: () => context.go('/student/notifications'),
            ),
            const SizedBox(height: 12),
            Text('Finances & dossier', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            _NavTile(
              icon: Icons.payments_outlined,
              label: 'Paiements',
              onTap: () => context.go('/student/paiements'),
            ),
            _NavTile(
              icon: Icons.description_outlined,
              label: 'Réclamations',
              onTap: () => context.go('/student/reclamations'),
            ),
            _NavTile(
              icon: Icons.verified_outlined,
              label: 'Attestation',
              onTap: () => context.go('/student/attestation'),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) context.go('/');
                },
                icon: const Icon(Icons.logout, size: 20),
                label: const Text('Déconnexion'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: SehilyColors.petrol,
                  side: BorderSide(color: SehilyColors.petrol.withValues(alpha: 0.35)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
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
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: SehilyColors.mintBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: SehilyColors.green, size: 22),
                ),
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
                Icon(Icons.chevron_right, color: SehilyColors.petrol.withValues(alpha: 0.35)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
