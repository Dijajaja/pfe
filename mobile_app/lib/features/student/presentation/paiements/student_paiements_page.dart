import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../widgets/sehily_brand.dart';
import '../widgets/student_widgets.dart';

class StudentPaiementsPage extends ConsumerWidget {
  const StudentPaiementsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paiementsAsync = ref.watch(paiementsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(paiementsProvider);
        await ref.read(paiementsProvider.future);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Paiements', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text('Suivi des paiements par période.'),
          const SizedBox(height: 16),
          AsyncSection(
            value: paiementsAsync,
            onRetry: () => ref.invalidate(paiementsProvider),
            builder: (rows) {
              if (rows.isEmpty) return const SehilyCard(child: Text('Aucun paiement enregistré.'));
              final totalRecu = rows
                  .where((p) => p.statut.toUpperCase() == 'EFFECTUE')
                  .fold<double>(0, (acc, p) => acc + p.montant);
              return Column(
                children: [
                  SehilyTotalRecuCard(amountMru: totalRecu),
                  const SizedBox(height: 12),
                  ...rows.map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SehilyCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Paiement #${p.id}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol, fontSize: 15),
                                ),
                                _PayeBadge(statut: p.statut),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _formatMontant(p.montant),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: SehilyColors.petrol),
                            ),
                            if (p.dateOperation != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                _fmtDate(p.dateOperation!),
                                style: const TextStyle(fontSize: 13, color: Colors.black54),
                              ),
                            ],
                            const SizedBox(height: 14),
                            Align(
                              alignment: Alignment.center,
                              child: SehilyRefPill(
                                label: formatPaymentReference(
                                  p.id,
                                  listeReference: p.listeReference,
                                  referenceExterne: p.referenceExterne,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
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
    final local = d.toLocal();
    return '${DateFormat('dd/MM/yyyy').format(local)} — ${DateFormat('HH:mm').format(local)}';
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: isPaid ? SehilyColors.green.withValues(alpha: 0.15) : const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isPaid ? 'Payé' : humanizeNotificationMessage(statut),
        style: TextStyle(
          color: isPaid ? SehilyColors.green : const Color(0xFFE65100),
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}
