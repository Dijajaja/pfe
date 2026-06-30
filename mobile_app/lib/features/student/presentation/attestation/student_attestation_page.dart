import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_errors.dart';
import '../../application/student_providers.dart';
import '../../data/student_repository.dart';
import '../../domain/attestation_constants.dart';
import '../../domain/generate_attestation_pdf.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

class StudentAttestationPage extends ConsumerStatefulWidget {
  const StudentAttestationPage({super.key});

  @override
  ConsumerState<StudentAttestationPage> createState() => _StudentAttestationPageState();
}

class _StudentAttestationPageState extends ConsumerState<StudentAttestationPage> {
  String? _method;
  final _phoneCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  String _normalizePhone(String v) => v.replaceAll(RegExp(r'\D'), '');

  bool _canSubmit() {
    final phone = _normalizePhone(_phoneCtrl.text);
    final code = _codeCtrl.text.trim();
    return _method != null &&
        RegExp(r'^[234]\d{7}$').hasMatch(phone) &&
        RegExp(r'^\d{4}$').hasMatch(code);
  }

  Future<void> _confirm() async {
    if (!_canSubmit()) return;
    setState(() => _busy = true);
    try {
      await ref.read(studentRepositoryProvider).confirmAttestationPayment(
            methode: _method!,
            telephone: _normalizePhone(_phoneCtrl.text),
            codeTransaction: _codeCtrl.text.trim(),
          );
      ref.invalidate(attestationProvider);
      _codeCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Paiement confirmé. Vous pouvez imprimer votre attestation.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
      ref.invalidate(attestationProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _printPdf(AttestationStatus status) async {
    try {
      await generateAndShareAttestationPdf(
        AttestationPdfData(
          nomComplet: status.nomComplet,
          nni: status.nni,
          etablissement: status.etablissement,
          filiere: status.filiere,
          niveau: status.niveau,
          anneeUniversitaire: status.anneeUniversitaire,
          montantBourse: status.montantBourse,
          reference: status.reference,
          dateEmission: status.payeLe,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible de générer le PDF.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final attAsync = ref.watch(attestationProvider);

    return AsyncSection(
      value: attAsync,
      onRetry: () => ref.invalidate(attestationProvider),
      builder: (status) {
        final selected = attestationPaymentMethods.where((m) => m.id == _method).firstOrNull;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Attestation de bourse', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            const Text('Télécharger après validation.'),
            const SizedBox(height: 16),
            if (!status.eligible) ...[
              SehilyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Conditions non remplies', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    _checkItem(
                      ok: status.statutDossier == 'VALIDE',
                      label: 'Dossier validé (actuel : ${status.statutDossier ?? '—'})',
                    ),
                    _checkItem(
                      ok: status.statutPaiement == 'EFFECTUE',
                      label: 'Virement Mauripost confirmé (actuel : ${status.statutPaiement ?? '—'})',
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(onPressed: () => context.go('/student/dashboard'), child: const Text('Retour accueil')),
                  ],
                ),
              ),
            ],
            if (status.eligible && status.paiementAttestation) ...[
              SehilyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle, color: SehilyColors.green, size: 56),
                    const SizedBox(height: 8),
                    const Text('Attestation disponible', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol)),
                    const SizedBox(height: 4),
                    const Text('Votre paiement a été enregistré.'),
                    if (status.reference != null) ...[
                      const SizedBox(height: 12),
                      SehilyRefPill(label: formatAttestationReference(status.reference, dossierId: status.dossierId)),
                    ],
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => _printPdf(status),
                      icon: const Icon(Icons.download),
                      label: const Text('Télécharger / Imprimer'),
                      style: FilledButton.styleFrom(
                        backgroundColor: SehilyColors.coral,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (status.eligible && !status.paiementAttestation) ...[
              SehilyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Étape 1 — Choisir la méthode', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: attestationPaymentMethods.map((m) {
                        final selectedMethod = _method == m.id;
                        return ChoiceChip(
                          label: Text(m.label),
                          selected: selectedMethod,
                          onSelected: (_) => setState(() => _method = m.id),
                          selectedColor: m.color.withValues(alpha: 0.2),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              if (selected != null) ...[
                const SizedBox(height: 12),
                SehilyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Étape 2 — Instructions ${selected.label}',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      _instr('1. Ouvrez l\'application ${selected.label}.'),
                      _instr('2. Allez dans Paiements / Transfert.'),
                      _instr('3. Code commerçant : ${status.codeCommercant ?? sehilyMerchantCode}'),
                      _instr('4. Montant : ${status.montantAttestation.toStringAsFixed(0)} MRU'),
                      _instr('5. Validez avec votre code PIN.'),
                      _instr('6. Notez le code transaction à 4 chiffres.'),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SehilyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Étape 3 — Confirmer le paiement',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.number,
                        maxLength: 8,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: const InputDecoration(
                          labelText: 'Téléphone utilisé *',
                          hintText: 'Ex: 22222222',
                          helperText: 'Exactement 8 chiffres, commençant par 2, 3 ou 4.',
                          counterText: '',
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _codeCtrl,
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: const InputDecoration(
                          labelText: 'Code transaction (4 chiffres) *',
                          counterText: '',
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: (_busy || !_canSubmit()) ? null : _confirm,
                        child: _busy
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Confirmer le paiement'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ],
        );
      },
    );
  }

  Widget _checkItem({required bool ok, required String label}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(ok ? Icons.check_circle : Icons.radio_button_unchecked,
              color: ok ? const Color(0xFF2E7D32) : Colors.grey, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }

  Widget _instr(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(text),
      );
}
