import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_controller.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/home/home_page.dart';
import '../features/splash/splash_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authStatus = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/home', builder: (_, __) => const HomePage()),
    ],
    redirect: (context, state) {
      final isAuthRoute = state.fullPath == '/login' || state.fullPath == '/register';
      final isSplash = state.fullPath == '/splash';

      if (authStatus == AuthStatus.unknown) return isSplash ? null : '/splash';
      if (authStatus == AuthStatus.unauthenticated) return isAuthRoute ? null : '/login';
      if (authStatus == AuthStatus.authenticated) return isSplash || isAuthRoute ? '/home' : null;
      return null;
    },
  );
});

