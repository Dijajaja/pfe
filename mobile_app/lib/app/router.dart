import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_controller.dart';
import '../features/auth/application/auth_role_provider.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/auth/presentation/reset_password_page.dart';
import '../features/public/application/eligibility_provider.dart';
import '../features/public/presentation/eligibilite_page.dart';
import '../features/public/presentation/public_landing_page.dart';
import '../features/student/presentation/attestation/student_attestation_page.dart';
import '../features/student/presentation/dashboard/student_dashboard_page.dart';
import '../features/student/presentation/dossier/student_dossier_page.dart';
import '../features/student/presentation/messages/student_messages_page.dart';
import '../features/student/presentation/notifications/student_notifications_page.dart';
import '../features/student/presentation/paiements/student_paiements_page.dart';
import '../features/student/presentation/profile/student_profile_page.dart';
import '../features/student/presentation/reclamations/student_reclamations_page.dart';
import '../features/student/presentation/shell/student_shell.dart';
import '../features/student/presentation/suivi/student_suivi_page.dart';

const _publicPaths = {'/', '/eligibilite'};
const _authPaths = {'/login', '/register', '/reset-password'};

final routerRefreshProvider = Provider<RouterRefresh>((ref) {
  final refresh = RouterRefresh();
  ref.listen(authControllerProvider, (_, __) => refresh.notify());
  ref.listen(authRoleProvider, (_, __) => refresh.notify());
  ref.listen(eligibilityGateProvider, (_, __) => refresh.notify());
  ref.onDispose(refresh.dispose);
  return refresh;
});

class RouterRefresh extends ChangeNotifier {
  void notify() => notifyListeners();
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(routerRefreshProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    routes: [
      GoRoute(path: '/', builder: (_, __) => const PublicLandingPage()),
      GoRoute(path: '/eligibilite', builder: (_, __) => const EligibilitePage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/reset-password', builder: (_, __) => const ResetPasswordPage()),
      ShellRoute(
        builder: (context, state, child) => StudentShell(child: child),
        routes: [
          GoRoute(path: '/student/dashboard', builder: (_, __) => const StudentDashboardPage()),
          GoRoute(path: '/student/dossier', builder: (_, __) => const StudentDossierPage()),
          GoRoute(path: '/student/suivi', builder: (_, __) => const StudentSuiviPage()),
          GoRoute(path: '/student/paiements', builder: (_, __) => const StudentPaiementsPage()),
          GoRoute(path: '/student/profil', builder: (_, __) => const StudentProfilePage()),
          GoRoute(path: '/student/reclamations', builder: (_, __) => const StudentReclamationsPage()),
          GoRoute(path: '/student/attestation', builder: (_, __) => const StudentAttestationPage()),
          GoRoute(path: '/student/notifications', builder: (_, __) => const StudentNotificationsPage()),
          GoRoute(path: '/student/messages', builder: (_, __) => const StudentMessagesPage()),
        ],
      ),
    ],
    redirect: (context, state) {
      final authStatus = ref.read(authControllerProvider);
      final role = ref.read(authRoleProvider);
      final eligibility = ref.read(eligibilityGateProvider);
      final path = state.fullPath ?? state.uri.path;
      final isPublic = _publicPaths.contains(path);
      final isAuthRoute = _authPaths.contains(path);
      final isStudentRoute = path.startsWith('/student');

      if (authStatus == AuthStatus.unknown) {
        return isPublic || isAuthRoute ? null : '/';
      }

      if (authStatus == AuthStatus.unauthenticated) {
        if (path == '/register' && eligibility.loaded && !eligibility.verified) {
          return '/eligibilite';
        }
        if (isPublic || isAuthRoute) return null;
        return '/';
      }

      if (authStatus == AuthStatus.authenticated) {
        if (!isStudentRole(role)) {
          return '/login';
        }
        if (isPublic || isAuthRoute) return '/student/dashboard';
        if (path == '/home') return '/student/dashboard';
        if (!isStudentRoute) return '/student/dashboard';
      }

      return null;
    },
  );
});
