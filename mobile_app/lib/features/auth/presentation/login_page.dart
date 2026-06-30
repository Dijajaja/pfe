import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../public/presentation/widgets/public_page_scaffold.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../application/auth_controller.dart';

// ─── Validateurs connexion ────────────────────────────────────────────────────

// Connexion : tout format valide (admins, partenaires inclus)
final _reEmailLogin = RegExp(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$');

String? _validateEmail(String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return 'L\'email est obligatoire.';
  if (!_reEmailLogin.hasMatch(s)) return 'Adresse email invalide.';
  return null;
}

String? _validatePassword(String? v) {
  final s = v ?? '';
  if (s.isEmpty) return 'Le mot de passe est obligatoire.';
  if (s.length < 8) return 'Minimum 8 caractères.';
  return null;
}

// ─── Champ validé avec bordure colorée ───────────────────────────────────────

class _ValidatedField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final String? Function(String?) validator;

  const _ValidatedField({
    required this.controller,
    required this.label,
    required this.validator,
    this.hint,
    this.keyboardType = TextInputType.text,
    this.obscureText  = false,
    this.suffixIcon,
    this.prefixIcon,
  });

  @override
  State<_ValidatedField> createState() => _ValidatedFieldState();
}

class _ValidatedFieldState extends State<_ValidatedField> {
  bool _touched = false;

  String? get _error  => _touched ? widget.validator(widget.controller.text) : null;
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
            prefixIcon: widget.prefixIcon,
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
                  '${widget.label} valide.',
                  style: TextStyle(color: Colors.green.shade700, fontSize: 12),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ─── Page de connexion ────────────────────────────────────────────────────────

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController    = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading    = false;
  bool _showPassword = false;
  bool _rememberMe   = true;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      await ref.read(authControllerProvider.notifier).login(
            email:    _emailController.text.trim(),
            password: _passwordController.text,
          );
      if (mounted) context.go('/student/dashboard');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e, 'Identifiants incorrects ou serveur indisponible.'));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      showBack: true,
      pageTitle: 'Connexion',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: SehilyColors.mintBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: SehilyColors.green.withValues(alpha: 0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Espace étudiant sécurisé',
                  style: TextStyle(color: SehilyColors.green, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                RichText(
                  text: const TextSpan(
                    style: TextStyle(color: SehilyColors.petrol, fontSize: 22, fontWeight: FontWeight.bold, height: 1.2),
                    children: [
                      TextSpan(text: 'Gérez votre bourse en '),
                      TextSpan(text: 'toute simplicité', style: TextStyle(color: SehilyColors.green)),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Accédez à votre dossier, suivez vos paiements et recevez des notifications en temps réel.',
                  style: TextStyle(color: SehilyColors.textSecondary, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SehilyCard(
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.disabled,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Connexion', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    'Heureux de vous revoir !',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 20),
                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                    ),
                    const SizedBox(height: 12),
                  ],
                  _ValidatedField(
                    controller: _emailController,
                    label: 'E-mail',
                    hint: 'nom@gmail.com',
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: const Icon(Icons.mail_outline),
                    validator: _validateEmail,
                  ),
                  const SizedBox(height: 16),
                  _ValidatedField(
                    controller: _passwordController,
                    label: 'Mot de passe',
                    obscureText: !_showPassword,
                    prefixIcon: const Icon(Icons.lock_outline),
                    validator: _validatePassword,
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                      icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => context.push('/reset-password'),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('Mot de passe oublié ?'),
                    ),
                  ),
                  Row(
                    children: [
                      Checkbox(
                        value: _rememberMe,
                        activeColor: SehilyColors.petrol,
                        onChanged: (v) => setState(() => _rememberMe = v ?? true),
                      ),
                      const Expanded(child: Text('Rester connecté')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: _isLoading ? null : _submit,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Se connecter'),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'Vous souhaitez vérifier votre statut ? ',
                        style: TextStyle(color: SehilyColors.textSecondary, fontSize: 13),
                      ),
                      TextButton(
                        onPressed: () => context.push('/eligibilite'),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Vérifier mon éligibilité', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
