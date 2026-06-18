import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

const _cardMuted = Color(0xFFF4F6F5);

/// Étapes du workflow dossier (aligné web / backend).
const _workflowSteps = [
  'BROUILLON',
  'SOUMIS',
  'EN_INSTRUCTION',
  'VALIDE',
  'REJETE',
];

int _timelineIndex(String statut) {
  const map = {
    'BROUILLON': 0,
    'SOUMIS': 1,
    'EN_INSTRUCTION': 2,
    'COMPLEMENT_DEMANDE': 2,
    'VALIDE': 3,
    'REJETE': 4,
  };
  return map[statut.toUpperCase()] ?? 0;
}

/// Progression réelle : position dans le workflow + paiement si dossier validé.
int _realProgressPercent(DossierBourse dossier) {
  final statut = dossier.statut.toUpperCase();
  final paiement = dossier.statutPaiement?.toUpperCase();

  if (statut == 'VALIDE') {
    if (paiement == 'EFFECTUE') return 100;
    if (paiement == 'ENVOYE' || paiement == 'EN_COURS') {
      // Validé, paiement en cours d'acheminement.
      return 90;
    }
    // Validé, en attente de paiement.
    return 75;
  }

  final idx = _timelineIndex(statut);
  if (_workflowSteps.length <= 1) return 0;
  return ((idx / (_workflowSteps.length - 1)) * 100).round();
}

String _statusLabel(DossierBourse dossier) {
  final statut = dossier.statut.toUpperCase();
  final paiement = dossier.statutPaiement?.toUpperCase();

  if (statut == 'VALIDE' && paiement == 'EFFECTUE') {
    return 'Paiement effectué';
  }
  if (statut == 'VALIDE' && (paiement == 'ENVOYE' || paiement == 'EN_COURS')) {
    return 'Paiement en cours';
  }

  switch (statut) {
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return 'En cours de traitement';
    case 'SOUMIS':
      return 'Dossier soumis';
    case 'BROUILLON':
      return 'Brouillon';
    case 'VALIDE':
      return 'Validé';
    case 'REJETE':
      return 'Rejeté';
    default:
      return dossier.statut;
  }
}

String _statusDescription(DossierBourse dossier) {
  final statut = dossier.statut.toUpperCase();
  final paiement = dossier.statutPaiement?.toUpperCase();

  if (statut == 'VALIDE' && paiement == 'EFFECTUE') {
    return 'Votre bourse a été versée. Consultez vos paiements pour le détail.';
  }
  if (statut == 'VALIDE' && (paiement == 'ENVOYE' || paiement == 'EN_COURS')) {
    return 'Votre dossier est validé. Le virement est en cours de traitement.';
  }

  switch (statut) {
    case 'BROUILLON':
      return 'Complétez et soumettez votre dossier pour démarrer l\'instruction.';
    case 'SOUMIS':
      return 'Votre dossier a été reçu et sera examiné prochainement.';
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return 'Votre dossier est en cours d\'étude par nos équipes.';
    case 'VALIDE':
      return 'Votre dossier a été validé par l\'administration.';
    case 'REJETE':
      return 'Votre dossier a été rejeté. Consultez les détails ci-dessous.';
    default:
      return 'Suivez l\'avancement de votre demande de bourse.';
  }
}

class StudentSuiviPage extends ConsumerWidget {
  const StudentSuiviPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suiviAsync = ref.watch(suiviProvider);
    final dossiersAsync = ref.watch(dossiersProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(suiviProvider);
        ref.invalidate(dossiersProvider);
        await ref.read(suiviProvider.future);
      },
      color: SehilyColors.green,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Text(
            'Historique des statuts et réclamations.',
            style: TextStyle(fontSize: 14, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 16),
          AsyncSection(
            value: suiviAsync,
            onRetry: () {
              ref.invalidate(suiviProvider);
              ref.invalidate(dossiersProvider);
            },
            builder: (rows) {
              final primary = dossiersAsync.maybeWhen(
                data: (d) => d.isNotEmpty ? d.first : null,
                orElse: () => null,
              );

              if (primary == null && rows.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _cardMuted,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    'Aucun historique.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                  ),
                );
              }

              final auteurValidation = primary != null && primary.statut.toUpperCase() == 'VALIDE'
                  ? 'Administration'
                  : '—';

              return Column(
                children: [
                  if (primary != null)
                    _StatusHeroCard(dossier: primary)
                  else
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _cardMuted,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text('Aucun dossier.'),
                    ),
                  if (primary != null) ...[
                    const SizedBox(height: 12),
                    _SuiviStatCard(
                      label: 'Auteur (validation)',
                      value: auteurValidation,
                    ),
                  ],
                  if (rows.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Historique',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _cardMuted,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: _SuiviTimeline(rows: rows),
                    ),
                  ] else if (primary != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _cardMuted,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          'Aucun historique.',
                          style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: SehilyColors.mintBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: SehilyColors.green.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.shield_outlined, color: SehilyColors.green),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Besoin d\'aide ?',
                                style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol),
                              ),
                              Text(
                                'Contactez le support CNOU pour toute question.',
                                style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, height: 1.35),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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

class _StatusHeroCard extends StatelessWidget {
  const _StatusHeroCard({required this.dossier});

  final DossierBourse dossier;

  @override
  Widget build(BuildContext context) {
    final pct = _realProgressPercent(dossier);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: SehilyColors.header,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Statut actuel',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13),
                ),
                const SizedBox(height: 6),
                Text(
                  _statusLabel(dossier),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _statusDescription(dossier),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 58,
            height: 58,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: pct / 100,
                  strokeWidth: 5,
                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                  color: Colors.white,
                ),
                Text(
                  '$pct%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _formatDateTime(String? iso) {
  if (iso == null) return '—';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return DateFormat('dd/MM/yyyy HH:mm').format(d.toLocal());
}

class _SuiviStatCard extends StatelessWidget {
  const _SuiviStatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
              color: SehilyColors.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: SehilyColors.petrol,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _SuiviTimeline extends StatelessWidget {
  const _SuiviTimeline({required this.rows});

  final List<SuiviEntry> rows;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < rows.length; i++)
          _SuiviTimelineItem(
            row: rows[i],
            isLast: i == rows.length - 1,
            isLatest: i == 0,
          ),
      ],
    );
  }
}

class _SuiviTimelineItem extends StatelessWidget {
  const _SuiviTimelineItem({
    required this.row,
    required this.isLast,
    required this.isLatest,
  });

  final SuiviEntry row;
  final bool isLast;
  final bool isLatest;

  @override
  Widget build(BuildContext context) {
    final showAuteur = row.auteur == 'Admin' || row.auteur == 'Support';
    final u = row.statut.toUpperCase();
    final isDone = ['VALIDE', 'EFFECTUE', 'PAYE', 'TRAITEE', 'SOUMIS'].contains(u);
    final isPending = ['EN_INSTRUCTION', 'EN_COURS', 'COMPLEMENT_DEMANDE', 'EN_ATTENTE'].any(u.contains);

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 40),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isLatest && isPending ? SehilyColors.pendingBg.withValues(alpha: 0.5) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isLatest && isPending
                      ? SehilyColors.pending.withValues(alpha: 0.25)
                      : Colors.black.withValues(alpha: 0.06),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          _formatDateTime(row.date),
                          style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ),
                      StatusBadge(status: row.statut),
                    ],
                  ),
                  if (showAuteur) ...[
                    const SizedBox(height: 6),
                    Text.rich(
                      TextSpan(
                        style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, height: 1.35),
                        children: [
                          TextSpan(
                            text: row.auteur,
                            style: const TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.petrol),
                          ),
                          if (row.commentaire.isNotEmpty) ...[
                            const TextSpan(text: ' · '),
                            TextSpan(text: row.commentaire),
                          ],
                        ],
                      ),
                    ),
                  ] else if (row.commentaire.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      row.commentaire,
                      style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, height: 1.35),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            top: 0,
            bottom: isLast ? null : 0,
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isDone
                        ? SehilyColors.green.withValues(alpha: 0.12)
                        : isLatest && isPending
                            ? SehilyColors.pendingBg
                            : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDone
                          ? SehilyColors.green
                          : isLatest && isPending
                              ? SehilyColors.pending
                              : Colors.black26,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    isDone
                        ? Icons.check
                        : isLatest && isPending
                            ? Icons.schedule
                            : Icons.circle,
                    size: isDone ? 16 : isLatest && isPending ? 14 : 8,
                    color: isDone
                        ? SehilyColors.green
                        : isLatest && isPending
                            ? SehilyColors.pending
                            : Colors.black26,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: isDone ? SehilyColors.green.withValues(alpha: 0.35) : Colors.black12,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
