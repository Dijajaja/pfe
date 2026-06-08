import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_errors.dart';
import '../../../l10n/l10n_ext.dart';
import '../../public/application/eligibility_provider.dart';
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
  String? _error;

  List<String> get _filieres => getFilieresPourEtablissement(_etablissement);

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
    return Scaffold(
      appBar: AppBar(title: Text(context.t.registerTitle)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(context.t.registerTitle, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF2E7D32).withValues(alpha: 0.25)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 20),
                          SizedBox(width: 8),
                          Expanded(child: Text('Éligibilité vérifiée — vous pouvez créer votre compte.')),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(labelText: context.t.email),
                      validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _prenomController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Prénom *'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nomController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Nom *'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _matriculeController,
                      decoration: InputDecoration(labelText: context.t.matricule),
                      validator: (v) => (v == null || v.trim().isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Établissement *'),
                      hint: const Text('Choisir un établissement'),
                      value: _etablissement,
                      items: etablissementsMauritanie
                          .map((e) => DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: _onEtablissementChanged,
                      validator: (v) => (v == null || v.isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Filière *'),
                      hint: Text(_etablissement == null ? 'Choisissez d\'abord l\'établissement' : 'Choisir une filière'),
                      value: _filiere,
                      items: _filieres
                          .map((f) => DropdownMenuItem(value: f, child: Text(f, overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: _etablissement == null ? null : (v) => setState(() => _filiere = v),
                      validator: (v) => (v == null || v.isEmpty) ? context.t.requiredField : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: context.t.password,
                        helperText: '8 caractères minimum',
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return context.t.requiredField;
                        if (v.length < 8) return 'Mot de passe trop court (8 min.)';
                        return null;
                      },
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(context.t.registerAction),
                    ),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: Text(context.t.backToLogin),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
