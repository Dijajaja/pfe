import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../public/presentation/widgets/public_page_scaffold.dart';
import '../../student/presentation/widgets/student_widgets.dart';
import '../data/auth_repository.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _emailCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(_emailCtrl.text);
      setState(() => _success = true);
    } catch (e) {
      setState(() => _error = apiErrorMessage(e, 'Impossible d\'envoyer la demande pour le moment.'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: SehilyColors.petrol,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Réinitialiser votre accès',
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Recevez un lien pour choisir un nouveau mot de passe.',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SehilyCard(
            child: _success ? _successView() : _formView(),
          ),
        ],
      ),
    );
  }

  Widget _successView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.mark_email_read_outlined, color: SehilyColors.green, size: 48),
        const SizedBox(height: 12),
        const Text(
          'Demande enregistrée',
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol),
        ),
        const SizedBox(height: 8),
        Text(
          'Si un compte existe pour cette adresse, vous recevrez les instructions par e-mail.',
          textAlign: TextAlign.center,
          style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: () => context.go('/login'),
          child: const Text('Retour à la connexion'),
        ),
      ],
    );
  }

  Widget _formView() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Mot de passe oublié', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Saisissez l\'e-mail de votre compte étudiant.',
            textAlign: TextAlign.center,
            style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 20),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 12),
          ],
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'E-mail',
              prefixIcon: Icon(Icons.mail_outline),
            ),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
          ),
          const SizedBox(height: 8),
          Text(
            'Pour les comptes gérés par le CNOU, un administrateur peut aussi réinitialiser l\'accès.',
            style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Envoyer la demande'),
          ),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Retour à la connexion'),
          ),
        ],
      ),
    );
  }
}
