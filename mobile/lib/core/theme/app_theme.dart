import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _brandSeedColor = Color(0xFFE53935);

// Typography scale constants
abstract class AppTypography {
  static const double caption = 12;
  static const double bodySmall = 14;
  static const double bodyMedium = 16;
  static const double bodyLarge = 18;
  static const double titleSmall = 20;
  static const double titleMedium = 22;
  static const double titleLarge = 24;
  static const double headlineSmall = 28;
  static const double headlineMedium = 32;
  static const double headlineLarge = 36;
  static const double displaySmall = 40;
  static const double displayMedium = 48;
  static const double displayLarge = 56;
}

// Spacing scale constants
abstract class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 48;
}

// Border radius constants
abstract class AppRadius {
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double full = 999;
}

class VietnameseAccentTokens extends ThemeExtension<VietnameseAccentTokens> {
  const VietnameseAccentTokens({
    required this.accentPrimary,
    required this.accentSecondary,
    required this.toneHigh,
    required this.toneMid,
    required this.toneLow,
    required this.diacriticColor,
    required this.success,
    required this.warning,
    required this.info,
  });

  final Color accentPrimary;
  final Color accentSecondary;
  final Color toneHigh;
  final Color toneMid;
  final Color toneLow;
  final Color diacriticColor;
  final Color success;
  final Color warning;
  final Color info;

  @override
  VietnameseAccentTokens copyWith({
    Color? accentPrimary,
    Color? accentSecondary,
    Color? toneHigh,
    Color? toneMid,
    Color? toneLow,
    Color? diacriticColor,
    Color? success,
    Color? warning,
    Color? info,
  }) {
    return VietnameseAccentTokens(
      accentPrimary: accentPrimary ?? this.accentPrimary,
      accentSecondary: accentSecondary ?? this.accentSecondary,
      toneHigh: toneHigh ?? this.toneHigh,
      toneMid: toneMid ?? this.toneMid,
      toneLow: toneLow ?? this.toneLow,
      diacriticColor: diacriticColor ?? this.diacriticColor,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      info: info ?? this.info,
    );
  }

  @override
  VietnameseAccentTokens lerp(VietnameseAccentTokens? other, double t) {
    if (other is! VietnameseAccentTokens) return this;
    return VietnameseAccentTokens(
      accentPrimary: Color.lerp(accentPrimary, other.accentPrimary, t)!,
      accentSecondary: Color.lerp(accentSecondary, other.accentSecondary, t)!,
      toneHigh: Color.lerp(toneHigh, other.toneHigh, t)!,
      toneMid: Color.lerp(toneMid, other.toneMid, t)!,
      toneLow: Color.lerp(toneLow, other.toneLow, t)!,
      diacriticColor: Color.lerp(diacriticColor, other.diacriticColor, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      info: Color.lerp(info, other.info, t)!,
    );
  }

  static const light = VietnameseAccentTokens(
    accentPrimary: Color(0xFFE53935),
    accentSecondary: Color(0xFFFF8F00),
    toneHigh: Color(0xFFD32F2F),
    toneMid: Color(0xFFF57C00),
    toneLow: Color(0xFF388E3C),
    diacriticColor: Color(0xFF1565C0),
    success: Color(0xFF4CAF50),
    warning: Color(0xFFFF9800),
    info: Color(0xFF2196F3),
  );

  static const dark = VietnameseAccentTokens(
    accentPrimary: Color(0xFFEF5350),
    accentSecondary: Color(0xFFFFB300),
    toneHigh: Color(0xFFEF5350),
    toneMid: Color(0xFFFFA726),
    toneLow: Color(0xFF66BB6A),
    diacriticColor: Color(0xFF42A5F5),
    success: Color(0xFF81C784),
    warning: Color(0xFFFFB74D),
    info: Color(0xFF64B5F6),
  );
}

TextTheme _buildVietnameseTextTheme(TextTheme base) {
  return base.copyWith(
    displayLarge: GoogleFonts.beVietnamPro(textStyle: base.displayLarge),
    displayMedium: GoogleFonts.beVietnamPro(textStyle: base.displayMedium),
    displaySmall: GoogleFonts.beVietnamPro(textStyle: base.displaySmall),
    headlineLarge: GoogleFonts.beVietnamPro(textStyle: base.headlineLarge),
    headlineMedium: GoogleFonts.beVietnamPro(textStyle: base.headlineMedium),
    headlineSmall: GoogleFonts.beVietnamPro(textStyle: base.headlineSmall),
    titleLarge: GoogleFonts.beVietnamPro(textStyle: base.titleLarge),
    titleMedium: GoogleFonts.beVietnamPro(textStyle: base.titleMedium),
    titleSmall: GoogleFonts.beVietnamPro(textStyle: base.titleSmall),
    bodyLarge: GoogleFonts.beVietnamPro(textStyle: base.bodyLarge),
    bodyMedium: GoogleFonts.beVietnamPro(textStyle: base.bodyMedium),
    bodySmall: GoogleFonts.beVietnamPro(textStyle: base.bodySmall),
    labelLarge: GoogleFonts.beVietnamPro(textStyle: base.labelLarge),
    labelMedium: GoogleFonts.beVietnamPro(textStyle: base.labelMedium),
    labelSmall: GoogleFonts.beVietnamPro(textStyle: base.labelSmall),
  );
}

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _brandSeedColor,
      brightness: Brightness.light,
    );
    final textTheme = _buildVietnameseTextTheme(
      ThemeData(colorScheme: colorScheme).textTheme,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,
      extensions: const [VietnameseAccentTokens.light],
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _brandSeedColor,
      brightness: Brightness.dark,
    );
    final textTheme = _buildVietnameseTextTheme(
      ThemeData(colorScheme: colorScheme, brightness: Brightness.dark).textTheme,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,
      extensions: const [VietnameseAccentTokens.dark],
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
    );
  }
}
