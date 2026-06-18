import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

class StudentPaiementsPage extends ConsumerWidget {
  const StudentPaiementsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paiementsAsync = ref.watch(paiementsProvider);
    final anneesAsync = ref.watch(anneesProvider);

    final anneeLabel = anneesAsync.maybeWhen(
      data: (annees) {
        if (annees.isEmpty) return '2025-2026';
        final active = annees.where((a) => a.actif).toList();
        return (active.isNotEmpty ? active.first : annees.first).libelle;
      },
      orElse: () => '2025-2026',
    );

    return ColoredBox(
      color: SehilyColors.cream,
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(paiementsProvider);
          ref.invalidate(anneesProvider);
          await ref.read(paiementsProvider.future);
        },
        color: SehilyColors.green,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            const Text(
              'Mes paiements',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 20,
                color: SehilyColors.petrol,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Suivi des paiements par période.',
              style: TextStyle(fontSize: 14, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 20),
            AsyncSection(
              value: paiementsAsync,
              onRetry: () => ref.invalidate(paiementsProvider),
              builder: (rows) {
                if (rows.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'Aucun paiement enregistré.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                    ),
                  );
                }

                final totalRecu = rows
                    .where((p) => p.statut.toUpperCase() == 'EFFECTUE')
                    .fold<double>(0, (acc, p) => acc + p.montant);
                final allUpToDate = rows.every((p) => p.statut.toUpperCase() == 'EFFECTUE');

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _TotalRecuCard(amountMru: totalRecu, anneeLabel: anneeLabel),
                    const SizedBox(height: 40),
                    const _HistoriqueSectionTitle(),
                    const SizedBox(height: 18),
                    ...rows.map(
                      (p) => Padding(
                        padding: const EdgeInsets.only(bottom: 18),
                        child: _PaymentCard(payment: p, anneeLabel: anneeLabel),
                      ),
                    ),
                    if (allUpToDate) ...[
                      const SizedBox(height: 16),
                      const _EncouragementBanner(),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TotalRecuCard extends StatelessWidget {
  const _TotalRecuCard({required this.amountMru, required this.anneeLabel});

  final double amountMru;
  final String anneeLabel;

  @override
  Widget build(BuildContext context) {
    final formatted = amountMru.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]} ',
        );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: SehilyColors.petrol,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: SehilyColors.petrol.withValues(alpha: 0.22),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'TOTAL REÇU CETTE ANNÉE',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.88),
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '$formatted MRU',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 36,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              'Année $anneeLabel',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.92),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.payment, required this.anneeLabel});

  final PaiementEtudiant payment;
  final String anneeLabel;

  String _formatMontant(double m) {
    final n = m.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]} ',
        );
    return '$n MRU';
  }

  String _fmtDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return DateFormat("d MMMM yyyy — HH:mm", 'fr_FR').format(d.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final refLabel = formatPaymentReference(
      payment.id,
      listeReference: payment.listeReference,
      referenceExterne: payment.referenceExterne,
    );
    final refDisplay = refLabel.startsWith('REF') ? refLabel.replaceFirst('REF-', 'REF: ') : 'REF: $refLabel';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ColoredBox(
              color: SehilyColors.coral,
              child: SizedBox(width: 5),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Paiement #${payment.id}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: SehilyColors.petrol,
                                  fontSize: 15,
                                ),
                              ),
                              if (payment.dateOperation != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  _fmtDate(payment.dateOperation!),
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: SehilyColors.textMuted,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _PayeBadge(statut: payment.statut),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _formatMontant(payment.montant),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: SehilyColors.petrol,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        _RefChip(label: refDisplay, coral: true),
                        _RefChip(label: anneeLabel, coral: false),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoriqueSectionTitle extends StatelessWidget {
  const _HistoriqueSectionTitle();

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.4,
          color: SehilyColors.textSecondary,
        ),
        children: const [
          TextSpan(
            text: '• ',
            style: TextStyle(color: SehilyColors.coral, fontSize: 16),
          ),
          TextSpan(text: 'HISTORIQUE DES VERSEMENTS'),
        ],
      ),
    );
  }
}

class _RefChip extends StatelessWidget {
  const _RefChip({required this.label, required this.coral});

  final String label;
  final bool coral;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: coral ? SehilyColors.coralBg : SehilyColors.cream,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: coral ? SehilyColors.coral.withValues(alpha: 0.22) : Colors.black.withValues(alpha: 0.07),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: coral ? SehilyColors.coral : SehilyColors.textSecondary,
        ),
      ),
    );
  }
}

class _PayeBadge extends StatelessWidget {
  const _PayeBadge({required this.statut});

  final String statut;

  @override
  Widget build(BuildContext context) {
    final u = statut.toUpperCase();
    final isPaid = u == 'EFFECTUE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      decoration: BoxDecoration(
        color: isPaid ? SehilyColors.mint : SehilyColors.pendingBg,
        borderRadius: BorderRadius.circular(999),
        border: isPaid ? Border.all(color: SehilyColors.green.withValues(alpha: 0.25)) : null,
      ),
      child: Text(
        isPaid ? 'Payé' : humanizeNotificationMessage(statut),
        style: TextStyle(
          color: isPaid ? SehilyColors.green : SehilyColors.pending,
          fontWeight: FontWeight.w800,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _EncouragementBanner extends StatelessWidget {
  const _EncouragementBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: SehilyColors.pendingBg.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SehilyColors.coral.withValues(alpha: 0.5), width: 1.5),
      ),
      child: const Text(
        '🎉 Tous vos paiements sont à jour !',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 15,
          color: SehilyColors.coral,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
