import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';
import 'auth_role_provider.dart';

enum AuthStatus {
  unknown,
  authenticated,
  unauthenticated,
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthStatus>((ref) {
  return AuthController(ref)..bootstrap();
});

class AuthController extends StateNotifier<AuthStatus> {
  AuthController(this._ref) : super(AuthStatus.unknown);

  final Ref _ref;

  Future<void> bootstrap() async {
    final repo = _ref.read(authRepositoryProvider);
    final hasValid = await repo.hasValidSession();
    if (!hasValid) {
      final refreshed = await repo.tryRefreshSession();
      if (!refreshed) {
        _ref.read(authRoleProvider.notifier).state = null;
        state = AuthStatus.unauthenticated;
        return;
      }
    }
    await _finalizeSession();
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    final repo = _ref.read(authRepositoryProvider);
    final tokens = await repo.login(email: email.trim(), password: password);
    await repo.persistTokens(tokens);
    await _finalizeSession();
    if (state != AuthStatus.authenticated) {
      throw Exception('Accès réservé aux comptes étudiants.');
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String passwordConfirm,
    required String telephone,
    required String nni,
    required String matricule,
  }) async {
    final repo = _ref.read(authRepositoryProvider);
    final tokens = await repo.register(
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      telephone: telephone,
      nni: nni,
      matricule: matricule,
    );
    await repo.persistTokens(tokens);
    await _finalizeSession();
  }

  Future<void> logout() async {
    final repo = _ref.read(authRepositoryProvider);
    await repo.logout();
    _ref.read(authRoleProvider.notifier).state = null;
    state = AuthStatus.unauthenticated;
  }

  Future<void> handleSessionExpired() async {
    if (state == AuthStatus.unauthenticated) return;
    await logout();
  }

  Future<void> _finalizeSession() async {
    final repo = _ref.read(authRepositoryProvider);
    try {
      final me = await repo.fetchMe();
      final role = me['role']?.toString();
      _ref.read(authRoleProvider.notifier).state = role;
      if (!isStudentRole(role)) {
        await repo.logout();
        _ref.read(authRoleProvider.notifier).state = null;
        state = AuthStatus.unauthenticated;
        return;
      }
      state = AuthStatus.authenticated;
    } catch (_) {
      await repo.logout();
      _ref.read(authRoleProvider.notifier).state = null;
      state = AuthStatus.unauthenticated;
    }
  }
}
