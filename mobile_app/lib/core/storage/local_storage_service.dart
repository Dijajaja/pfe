import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final localStorageServiceProvider = Provider<LocalStorageService>((_) {
  return LocalStorageService();
});

class LocalStorageService {
  static const _notificationReadIdsKey = 'notif_read_ids';
  static const _eligibilityVerifiedKey = 'eligibility_verified';

  Future<void> setEligibilityVerified(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_eligibilityVerifiedKey, value);
  }

  Future<bool> isEligibilityVerified() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_eligibilityVerifiedKey) ?? false;
  }

  Future<void> clearEligibilityVerified() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_eligibilityVerifiedKey);
  }

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

  Future<List<String>> readNotificationReadIds() => getReadNotificationIds();

  Future<void> markAllNotificationsAsRead(List<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_notificationReadIdsKey, jsonEncode(ids));
  }
}

