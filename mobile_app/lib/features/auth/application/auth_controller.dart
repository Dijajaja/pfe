import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';

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
    if (hasValid) {
      state = AuthStatus.authenticated;
      return;
    }
    final refreshed = await repo.tryRefreshSession();
    state = refreshed ? AuthStatus.authenticated : AuthStatus.unauthenticated;
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    final repo = _ref.read(authRepositoryProvider);
    final tokens = await repo.login(email: email, password: password);
    await repo.persistTokens(tokens);
    state = AuthStatus.authenticated;
  }

  Future<void> register({
    required String email,
    required String password,
    String? matricule,
    String? etablissement,
    String? filiere,
  }) async {
    final repo = _ref.read(authRepositoryProvider);
    final tokens = await repo.register(
      email: email,
      password: password,
      matricule: matricule,
      etablissement: etablissement,
      filiere: filiere,
    );
    await repo.persistTokens(tokens);
    state = AuthStatus.authenticated;
  }

  Future<void> logout() async {
    final repo = _ref.read(authRepositoryProvider);
    await repo.logout();
    state = AuthStatus.unauthenticated;
  }
}

