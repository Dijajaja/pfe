import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app/app.dart';
import 'package:mobile_app/features/auth/application/auth_controller.dart';

void main() {
  testWidgets('renders public landing', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith((ref) => _UnauthController(ref)),
        ],
        child: const SehilyMobileApp(),
      ),
    );
    await tester.pump();
    expect(find.text('SEHILY'), findsOneWidget);
  });
}

class _UnauthController extends AuthController {
  _UnauthController(super.ref);

  @override
  Future<void> bootstrap() async {
    state = AuthStatus.unauthenticated;
  }
}
