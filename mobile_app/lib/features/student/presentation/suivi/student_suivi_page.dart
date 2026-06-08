import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student_providers.dart';
import '../../domain/student_models.dart';
import '../widgets/sehily_brand.dart';
import '../widgets/student_widgets.dart';

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
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Historique des statuts et réclamations.'),
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
                return const SehilyCard(child: Text('Aucun historique.'));
              }

              final auteurValidation = primary != null && primary.statut.toUpperCase() == 'VALIDE'
                  ? 'Administration'
                  : '—';

              return Column(
                children: [
                  if (primary != null)
                    SehilyHighlightCard(
                      child: Column(
                        children: [
                          const Text(
                            'Statut actuel',
                            style: TextStyle(color: Colors.black54, fontSize: 14),
                          ),
                          const SizedBox(height: 8),
                          StatusBadge(status: primary.statut, large: true, showCheck: true),
                        ],
                      ),
                    )
                  else
                    const SehilyCard(child: Text('Aucun dossier.')),
                  if (primary != null) ...[
                    const SizedBox(height: 12),
                    _SuiviStatCard(
                      label: 'Auteur (validation)',
                      value: auteurValidation,
                    ),
                  ],
                  if (rows.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    SehilyCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Historique',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          const SizedBox(height: 12),
                          _SuiviTimeline(rows: rows),
                        ],
                      ),
                    ),
                  ] else if (primary != null)
                    const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: SehilyCard(child: Text('Aucun historique.')),
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

String _formatDateTime(String? iso) {
  if (iso == null) return '—';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return DateFormat('dd/MM/yyyy HH:mm:ss').format(d.toLocal());
}

class _SuiviStatCard extends StatelessWidget {
  const _SuiviStatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE3EAE8)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0E322F).withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
              color: Color(0xFF7A8B87),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A2E2C),
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
          ),
      ],
    );
  }
}

class _SuiviTimelineItem extends StatelessWidget {
  const _SuiviTimelineItem({required this.row, required this.isLast});

  final SuiviEntry row;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final showAuteur = row.auteur == 'Admin' || row.auteur == 'Support';

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE3EAE8)),
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
                          style: const TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ),
                      StatusBadge(status: row.statut),
                    ],
                  ),
                  if (showAuteur) ...[
                    const SizedBox(height: 6),
                    Text.rich(
                      TextSpan(
                        style: const TextStyle(fontSize: 13, color: Color(0xFF5A6B67), height: 1.35),
                        children: [
                          TextSpan(
                            text: row.auteur,
                            style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1A2E2C)),
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
                      style: const TextStyle(fontSize: 13, color: Color(0xFF5A6B67), height: 1.35),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            top: 2,
            bottom: 0,
            width: 24,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return CustomPaint(
                  size: Size(24, constraints.maxHeight),
                  painter: _SuiviRailPainter(drawLine: constraints.maxHeight > 26),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Pastille grise + trait sous le cercle (comme le web), indépendant du ListView.
class _SuiviRailPainter extends CustomPainter {
  _SuiviRailPainter({required this.drawLine});

  final bool drawLine;

  static const _dotFill = Color(0xFFF6F8F7);
  static const _dotBorder = Color(0xFFCFD8D6);
  static const _lineTop = Color(0xFFE8ECE9);
  static const _lineBottom = Color(0xFFE2E8E6);

  @override
  void paint(Canvas canvas, Size size) {
    const dotCenter = Offset(12, 12);
    const dotRadius = 10.0;
    const lineX = 12.0;
    const lineStartY = 24.0;

    if (drawLine && size.height > lineStartY) {
      final linePaint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.lerp(SehilyColors.petrol, _lineTop, 0.78)!,
            _lineBottom,
          ],
        ).createShader(Rect.fromLTWH(lineX - 1, lineStartY, 2, size.height - lineStartY))
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(
        Offset(lineX, lineStartY),
        Offset(lineX, size.height),
        linePaint,
      );
    }

    canvas.drawCircle(
      dotCenter,
      dotRadius,
      Paint()
        ..color = _dotFill
        ..style = PaintingStyle.fill,
    );
    canvas.drawCircle(
      dotCenter,
      dotRadius,
      Paint()
        ..color = _dotBorder
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(covariant _SuiviRailPainter oldDelegate) =>
      oldDelegate.drawLine != drawLine;
}
