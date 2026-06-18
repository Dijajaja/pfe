import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/network/api_errors.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../application/eligibility_provider.dart';
import '../data/eligibility_constants.dart';
import '../data/eligibilite_repository.dart';
import '../domain/eligibility_result.dart';
import 'widgets/eligibility_confetti.dart';
import 'widgets/public_page_scaffold.dart';

class EligibilitePage extends ConsumerStatefulWidget {
  const EligibilitePage({super.key});

  @override
  ConsumerState<EligibilitePage> createState() => _EligibilitePageState();
}

class _EligibilitePageState extends ConsumerState<EligibilitePage> {
  final _nniCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _scrollCtrl = ScrollController();
  final _resultKey = GlobalKey();
  DateTime? _birthDate;
  String? _wilaya;
  String _niveau = 'L1';
  EligibilityResult? _result;
  bool _submitting = false;
  String? _apiError;
  int _confettiBurst = 0;
  bool _showConfetti = false;

  int get _activeStep {
    if (_result != null) return 2;
    if (_submitting) return 1;
    return 0;
  }

  @override
  void dispose() {
    _nniCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  int? get _age {
    if (_birthDate == null) return null;
    final now = DateTime.now();
    var age = now.year - _birthDate!.year;
    if (now.month < _birthDate!.month ||
        (now.month == _birthDate!.month && now.day < _birthDate!.day)) {
      age--;
    }
    return age;
  }

  Future<void> _pickBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(2002, 1, 1),
      firstDate: DateTime(1970),
      lastDate: DateTime.now(),
      locale: const Locale('fr'),
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  void _scrollToResult() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _resultKey.currentContext;
      if (ctx != null && mounted) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 550),
          curve: Curves.easeOutCubic,
          alignment: 0.08,
        );
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _birthDate == null || _wilaya == null) return;

    setState(() {
      _submitting = true;
      _apiError = null;
      _result = null;
      _showConfetti = false;
    });

    try {
      final result = await ref.read(eligibiliteRepositoryProvider).evaluate(
            nni: _nniCtrl.text,
            dateNaissance: DateFormat('yyyy-MM-dd').format(_birthDate!),
            wilayaBac: _wilaya!,
            niveau: _niveau,
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
      _scrollToResult();
    } catch (e) {
      setState(() => _apiError = apiErrorMessage(e, 'Impossible de vérifier l’éligibilité.'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _successResult(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
          decoration: BoxDecoration(
            color: SehilyColors.mintBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: SehilyColors.green.withValues(alpha: 0.15)),
          ),
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: SehilyColors.green,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 30),
              ),
              const SizedBox(height: 16),
              const Text(
                'Félicitations !',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: SehilyColors.petrol),
              ),
              const SizedBox(height: 10),
              const Text(
                'Vous êtes éligible à la bourse',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 22,
                  color: SehilyColors.petrol,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Vous pouvez maintenant créer votre compte pour commencer votre demande.',
                textAlign: TextAlign.center,
                style: TextStyle(color: SehilyColors.textSecondary, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SehilyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'Prochaines étapes',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
              ),
              SizedBox(height: 14),
              _NextStepRow(icon: Icons.person_outline, title: 'Créer votre compte'),
              SizedBox(height: 12),
              _NextStepRow(icon: Icons.folder_outlined, title: 'Déposer votre dossier'),
              SizedBox(height: 12),
              _NextStepRow(icon: Icons.trending_up, title: 'Suivre le traitement'),
            ],
          ),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: () => context.go('/register'),
          child: const Text('Créer mon compte'),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => context.push('/login'),
          style: OutlinedButton.styleFrom(
            foregroundColor: SehilyColors.petrol,
            side: BorderSide(color: SehilyColors.petrol.withValues(alpha: 0.25)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: const Text('Se connecter'),
        ),
      ],
    );
  }

  Widget _failureResult() {
    return SehilyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, color: SehilyColors.coral),
              SizedBox(width: 8),
              Text('Non éligible', style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.coral)),
            ],
          ),
          const SizedBox(height: 8),
          Text(eligibilityMessage(_result!.i18nKey, params: _result!.i18nParams)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final showForm = _result == null;
    final pageTitle = _result != null ? 'Résultat d\'éligibilité' : 'Vérification d\'éligibilité';

    return PublicPageScaffold(
      showBack: true,
      pageTitle: pageTitle,
      body: Stack(
        children: [
          ListView(
            controller: _scrollCtrl,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _EligibilityStepper(activeStep: _activeStep),
              const SizedBox(height: 24),
              if (showForm) ...[
                const Text(
                  'Informations personnelles',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
                ),
                const SizedBox(height: 6),
                Text(
                  'Veuillez renseigner vos informations pour vérifier votre éligibilité.',
                  style: TextStyle(color: SehilyColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 16),
                SehilyCard(
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _nniCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Numéro NNI *',
                            hintText: 'Entrez votre NNI',
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
                        ),
                        const SizedBox(height: 22),
                        InkWell(
                          onTap: _pickBirthDate,
                          borderRadius: BorderRadius.circular(12),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Date de naissance *',
                              suffixIcon: Icon(Icons.calendar_today_outlined),
                              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                            ),
                            child: Text(
                              _birthDate == null
                                  ? 'Sélectionner votre date'
                                  : DateFormat('dd/MM/yyyy').format(_birthDate!),
                              style: TextStyle(
                                color: _birthDate == null ? SehilyColors.textMuted : SehilyColors.petrol,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        if (_age != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Âge calculé : $_age ans',
                              style: const TextStyle(color: SehilyColors.green, fontWeight: FontWeight.w600),
                            ),
                          ),
                        SizedBox(height: _age != null ? 18 : 22),
                        DropdownButtonFormField<String>(
                          value: _wilaya,
                          decoration: const InputDecoration(
                            labelText: 'Wilaya du bac *',
                            hintText: 'Sélectionner votre wilaya',
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                          ),
                          items: [
                            const DropdownMenuItem(value: null, child: Text('Sélectionner votre wilaya')),
                            ...EligibilityConstants.wilayas.map(
                              (w) => DropdownMenuItem(value: w, child: Text(w)),
                            ),
                          ],
                          onChanged: (v) => setState(() => _wilaya = v),
                          validator: (v) => v == null ? 'Champ obligatoire' : null,
                        ),
                        const SizedBox(height: 22),
                        DropdownButtonFormField<String>(
                          value: _niveau,
                          decoration: const InputDecoration(
                            labelText: 'Niveau d\'études *',
                            hintText: 'Sélectionner votre niveau',
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                          ),
                          items: EligibilityConstants.niveaux
                              .map((n) => DropdownMenuItem(value: n.$1, child: Text(n.$2)))
                              .toList(),
                          onChanged: (v) => setState(() => _niveau = v ?? 'L1'),
                        ),
                        const SizedBox(height: 28),
                        FilledButton(
                          onPressed: _submitting ? null : _submit,
                          child: _submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Continuer'),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                if (!_result!.ok) ...[
                  const Text(
                    'Résultat',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Voici le résultat de votre vérification d\'éligibilité.',
                    style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),
                ],
                KeyedSubtree(
                  key: _resultKey,
                  child: _result!.ok ? _successResult(context) : _failureResult(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => setState(() {
                      _result = null;
                      _apiError = null;
                    }),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: SehilyColors.petrol,
                      side: BorderSide(color: SehilyColors.petrol.withValues(alpha: 0.3)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Modifier mes informations'),
                  ),
                ),
              ],
              if (_apiError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: SehilyAlertBanner(
                    headline: 'Erreur —',
                    subline: _apiError!,
                  ),
                ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield_outlined, size: 16, color: SehilyColors.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    'Vos données sont 100% sécurisées',
                    style: TextStyle(fontSize: 12, color: SehilyColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ],
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

class _NextStepRow extends StatelessWidget {
  const _NextStepRow({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
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
            title,
            style: const TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.petrol),
          ),
        ),
      ],
    );
  }
}

class _EligibilityStepper extends StatelessWidget {
  const _EligibilityStepper({required this.activeStep});

  final int activeStep;

  static const _steps = [
    ('Informations', 'Informations'),
    ('Vérification', 'Verification'),
    ('Résultat', 'Resultat'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < _steps.length; i++) ...[
          Expanded(
            child: _StepDot(
              index: i + 1,
              label: _steps[i].$1,
              active: i == activeStep,
              completed: i < activeStep,
            ),
          ),
          if (i < _steps.length - 1)
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: SizedBox(
                width: 24,
                child: Container(
                  height: 2,
                  color: i < activeStep
                      ? SehilyColors.green.withValues(alpha: 0.35)
                      : Colors.black.withValues(alpha: 0.08),
                ),
              ),
            ),
        ],
      ],
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.index,
    required this.label,
    required this.active,
    required this.completed,
  });

  final int index;
  final String label;
  final bool active;
  final bool completed;

  @override
  Widget build(BuildContext context) {
    final filled = active || completed;
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: filled ? SehilyColors.green : Colors.transparent,
            shape: BoxShape.circle,
            border: Border.all(
              color: filled ? SehilyColors.green : Colors.black26,
              width: filled ? 0 : 1.5,
            ),
          ),
          child: Text(
            '$index',
            style: TextStyle(
              color: filled ? Colors.white : SehilyColors.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active ? SehilyColors.green : SehilyColors.textMuted,
          ),
        ),
      ],
    );
  }
}
