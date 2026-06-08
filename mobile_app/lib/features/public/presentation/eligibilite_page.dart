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

  Widget _successResult() {
    return SehilyCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle, color: SehilyColors.green, size: 48),
          const SizedBox(height: 12),
          const Text(
            'Éligible à la bourse',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
          ),
          const SizedBox(height: 8),
          Text(
            eligibilityMessage(_result!.i18nKey, params: _result!.i18nParams),
            textAlign: TextAlign.center,
            style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.75)),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: SehilyColors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_outline, color: SehilyColors.green, size: 18),
                SizedBox(width: 6),
                Text('Service accordé', style: TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.green)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => context.go('/register'),
              style: FilledButton.styleFrom(backgroundColor: SehilyColors.coral),
              child: const Text('Continuer vers l’inscription'),
            ),
          ),
        ],
      ),
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
    return PublicPageScaffold(
      showBack: true,
      body: Stack(
        children: [
          ListView(
            controller: _scrollCtrl,
            padding: const EdgeInsets.all(16),
            children: [
              Text('Vérification d’éligibilité', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              const Text('Renseignez vos informations pour vérifier votre éligibilité rapidement.'),
              const SizedBox(height: 16),
              SehilyCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _nniCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'NNI *'),
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: _pickBirthDate,
                        borderRadius: BorderRadius.circular(12),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Date de naissance *',
                            suffixIcon: Icon(Icons.calendar_today_outlined),
                          ),
                          child: Text(
                            _birthDate == null
                                ? 'jj/mm/aaaa'
                                : DateFormat('dd/MM/yyyy').format(_birthDate!),
                            style: TextStyle(
                              color: _birthDate == null ? Colors.black45 : Colors.black87,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      if (_age != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            'Âge calculé : $_age ans',
                            style: const TextStyle(color: SehilyColors.green, fontWeight: FontWeight.w600),
                          ),
                        ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _wilaya,
                        decoration: const InputDecoration(labelText: 'Wilaya du bac *'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Choisir…')),
                          ...EligibilityConstants.wilayas.map(
                            (w) => DropdownMenuItem(value: w, child: Text(w)),
                          ),
                        ],
                        onChanged: (v) => setState(() => _wilaya = v),
                        validator: (v) => v == null ? 'Champ obligatoire' : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _niveau,
                        decoration: const InputDecoration(labelText: 'Niveau actuel *'),
                        items: EligibilityConstants.niveaux
                            .map((n) => DropdownMenuItem(value: n.$1, child: Text(n.$2)))
                            .toList(),
                        onChanged: (v) => setState(() => _niveau = v ?? 'L1'),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _submitting ? null : _submit,
                        icon: _submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.search),
                        label: Text(_submitting ? 'Vérification…' : 'Vérifier l’éligibilité'),
                      ),
                      TextButton(
                        onPressed: () => context.push('/login'),
                        child: const Text('J’ai déjà un compte'),
                      ),
                    ],
                  ),
                ),
              ),
              if (_apiError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: SehilyAlertBanner(
                    headline: 'Erreur —',
                    subline: _apiError!,
                  ),
                ),
              if (_result != null) ...[
                const SizedBox(height: 16),
                KeyedSubtree(
                  key: _resultKey,
                  child: _result!.ok ? _successResult() : _failureResult(),
                ),
              ],
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
