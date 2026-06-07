import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final localStorageServiceProvider = Provider<LocalStorageService>((_) {
  return LocalStorageService();
});

class LocalStorageService {
  static const _notificationReadIdsKey = 'notif_read_ids';

  Future<void> markNotificationAsRead(String notificationId) async {
    final prefs = await SharedPreferences.getInstance();
    final current = await getReadNotificationIds();
    if (!current.contains(notificationId)) {
      current.add(notificationId);
      await prefs.setString(_notificationReadIdsKey, jsonEncode(current));
    }
  }

  Future<List<String>> getReadNotificationIds() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_notificationReadIdsKey);
    if (raw == null || raw.isEmpty) return [];
    final decoded = jsonDecode(raw);
    if (decoded is List) {
      return decoded.map((e) => e.toString()).toList();
    }
    return [];
  }
}

