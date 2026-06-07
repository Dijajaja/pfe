import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app/app.dart';

void main() {
  testWidgets('renders splash shell', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SehilyMobileApp()));
    expect(find.text('SEHILY'), findsOneWidget);
  });
}
