import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Placeholder for background handling.
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _localPlugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const initSettings = InitializationSettings(android: androidSettings);
      await _localPlugin.initialize(initSettings);

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      FirebaseMessaging.onMessage.listen((message) async {
        final title = message.notification?.title ?? 'SEHILY';
        final body = message.notification?.body ?? '';
        await _showLocalNotification(title: title, body: body);
      });
    } catch (e) {
      // Keep app runnable even if Firebase is not configured.
      if (kDebugMode) {
        debugPrint('NotificationService init skipped: $e');
      }
    }

    _initialized = true;
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
  }) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'sehily_default_channel',
        'SEHILY Notifications',
        channelDescription: 'Main notification channel for SEHILY mobile app.',
        importance: Importance.high,
        priority: Priority.high,
      ),
    );
    await _localPlugin.show(DateTime.now().millisecond, title, body, details);
  }
}

