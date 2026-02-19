import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:frontend/main.dart';

void main() {
  testWidgets('App bar displays AgentHQ title', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.text('AgentHQ'), findsOneWidget);
  });
}
