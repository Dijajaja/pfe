import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../../l10n/l10n_ext.dart';
import '../../public/application/eligibility_provider.dart';
import '../../public/presentation/widgets/public_page_scaffold.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../application/auth_controller.dart';
import '../data/mauritanie_universite.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _prenomController = TextEditingController();
  final _nomController = TextEditingController();
  final _matriculeController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _etablissement;
  String? _filiere;
  bool _isLoading = false;
  bool _showPassword = false;
  String? _error;

  static const _fieldSpacing = 20.0;

  List<String> get _filieres => getFilieresPourEtablissement(_etablissement);

  InputDecoration _fieldDecoration({
    required String label,
    String? helperText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      helperText: helperText,
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SehilyColors.green, width: 1.5),
      ),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _prenomController.dispose();
    _nomController.dispose();
    _matriculeController.dispose();
    super.dispose();
  }

  void _onEtablissementChanged(String? value) {
    setState(() {
      _etablissement = value;
      if (_filiere != null && !_filieres.contains(_filiere)) {
        _filiere = null;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authControllerProvider.notifier).register(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            prenom: _prenomController.text.trim(),
            nom: _nomController.text.trim(),
            matricule: _matriculeController.text.trim(),
            etablissement: _etablissement!,
            filiere: _filiere!,
          );
      await ref.read(eligibilityGateProvider.notifier).clear();
      if (mounted) context.go('/student/dashboard');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e, context.t.registerError));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      showBack: true,
      pageTitle: 'Inscription',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: SehilyColors.mintBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SehilyColors.green.withValues(alpha: 0.25)),
                  ),
                  child: const Text(
                    'Éligibilité vérifiée — vous pouvez créer votre compte.',
                    style: TextStyle(color: SehilyColors.petrol, height: 1.35),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Les champs marqués d\'un astérisque (*) sont obligatoires.',
                  style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, height: 1.35),
                ),
                const SizedBox(height: 20),
                const _SectionTitle(title: 'Informations personnelles'),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _fieldDecoration(label: 'Email *'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                ),
                const SizedBox(height: _fieldSpacing),
                TextFormField(
                  controller: _prenomController,
                  textCapitalization: TextCapitalization.words,
                  decoration: _fieldDecoration(label: 'Prénom *'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                ),
                const SizedBox(height: _fieldSpacing),
                TextFormField(
                  controller: _nomController,
                  textCapitalization: TextCapitalization.words,
                  decoration: _fieldDecoration(label: 'Nom *'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                ),
                const SizedBox(height: _fieldSpacing),
                TextFormField(
                  controller: _matriculeController,
                  decoration: _fieldDecoration(label: 'Matricule *'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                ),
                const _SectionDivider(),
                const _SectionTitle(title: 'Scolarité'),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  value: _etablissement,
                  decoration: _fieldDecoration(label: 'Établissement *'),
                  hint: const Text('Choisir un établissement'),
                  items: etablissementsMauritanie
                      .map((e) => DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: _onEtablissementChanged,
                  validator: (v) => (v == null || v.isEmpty) ? context.t.requiredField : null,
                ),
                const SizedBox(height: _fieldSpacing),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  value: _filiere,
                  decoration: _fieldDecoration(label: 'Filière *'),
                  hint: Text(
                    _etablissement == null ? 'Choisissez d\'abord l\'établissement' : 'Choisir une filière',
                    style: TextStyle(
                      color: _etablissement == null ? SehilyColors.textMuted : SehilyColors.textSecondary,
                    ),
                  ),
                  items: _filieres
                      .map((f) => DropdownMenuItem(value: f, child: Text(f, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: _etablissement == null ? null : (v) => setState(() => _filiere = v),
                  validator: (v) => (v == null || v.isEmpty) ? context.t.requiredField : null,
                ),
                const _SectionDivider(),
                const _SectionTitle(title: 'Sécurité'),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_showPassword,
                  decoration: _fieldDecoration(
                    label: 'Mot de passe *',
                    helperText: '8 caractères minimum',
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                      icon: Icon(
                        _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: SehilyColors.textSecondary,
                      ),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return context.t.requiredField;
                    if (v.length < 8) return 'Mot de passe trop court (8 min.)';
                    return null;
                  },
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  SehilyAlertBanner(headline: 'Erreur —', subline: _error!),
                ],
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('S\'inscrire'),
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/login'),
                    style: TextButton.styleFrom(foregroundColor: SehilyColors.petrol),
                    child: const Text('Retour à la connexion'),
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

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 16,
        color: SehilyColors.petrol,
      ),
    );
  }
}

class _SectionDivider extends StatelessWidget {
  const _SectionDivider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Divider(color: Colors.black.withValues(alpha: 0.08), height: 1),
    );
  }
}
