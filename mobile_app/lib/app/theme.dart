import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF1B4D4A);
  static const Color secondary = Color(0xFF2E7D72);
  static const Color accent = Color(0xFFC9614A);
  static const Color textSecondary = Color(0xFF3A5552);
  static const Color textMuted = Color(0xFF4D6562);

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      tertiary: accent,
      surface: Colors.white,
      onSurface: primary,
    );

    const textTheme = TextTheme(
      displaySmall: TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 24),
      headlineSmall: TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 20),
      titleLarge: TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 18),
      titleMedium: TextStyle(color: primary, fontWeight: FontWeight.w700, fontSize: 16),
      titleSmall: TextStyle(color: primary, fontWeight: FontWeight.w700, fontSize: 14),
      bodyLarge: TextStyle(color: primary, fontWeight: FontWeight.w500, fontSize: 16, height: 1.4),
      bodyMedium: TextStyle(color: primary, fontWeight: FontWeight.w500, fontSize: 14, height: 1.4),
      bodySmall: TextStyle(color: textSecondary, fontWeight: FontWeight.w500, fontSize: 13, height: 1.35),
      labelLarge: TextStyle(color: primary, fontWeight: FontWeight.w600, fontSize: 14),
      labelMedium: TextStyle(color: textSecondary, fontWeight: FontWeight.w600, fontSize: 12),
      labelSmall: TextStyle(color: textMuted, fontWeight: FontWeight.w600, fontSize: 11),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.white,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Color(0xFF2D7A70),
        foregroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.white),
        actionsIconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 18,
        ),
        surfaceTintColor: Colors.transparent,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: const TextStyle(color: textSecondary, fontWeight: FontWeight.w600, fontSize: 14),
        hintStyle: const TextStyle(color: textMuted, fontWeight: FontWeight.w500, fontSize: 14),
        floatingLabelStyle: const TextStyle(color: primary, fontWeight: FontWeight.w700),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD8D0C8)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD8D0C8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: secondary, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        titleTextStyle: TextStyle(color: primary, fontWeight: FontWeight.w600, fontSize: 15),
        subtitleTextStyle: TextStyle(color: textSecondary, fontWeight: FontWeight.w500, fontSize: 13),
      ),
    );
  }
}
