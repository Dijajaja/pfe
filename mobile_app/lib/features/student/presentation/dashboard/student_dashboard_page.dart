import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

const _orderedSteps = [
  ('BROUILLON', 'Brouillon créé'),
  ('SOUMIS', 'Dossier soumis'),
  ('EN_INSTRUCTION', 'En instruction CNOU'),
  ('VALIDE', 'Validé CNOU'),
  ('REJETE', 'Rejeté'),
];

int _timelineIndex(String? statut) {
  const map = {
    'BROUILLON': 0,
    'SOUMIS': 1,
    'EN_INSTRUCTION': 2,
    'COMPLEMENT_DEMANDE': 2,
    'VALIDE': 3,
    'REJETE': 4,
  };
  return map[statut?.toUpperCase()] ?? 0;
}

String _formatMru(double amount) {
  final raw = amount.toStringAsFixed(0);
  return raw.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
}

String _folderStatusLabel(String statut) {
  switch (statut.toUpperCase()) {
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return 'En instruction';
    case 'VALIDE':
      return 'Validé';
    case 'REJETE':
      return 'Rejeté';
    case 'SOUMIS':
      return 'Soumis';
    case 'BROUILLON':
      return 'Brouillon';
    default:
      return statut;
  }
}

Color _folderStatusColor(String statut) {
  switch (statut.toUpperCase()) {
    case 'VALIDE':
      return SehilyColors.green;
    case 'REJETE':
      return SehilyColors.coral;
    case 'EN_INSTRUCTION':
    case 'COMPLEMENT_DEMANDE':
      return const Color(0xFFE6A23C);
    case 'SOUMIS':
      return SehilyColors.petrol;
    default:
      return Colors.white70;
  }
}

class StudentDashboardPage extends ConsumerWidget {
  const StudentDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dossiersAsync = ref.watch(dossiersProvider);
    final anneesAsync = ref.watch(anneesProvider);
    final attestationAsync = ref.watch(attestationProvider);

    return RefreshIndicator(
      onRefresh: () async {
        invalidateStudentData(ref);
        await ref.read(dossiersProvider.future);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Mon espace', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('Suivez votre dossier.', style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.65))),
          const SizedBox(height: 16),
          AsyncSection(
            value: dossiersAsync,
            onRetry: () => ref.invalidate(dossiersProvider),
            builder: (dossiers) {
              final dossier = dossiers.isNotEmpty ? dossiers.first : null;
              final canAttestation = attestationAsync.maybeWhen(
                data: (s) => s.eligible,
                orElse: () => false,
              );
              if (dossier == null) {
                return SehilyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Aucun dossier pour le moment.'),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => context.go('/student/dossier'),
                        child: const Text('Créer mon dossier'),
                      ),
                    ],
                  ),
                );
              }

              final anneeLibelle = anneesAsync.maybeWhen(
                data: (annees) => annees
                    .where((a) => a.id == dossier.anneeUniversitaire)
                    .map((a) => a.libelle)
                    .firstOrNull,
                orElse: () => null,
              );
              final campagne = anneeLibelle ?? dossier.niveau;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _MonDossierCard(
                    dossier: dossier,
                    campagne: campagne,
                    canAttestation: canAttestation,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: SehilyColors.green.withValues(alpha: 0.12)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          color: SehilyColors.cream,
                          child: const Text(
                            'Suivi détaillé du dossier',
                            style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: _Timeline(dossier: dossier),
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

class _MonDossierCard extends StatelessWidget {
  const _MonDossierCard({
    required this.dossier,
    required this.campagne,
    required this.canAttestation,
  });

  final DossierBourse dossier;
  final String campagne;
  final bool canAttestation;

  @override
  Widget build(BuildContext context) {
    final idx = _timelineIndex(dossier.statut);
    final pct = (_orderedSteps.length <= 1) ? 0 : ((idx / (_orderedSteps.length - 1)) * 100).round();
    final statusColor = _folderStatusColor(dossier.statut);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SehilyColors.green.withValues(alpha: 0.18)),
        boxShadow: [
          BoxShadow(
            color: SehilyColors.petrol.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            color: SehilyColors.petrol,
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Mon dossier',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                  ),
                  child: Text(
                    _folderStatusLabel(dossier.statut),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _kvRow('Numéro dossier', 'DOS-${dossier.id.toString().padLeft(6, '0')}'),
                const SizedBox(height: 10),
                _kvRow('Campagne universitaire', campagne),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: SehilyColors.dossierAlertBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SehilyColors.coral.withValues(alpha: 0.12)),
                  ),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text('Montant prévu', style: TextStyle(color: Colors.black54, fontSize: 14)),
                      ),
                      Text(
                        '${_formatMru(dossier.montantBourse)} MRU',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: SehilyColors.petrol,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Avancement du dossier', style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.6), fontSize: 13)),
                    Text('$pct %', style: const TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    minHeight: 10,
                    backgroundColor: SehilyColors.cream,
                    color: SehilyColors.green,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: List.generate(_orderedSteps.length, (i) {
                    final done = i < idx;
                    final current = i == idx;
                    return Expanded(
                      child: Container(
                        height: 6,
                        margin: EdgeInsets.only(right: i < _orderedSteps.length - 1 ? 4 : 0),
                        decoration: BoxDecoration(
                          color: done || current ? SehilyColors.green : SehilyColors.cream,
                          borderRadius: BorderRadius.circular(999),
                          border: current ? Border.all(color: SehilyColors.petrol, width: 1) : null,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 14),
                const SizedBox(height: 14),
                if (canAttestation)
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: FilledButton(
                          onPressed: () => context.go('/student/attestation'),
                          style: FilledButton.styleFrom(
                            backgroundColor: SehilyColors.petrol,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Obtenir mon attestation', textAlign: TextAlign.center),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: OutlinedButton(
                          onPressed: () => context.go('/student/dossier'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: SehilyColors.petrol,
                            side: const BorderSide(color: SehilyColors.petrol),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Voir le dossier'),
                        ),
                      ),
                    ],
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => context.go('/student/dossier'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: SehilyColors.petrol,
                        side: const BorderSide(color: SehilyColors.petrol),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Voir le dossier'),
                    ),
                  ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => context.go('/student/reclamations'),
                    style: TextButton.styleFrom(
                      backgroundColor: SehilyColors.dossierAlertBg,
                      foregroundColor: SehilyColors.coral,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Passer une réclamation'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _kvRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: const TextStyle(color: Colors.black54, fontSize: 14)),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol, fontSize: 14),
          ),
        ),
      ],
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.dossier});
  final DossierBourse dossier;

  @override
  Widget build(BuildContext context) {
    final idx = _timelineIndex(dossier.statut);
    final isRejected = dossier.statut.toUpperCase() == 'REJETE';

    return Column(
      children: List.generate(_orderedSteps.length, (i) {
        final step = _orderedSteps[i];
        final done = i < idx;
        final current = i == idx;
        final isRejectStep = step.$1 == 'REJETE' && current && isRejected;

        Color iconColor;
        Color bgColor;
        IconData icon;
        String pill;
        Color pillColor;
        Color pillBg;

        if (isRejectStep) {
          icon = Icons.cancel;
          iconColor = SehilyColors.coral;
          bgColor = SehilyColors.coral.withValues(alpha: 0.1);
          pill = 'Actuel';
          pillColor = SehilyColors.coral;
          pillBg = SehilyColors.coral.withValues(alpha: 0.12);
        } else if (done) {
          icon = Icons.check_circle;
          iconColor = SehilyColors.green;
          bgColor = SehilyColors.green.withValues(alpha: 0.08);
          pill = 'Terminé';
          pillColor = SehilyColors.green;
          pillBg = SehilyColors.green.withValues(alpha: 0.12);
        } else if (current) {
          icon = Icons.arrow_forward;
          iconColor = SehilyColors.petrol;
          bgColor = SehilyColors.petrol.withValues(alpha: 0.08);
          pill = 'En cours';
          pillColor = SehilyColors.petrol;
          pillBg = SehilyColors.petrol.withValues(alpha: 0.1);
        } else {
          icon = Icons.circle_outlined;
          iconColor = Colors.grey.shade400;
          bgColor = SehilyColors.cream;
          pill = 'À venir';
          pillColor = Colors.black54;
          pillBg = SehilyColors.cream;
        }

        String? dateLabel;
        if (step.$1 == 'BROUILLON') dateLabel = _fmt(dossier.creeLe);
        if (step.$1 == 'SOUMIS') dateLabel = _fmt(dossier.dateSoumission);
        if (current && (step.$1 == 'EN_INSTRUCTION' || step.$1 == 'VALIDE' || step.$1 == 'REJETE')) {
          dateLabel = _fmt(dossier.modifieLe);
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
            ),
            child: Row(
              children: [
                Icon(icon, color: iconColor, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(step.$2, style: const TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.petrol)),
                      const SizedBox(height: 2),
                      Text(
                        dateLabel ?? 'Date à confirmer',
                        style: TextStyle(fontSize: 12, color: SehilyColors.petrol.withValues(alpha: 0.55)),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: pillBg,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(pill, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: pillColor)),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  String? _fmt(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    final d = DateTime.tryParse(iso);
    if (d == null) return null;
    return DateFormat('dd/MM/yyyy HH:mm').format(d.toLocal());
  }
}
