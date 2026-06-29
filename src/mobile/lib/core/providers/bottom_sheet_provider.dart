import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'bottom_sheet_provider.g.dart';

/// Tracks whether any bottom sheet is currently open in the app.
/// Used to hide the assistant bar when bottom sheets are displayed.
@Riverpod(keepAlive: true)
class BottomSheetOpen extends _$BottomSheetOpen {
  @override
  bool build() => false;

  void setOpen(bool isOpen) {
    state = isOpen;
  }
}
