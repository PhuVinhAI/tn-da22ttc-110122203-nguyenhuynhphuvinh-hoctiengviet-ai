import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';

final assistantBarEnabledProvider =
    NotifierProvider<AssistantBarEnabledNotifier, bool>(
      AssistantBarEnabledNotifier.new,
    );

class AssistantBarEnabledNotifier extends Notifier<bool> {
  @override
  bool build() {
    final prefsAsync = ref.watch(preferencesProvider);
    return prefsAsync.whenOrNull(data: (prefs) => prefs.assistantBarEnabled) ??
        true;
  }

  Future<void> setEnabled(bool enabled) async {
    state = enabled;
    final prefs = await ref.read(preferencesProvider.future);
    await prefs.setAssistantBarEnabled(enabled);
  }
}
