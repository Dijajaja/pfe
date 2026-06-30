import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../application/eligibility_provider.dart';
import '../data/eligibilite_repository.dart';
import '../domain/eligibility_result.dart';
import 'widgets/eligibility_confetti.dart';
import 'widgets/public_page_scaffold.dart';

// ─── Validateurs CNOU ────────────────────────────────────────────────────────

final _reMatricule = RegExp(r'^[A-Za-z]\d{5}$');

String? _validateNni(String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return 'Le NNI est obligatoire.';
  if (!RegExp(r'^\d+$').hasMatch(s)) return 'Le NNI ne doit contenir que des chiffres.';
  if (s.length < 10) return 'NNI : ${s.length}/10 chiffres saisis.';
  if (s.length > 10) return 'Le NNI ne doit pas dépasser 10 chiffres.';
  return null; // valide
}

String? _validateMatricule(String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return 'Le matricule est obligatoire.';
  if (!_reMatricule.hasMatch(s)) return 'Format attendu : 1 lettre + 5 chiffres (ex : I25099).';
  return null;
}

// ─── Widget validé avec bordure colorée ──────────────────────────────────────

class _ValidatedField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputType keyboardType;
  final int? maxLength;
  final String? Function(String?) validator;
  final bool autoFocus;

  const _ValidatedField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.validator,
    this.keyboardType = TextInputType.text,
    this.maxLength,
    this.autoFocus = false,
  });

  @override
  State<_ValidatedField> createState() => _ValidatedFieldState();
}

class _ValidatedFieldState extends State<_ValidatedField> {
  bool _touched = false;

  String? get _error => _touched ? widget.validator(widget.controller.text) : null;
  bool get _isValid  => _touched && widget.validator(widget.controller.text) == null;

  OutlineInputBorder _border(Color color, {double width = 1.2}) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: color, width: width));

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          maxLength: widget.maxLength,
          autofocus: widget.autoFocus,
          buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.hint,
            counterText: '',
            suffixIcon: _touched
                ? Icon(
                    _isValid ? Icons.check_circle_outline : Icons.cancel_outlined,
                    color: _isValid ? const Color(0xFF2E8B57) : Colors.red.shade600,
                    size: 20,
                  )
                : null,
            enabledBorder: _isValid
                ? _border(const Color(0xFF2E8B57))
                : _border(Colors.grey.shade300),
            focusedBorder: _isValid
                ? _border(const Color(0xFF2E8B57), width: 2)
                : _border(const Color(0xFF1B6CA8), width: 2),
            errorBorder: _border(Colors.red.shade500),
            focusedErrorBorder: _border(Colors.red.shade700, width: 2),
            errorText: _error,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          ),
          onChanged: (_) => setState(() => _touched = true),
          onTapOutside: (_) => setState(() => _touched = true),
          validator: widget.validator,
        ),
        if (_touched && _isValid)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green.shade600, size: 13),
                const SizedBox(width: 4),
                Text(
                  '${widget.label.replaceAll(' *', '')} valide.',
                  style: TextStyle(color: Colors.green.shade700, fontSize: 12),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ─── Page principale ─────────────────────────────────────────────────────────

class EligibilitePage extends ConsumerStatefulWidget {
  const EligibilitePage({super.key});

  @override
  ConsumerState<EligibilitePage> createState() => _EligibilitePageState();
}

class _EligibilitePageState extends ConsumerState<EligibilitePage> {
  final _nniCtrl       = TextEditingController();
  final _matriculeCtrl = TextEditingController();
  final _formKey       = GlobalKey<FormState>();
  EligibilityResult? _result;
  bool _submitting  = false;
  String? _apiError;
  int  _confettiBurst = 0;
  bool _showConfetti  = false;

  @override
  void dispose() {
    _nniCtrl.dispose();
    _matriculeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting    = true;
      _apiError      = null;
      _result        = null;
      _showConfetti  = false;
    });

    try {
      final result = await ref.read(eligibiliteRepositoryProvider).evaluate(
            nni: _nniCtrl.text.trim(),
            matricule: _matriculeCtrl.text.trim(),
          );
      if (result.ok) {
        await ref.read(eligibilityGateProvider.notifier).markVerified(result);
      }
      setState(() {
        _result = result;
        if (result.ok) {
          _confettiBurst++;
          _showConfetti = true;
        }
      });
    } catch (e) {
      setState(() => _apiError = apiErrorMessage(e, 'Impossible de vérifier l\'éligibilité.'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _readOnlyField(String label, String value) {
    return TextFormField(
      initialValue: value,
      readOnly: true,
      enabled: false,
      decoration: InputDecoration(
        labelText: label,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final etudiant  = _result?.etudiant;
    final showForm  = _result == null;

    return PublicPageScaffold(
      showBack: true,
      pageTitle: showForm ? 'Vérifier mon éligibilité' : 'Résultat d\'éligibilité',
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              if (showForm) ...[
                const Text(
                  'Vérification d\'identité',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
                ),
                const SizedBox(height: 8),
                Text(
                  'Saisissez uniquement votre NNI et votre matricule.',
                  style: TextStyle(color: SehilyColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 16),
                SehilyCard(
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.disabled,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _ValidatedField(
                          controller: _nniCtrl,
                          label: 'NNI *',
                          hint: 'Ex: 0123456789',
                          keyboardType: TextInputType.number,
                          maxLength: 10,
                          validator: _validateNni,
                          autoFocus: true,
                        ),
                        const SizedBox(height: 20),
                        _ValidatedField(
                          controller: _matriculeCtrl,
                          label: 'Matricule *',
                          hint: 'Ex: I25099',
                          maxLength: 6,
                          validator: _validateMatricule,
                        ),
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: _submitting ? null : _submit,
                          child: _submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Vérifier mon éligibilité'),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                if (!_result!.found) ...[
                  SehilyAlertBanner(
                    headline: 'Étudiant introuvable —',
                    subline: _result!.message ??
                        'Vérifiez votre NNI et votre matricule ou contactez votre établissement.',
                  ),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: null, child: const Text('Créer mon compte')),
                ] else if (etudiant != null) ...[
                  SehilyCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Informations étudiant',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
                        ),
                        const SizedBox(height: 16),
                        _readOnlyField('Nom complet', etudiant.nomComplet),
                        const SizedBox(height: 14),
                        _readOnlyField('Wilaya', etudiant.wilaya),
                        const SizedBox(height: 14),
                        _readOnlyField('Établissement', etudiant.etablissement),
                        const SizedBox(height: 14),
                        _readOnlyField('Formation', etudiant.formation),
                        const SizedBox(height: 14),
                        _readOnlyField('Année courante', etudiant.anneeCourante),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_result!.ok) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: SehilyColors.mintBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: SehilyColors.green.withValues(alpha: 0.25)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: SehilyColors.green,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'Éligible',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _result!.message ??
                                'Félicitations, vous êtes éligible à la bourse. Vous pouvez créer votre compte.',
                            style: const TextStyle(color: SehilyColors.petrol, height: 1.45),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.go('/register'),
                      child: const Text('Créer mon compte'),
                    ),
                  ] else ...[
                    SehilyAlertBanner(
                      headline: 'Non éligible —',
                      subline: _result!.motif ?? _result!.message ?? 'Vous n\'êtes pas éligible.',
                    ),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: null, child: const Text('Créer mon compte')),
                  ],
                ],
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => setState(() {
                    _result   = null;
                    _apiError = null;
                  }),
                  child: const Text('Nouvelle vérification'),
                ),
              ],
              if (_apiError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: SehilyAlertBanner(headline: 'Erreur —', subline: _apiError!),
                ),
            ],
          ),
          if (_showConfetti)
            Positioned.fill(
              child: EligibilityConfetti(
                burstId: _confettiBurst,
                onFinished: () {
                  if (mounted) setState(() => _showConfetti = false);
                },
              ),
            ),
        ],
      ),
    );
  }
}
