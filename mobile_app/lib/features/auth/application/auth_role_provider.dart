import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Rôle renvoyé par `GET /auth/me/` (ex. ETUDIANT, ADMIN).
final authRoleProvider = StateProvider<String?>((ref) => null);

const studentRole = 'ETUDIANT';

bool isStudentRole(String? role) => role?.toUpperCase() == studentRole;
