import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

const _cardMuted = Color(0xFFF4F6F5);

int _progressPercent(String? statut) {
  switch (statut?.toUpperCase()) {
    case 'BROUILLON':
      return 20;
    case 'SOUMIS':
      return 40;
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return 60;
    case 'VALIDE':
      return 100;
    case 'REJETE':
      return 100;
    default:
      return 0;
  }
}

String _statusLabel(String statut) {
  switch (statut.toUpperCase()) {
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
    case 'SOUMIS':
    case 'BROUILLON':
      return 'En attente';
    case 'VALIDE':
      return 'Validé';
    case 'REJETE':
      return 'Rejeté';
    default:
      return statut;
  }
}

Color _statusColor(String statut) {
  switch (statut.toUpperCase()) {
    case 'VALIDE':
      return SehilyColors.coral;
    case 'REJETE':
      return SehilyColors.coral;
    default:
      return SehilyColors.pending;
  }
}

Color _statusBg(String statut) {
  switch (statut.toUpperCase()) {
    case 'VALIDE':
      return SehilyColors.coralBg;
    case 'REJETE':
      return const Color(0xFFFDECEA);
    default:
      return SehilyColors.pendingBg;
  }
}

String _statusDescription(String statut) {
  switch (statut.toUpperCase()) {
    case 'BROUILLON':
      return 'Complétez votre dossier et soumettez-le pour démarrer l\'instruction.';
    case 'SOUMIS':
      return 'Votre dossier a été reçu et sera examiné prochainement.';
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return 'Votre dossier est en cours d\'étude par nos équipes.';
    case 'VALIDE':
      return 'Félicitations ! Votre dossier a été validé.';
    case 'REJETE':
      return 'Votre dossier a été rejeté. Consultez les détails pour en savoir plus.';
    default:
      return 'Suivez l\'avancement de votre demande de bourse.';
  }
}

String _relativeTime(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  final local = dt.toLocal();
  final diff = DateTime.now().difference(local);
  if (diff.inMinutes < 1) return 'À l\'instant';
  if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'Il y a ${diff.inHours} h';
  if (diff.inDays == 1) return 'Il y a 1 jour';
  if (diff.inDays < 7) return 'Il y a ${diff.inDays} jours';
  if (diff.inDays < 30) {
    final weeks = (diff.inDays / 7).floor();
    return weeks == 1 ? 'Il y a 1 semaine' : 'Il y a $weeks semaines';
  }
  return DateFormat('dd/MM/yyyy').format(local);
}

class StudentDashboardPage extends ConsumerWidget {
  const StudentDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dossiersAsync = ref.watch(dossiersProvider);
    final profileAsync = ref.watch(profileProvider);
    final notifAsync = ref.watch(notificationsProvider);

    final displayName = profileAsync.maybeWhen(
      data: (profile) {
        final pe = profile['profil_etudiant'] as Map<String, dynamic>?;
        final prenom = (pe?['prenom'] ?? profile['first_name'] ?? '') as String;
        if (prenom.trim().isNotEmpty) return prenom.trim();
        final nom = (pe?['nom'] ?? profile['last_name'] ?? '') as String;
        final name = nom.trim();
        return name.isEmpty ? (profile['email'] as String? ?? 'Étudiant') : name;
      },
      orElse: () => 'Étudiant',
    );

    return RefreshIndicator(
      onRefresh: () async {
        invalidateStudentData(ref);
        await ref.read(dossiersProvider.future);
      },
      color: SehilyColors.green,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Text(
            'Bonjour, $displayName 👋',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: SehilyColors.petrol,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Voici un aperçu de votre dossier',
            style: TextStyle(
              fontSize: 14,
              color: SehilyColors.textSecondary,
            ),
          ),
          const SizedBox(height: 22),
          AsyncSection(
            value: dossiersAsync,
            onRetry: () => ref.invalidate(dossiersProvider),
            builder: (dossiers) {
              final dossier = dossiers.isNotEmpty ? dossiers.first : null;
              if (dossier == null) {
                return _EmptyDossierCard(onCreate: () => context.go('/student/dossier'));
              }
              return _StatusCard(dossier: dossier);
            },
          ),
          const SizedBox(height: 28),
          const Text(
            'Mes actions rapides',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: SehilyColors.petrol,
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
            children: const [
              _QuickAction(
                icon: Icons.note_add_outlined,
                label: 'Déposer un dossier',
                route: '/student/dossier',
              ),
              _QuickAction(
                icon: Icons.description_outlined,
                label: 'Mes documents',
                route: '/student/dossier',
              ),
              _QuickAction(
                icon: Icons.track_changes_outlined,
                label: 'Suivre mon dossier',
                route: '/student/suivi',
              ),
              _QuickAction(
                icon: Icons.credit_card_outlined,
                label: 'Paiements',
                route: '/student/paiements',
              ),
            ],
          ),
          const SizedBox(height: 28),
          const Text(
            'Notifications',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: SehilyColors.petrol,
            ),
          ),
          const SizedBox(height: 14),
          AsyncSection(
            value: notifAsync,
            onRetry: () => ref.invalidate(notificationsProvider),
            builder: (items) {
              if (items.isEmpty) {
                return _MutedCard(
                  child: Text(
                    'Aucune notification pour le moment.',
                    style: TextStyle(
                      color: SehilyColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                );
              }
              final recent = items.take(3).toList();
              return Column(
                children: [
                  for (var i = 0; i < recent.length; i++)
                    Padding(
                      padding: EdgeInsets.only(bottom: i < recent.length - 1 ? 10 : 0),
                      child: _NotificationTile(item: recent[i]),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _MutedCard extends StatelessWidget {
  const _MutedCard({required this.child, this.padding = const EdgeInsets.all(18)});

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: _cardMuted,
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}

class _EmptyDossierCard extends StatelessWidget {
  const _EmptyDossierCard({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return _MutedCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Statut de mon dossier',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
          ),
          const SizedBox(height: 14),
          Text(
            'Aucun dossier pour le moment. Créez votre dossier pour commencer votre demande de bourse.',
            style: TextStyle(
              color: SehilyColors.textSecondary,
              height: 1.45,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: onCreate,
              style: TextButton.styleFrom(
                foregroundColor: SehilyColors.green,
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Créer mon dossier →',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.dossier});

  final DossierBourse dossier;

  @override
  Widget build(BuildContext context) {
    final pct = _progressPercent(dossier.statut);
    final label = _statusLabel(dossier.statut);
    final color = _statusColor(dossier.statut);
    final bg = _statusBg(dossier.statut);
    final description = _statusDescription(dossier.statut);

    return _MutedCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Statut de mon dossier',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  label,
                  style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Progression',
            style: TextStyle(
              color: SehilyColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    minHeight: 8,
                    backgroundColor: Colors.white,
                    color: SehilyColors.green,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '$pct%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: SehilyColors.green,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            description,
            style: TextStyle(
              color: SehilyColors.textSecondary,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => context.go('/student/suivi'),
              style: TextButton.styleFrom(
                foregroundColor: SehilyColors.green,
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Voir les détails →',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.route});

  final IconData icon;
  final String label;
  final String route;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _cardMuted,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go(route),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: SehilyColors.green, size: 28),
              const SizedBox(height: 10),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: SehilyColors.green,
                  height: 1.25,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item});

  final StudentNotificationItem item;

  @override
  Widget build(BuildContext context) {
    final relative = _relativeTime(item.date);

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ColoredBox(
              color: SehilyColors.green,
              child: SizedBox(width: 5),
            ),
            Expanded(
              child: ColoredBox(
                color: SehilyColors.mintBg,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        humanizeNotificationMessage(item.message),
                        style: TextStyle(
                          fontWeight: item.lu ? FontWeight.w500 : FontWeight.bold,
                          color: SehilyColors.petrol,
                          fontSize: 14,
                          height: 1.35,
                        ),
                      ),
                      if (relative.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          relative,
                          style: TextStyle(
                            fontSize: 12,
                            color: SehilyColors.textMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
