import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme.dart';
import '../../../../core/network/api_errors.dart';

/// Couleurs Sehily réutilisables dans le module étudiant.
abstract final class SehilyColors {
  static const petrol = Color(0xFF1B4D4A);
  static const green = Color(0xFF2E7D72);
  /// En-têtes AppBar (aligné bandeau footer web).
  static const header = Color(0xFF2D7A70);
  /// Sous-titres et textes secondaires (contraste renforcé).
  static const textSecondary = Color(0xFF3A5552);
  /// Dates, hints, légendes (lisible sur fond clair).
  static const textMuted = Color(0xFF4D6562);
  static const mint = Color(0xFF9FE1CB);
  static const mintBg = Color(0xFFE8F5E9);
  static const pending = Color(0xFFF57C00);
  static const pendingBg = Color(0xFFFFF3E0);
  static const coral = Color(0xFFC9614A);
  static const coralBg = Color(0xFFFDECEA);
  static const cream = Color(0xFFFAF7F2);
  /// Crème + vert très clair (carte Total reçu).
  static const creamGreenSoft = Color(0xFFF0F7F4);
  /// Fond bandeau dossier (crème pêche).
  static const dossierAlertBg = Color(0xFFFFF2EA);
  /// Texte bandeau dossier.
  static const dossierAlertText = Color(0xFF5C4A42);
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status, this.large = false, this.showCheck = false});

  final String status;
  final bool large;
  final bool showCheck;

  @override
  Widget build(BuildContext context) {
    final style = _styleFor(status);
    final label = showCheck && _isSuccessStatus(status) ? '✓ ${style.label}' : style.label;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: large ? 14 : 10, vertical: large ? 8 : 4),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: style.foreground,
          fontSize: large ? 14 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  bool _isSuccessStatus(String raw) {
    final u = raw.toUpperCase();
    return ['VALIDE', 'EFFECTUE', 'PAYE', 'TRAITEE'].contains(u);
  }

  _BadgeStyle _styleFor(String raw) {
    final u = raw.toUpperCase();
    if (u.startsWith('RECLAMATION:')) {
      return _BadgeStyle('Réclamation', AppTheme.accent.withValues(alpha: 0.15), AppTheme.accent);
    }
    if (['VALIDE', 'EFFECTUE', 'PAYE', 'TRAITEE'].contains(u)) {
      return _BadgeStyle(_label(u), SehilyColors.coralBg, SehilyColors.coral);
    }
    if (['REJETE', 'REJETEE', 'ECHEC'].contains(u)) {
      return _BadgeStyle(_label(u), const Color(0xFFFDECEA), AppTheme.accent);
    }
    if (['SOUMIS', 'SOUMISE', 'EN_INSTRUCTION', 'EN_COURS', 'EN_ATTENTE_ETUDIANT', 'BROUILLON']
        .contains(u)) {
      return _BadgeStyle(_label(u), const Color(0xFFFFF3E0), const Color(0xFFE65100));
    }
    return _BadgeStyle(raw.isEmpty ? '—' : raw, const Color(0xFFEFEFEF), Colors.black87);
  }

  String _label(String u) {
    const map = {
      'VALIDE': 'Validé',
      'SOUMIS': 'Soumis',
      'SOUMISE': 'Soumise',
      'BROUILLON': 'Brouillon',
      'EN_INSTRUCTION': 'En instruction',
      'EN_COURS': 'En cours',
      'EN_ATTENTE_ETUDIANT': 'Attente réponse',
      'REJETE': 'Rejeté',
      'REJETEE': 'Rejetée',
      'TRAITEE': 'Traitée',
      'EFFECTUE': 'Payé',
    };
    return map[u] ?? u;
  }
}

class _BadgeStyle {
  const _BadgeStyle(this.label, this.background, this.foreground);
  final String label;
  final Color background;
  final Color foreground;
}

class AsyncSection<T> extends StatelessWidget {
  const AsyncSection({
    super.key,
    required this.value,
    required this.builder,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                apiErrorMessage(e, 'Impossible de charger les données.'),
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 12),
                OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
              ],
            ],
          ),
        ),
      ),
      data: builder,
    );
  }
}

class SehilyCard extends StatelessWidget {
  const SehilyCard({super.key, required this.child, this.padding = const EdgeInsets.all(16)});

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}

/// Bandeau dossier : barre corail à gauche, fond crème pêche, texte brun.
class SehilyAlertBanner extends StatelessWidget {
  const SehilyAlertBanner({
    super.key,
    required this.headline,
    required this.subline,
  });

  final String headline;
  final String subline;

  @override
  Widget build(BuildContext context) {
    const iconSize = 18.0;
    const gap = 8.0;
    const textStyle = TextStyle(
      color: SehilyColors.dossierAlertText,
      fontWeight: FontWeight.w500,
      fontSize: 14,
      height: 1.4,
    );

    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topRight: Radius.circular(10),
        bottomRight: Radius.circular(10),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ColoredBox(color: SehilyColors.coral, child: SizedBox(width: 4)),
            Expanded(
              child: ColoredBox(
                color: SehilyColors.dossierAlertBg,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: SehilyColors.dossierAlertText,
                            size: iconSize,
                          ),
                          const SizedBox(width: gap),
                          Expanded(child: Text(headline, style: textStyle)),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: iconSize + gap),
                        child: Text(subline, style: textStyle),
                      ),
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

/// Pastille verte pour références courtes (REF-ATT-…, ATT-…).
class SehilyRefPill extends StatelessWidget {
  const SehilyRefPill({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: SehilyColors.green.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: SehilyColors.green.withValues(alpha: 0.25)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: SehilyColors.green,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}

bool _looksLikeUuid(String value) {
  return RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', caseSensitive: false)
      .hasMatch(value.trim());
}

/// Référence courte lisible (évite l'UUID en liste).
String formatPaymentReference(int paymentId, {String? listeReference, String? referenceExterne}) {
  if (referenceExterne != null && referenceExterne.trim().isNotEmpty) {
    final ref = referenceExterne.trim();
    if (ref.length <= 20 && !_looksLikeUuid(ref)) return ref;
  }
  final source = (listeReference ?? referenceExterne ?? '').replaceAll('-', '').toUpperCase();
  if (source.length >= 6) {
    return 'REF-ATT-${source.substring(0, 6)}';
  }
  return 'REF-${paymentId.toString().padLeft(4, '0')}';
}

String formatAttestationReference(String? reference, {int? dossierId}) {
  if (reference != null && reference.trim().isNotEmpty && reference.trim().length <= 24) {
    return reference.trim();
  }
  if (reference != null && _looksLikeUuid(reference)) {
    final clean = reference.replaceAll('-', '').toUpperCase();
    return 'ATT-${dossierId ?? 1}-${clean.substring(0, 8)}';
  }
  return 'ATT-${dossierId ?? 1}';
}

/// Humanise les statuts dans les messages de notification (accents, casse FR).
String humanizeNotificationMessage(String message) {
  const replacements = {
    'EFFECTUE': 'Effectué',
    'ENVOYE': 'Envoyé',
    'EN_ATTENTE': 'En attente',
    'EN_COURS': 'En cours',
    'ECHEC': 'Échec',
    'VALIDE': 'Validé',
    'SOUMIS': 'Soumis',
    'SOUMISE': 'Soumise',
    'BROUILLON': 'Brouillon',
    'EN_INSTRUCTION': 'En instruction',
    'COMPLEMENT_DEMANDE': 'Complément demandé',
    'REJETE': 'Rejeté',
    'REJETEE': 'Rejetée',
    'TRAITEE': 'Traitée',
    'EN_ATTENTE_ETUDIANT': 'En attente de votre réponse',
  };

  var result = message;
  for (final entry in replacements.entries) {
    result = result.replaceAll(entry.key, entry.value);
  }
  return result;
}
