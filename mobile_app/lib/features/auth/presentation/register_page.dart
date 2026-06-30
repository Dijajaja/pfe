import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../public/application/eligibility_provider.dart';
import '../../public/presentation/widgets/public_page_scaffold.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../application/auth_controller.dart';

// ─── Validateurs CNOU ────────────────────────────────────────────────────────

final _reEmail = RegExp(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$');
final _reTel   = RegExp(r'^(?:\+222|00222)?[234567]\d{7}$');

String? _validateEmail(String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return 'L\'email est obligatoire.';
  if (!_reEmail.hasMatch(s)) return 'Adresse email invalide (ex : nom@domaine.mr).';
  return null;
}

String? _validateTel(String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return 'Le numéro de téléphone est obligatoire.';
  if (!_reTel.hasMatch(s)) return 'Numéro mauritanien invalide (ex : 41234567 ou +22241234567).';
  return null;
}

String? _validatePassword(String? v) {
  final s = v ?? '';
  if (s.isEmpty) return 'Le mot de passe est obligatoire.';
  if (s.length < 8) return 'Minimum 8 caractères requis.';
  if (!RegExp(r'[a-z]').hasMatch(s)) return 'Au moins une lettre minuscule (a-z) requise.';
  if (!RegExp(r'[A-Z]').hasMatch(s)) return 'Au moins une lettre majuscule (A-Z) requise.';
  if (!RegExp(r'\d').hasMatch(s))    return 'Au moins un chiffre (0-9) requis.';
  if (!RegExp(r'[@$!%*?&]').hasMatch(s)) return 'Au moins un caractère spécial (@\$!%*?&) requis.';
  return null;
}

String? Function(String?) _validateConfirm(TextEditingController pwdCtrl) {
  return (v) {
    if (v == null || v.isEmpty) return 'Veuillez confirmer votre mot de passe.';
    if (v != pwdCtrl.text) return 'Les mots de passe ne correspondent pas.';
    return null;
  };
}

// ─── Champ validé avec bordure colorée ───────────────────────────────────────

class _ValidatedField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final String? Function(String?) validator;

  const _ValidatedField({
    required this.controller,
    required this.label,
    required this.validator,
    this.hint,
    this.keyboardType = TextInputType.text,
    this.obscureText  = false,
    this.suffixIcon,
  });

  @override
  State<_ValidatedField> createState() => _ValidatedFieldState();
}

class _ValidatedFieldState extends State<_ValidatedField> {
  bool _touched = false;

  String? get _error => _touched ? widget.validator(widget.controller.text) : null;
  bool   get _isValid => _touched && widget.validator(widget.controller.text) == null;

  OutlineInputBorder _border(Color color, {double width = 1.2}) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: color, width: width));

  @override
  Widget build(BuildContext context) {
    final validIcon = _touched
        ? Icon(
            _isValid ? Icons.check_circle_outline : Icons.cancel_outlined,
            color: _isValid ? const Color(0xFF2E8B57) : Colors.red.shade600,
            size: 20,
          )
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          obscureText: widget.obscureText,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.hint,
            suffixIcon: widget.suffixIcon ?? validIcon,
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

// ─── Page d'inscription ───────────────────────────────────────────────────────

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _emailController          = TextEditingController();
  final _phoneController          = TextEditingController();
  final _passwordController       = TextEditingController();
  final _passwordConfirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading    = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _passwordConfirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final gate     = ref.read(eligibilityGateProvider);
    final etudiant = gate.lastResult?.etudiant;
    if (etudiant == null || !gate.verified) {
      setState(() => _error = 'Vérifiez d\'abord votre éligibilité.');
      return;
    }

    setState(() { _isLoading = true; _error = null; });
    try {
      await ref.read(authControllerProvider.notifier).register(
            email:           _emailController.text.trim(),
            password:        _passwordController.text,
            passwordConfirm: _passwordConfirmController.text,
            telephone:       _phoneController.text.trim(),
            nni:             etudiant.nni,
            matricule:       etudiant.matricule,
          );
      await ref.read(eligibilityGateProvider.notifier).clear();
      if (mounted) context.go('/student/dashboard');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e, 'Inscription impossible.'));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final gate     = ref.watch(eligibilityGateProvider);
    final etudiant = gate.lastResult?.etudiant;

    if (!gate.loaded) {
      return const PublicPageScaffold(
        showBack: true,
        pageTitle: 'Inscription',
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (etudiant == null || !gate.verified) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/eligibilite');
      });
      return const SizedBox.shrink();
    }

    return PublicPageScaffold(
      showBack: true,
      pageTitle: 'Inscription',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: SehilyColors.mintBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: SehilyColors.green.withValues(alpha: 0.25)),
            ),
            child: const Text(
              'Éligibilité confirmée — complétez votre compte.',
              style: TextStyle(color: SehilyColors.petrol, height: 1.35),
            ),
          ),
          const SizedBox(height: 16),
          SehilyCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nom : ${etudiant.nomComplet}'),
                Text('Wilaya : ${etudiant.wilaya}'),
                Text('Établissement : ${etudiant.etablissement}'),
                Text('Formation : ${etudiant.formation}'),
                Text('Année : ${etudiant.anneeCourante}'),
                Text('Matricule : ${etudiant.matricule}'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.disabled,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _ValidatedField(
                  controller: _emailController,
                  label: 'Email *',
                  keyboardType: TextInputType.emailAddress,
                  validator: _validateEmail,
                ),
                const SizedBox(height: 20),
                _ValidatedField(
                  controller: _phoneController,
                  label: 'Téléphone *',
                  hint: 'Ex : 41234567',
                  keyboardType: TextInputType.phone,
                  validator: _validateTel,
                ),
                const SizedBox(height: 20),
                _ValidatedField(
                  controller: _passwordController,
                  label: 'Mot de passe *',
                  obscureText: !_showPassword,
                  validator: _validatePassword,
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                    icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  ),
                ),
                const SizedBox(height: 20),
                _ValidatedField(
                  controller: _passwordConfirmController,
                  label: 'Confirmer le mot de passe *',
                  obscureText: !_showPassword,
                  validator: _validateConfirm(_passwordController),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  SehilyAlertBanner(headline: 'Erreur —', subline: _error!),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Créer mon compte'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
