// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bottom_sheet_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Tracks whether any bottom sheet is currently open in the app.
/// Used to hide the assistant bar when bottom sheets are displayed.

@ProviderFor(BottomSheetOpen)
final bottomSheetOpenProvider = BottomSheetOpenProvider._();

/// Tracks whether any bottom sheet is currently open in the app.
/// Used to hide the assistant bar when bottom sheets are displayed.
final class BottomSheetOpenProvider
    extends $NotifierProvider<BottomSheetOpen, bool> {
  /// Tracks whether any bottom sheet is currently open in the app.
  /// Used to hide the assistant bar when bottom sheets are displayed.
  BottomSheetOpenProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'bottomSheetOpenProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$bottomSheetOpenHash();

  @$internal
  @override
  BottomSheetOpen create() => BottomSheetOpen();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$bottomSheetOpenHash() => r'e0100b3aa2e130be415cad8706a4de9a582a59d5';

/// Tracks whether any bottom sheet is currently open in the app.
/// Used to hide the assistant bar when bottom sheets are displayed.

abstract class _$BottomSheetOpen extends $Notifier<bool> {
  bool build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<bool, bool>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<bool, bool>,
              bool,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
