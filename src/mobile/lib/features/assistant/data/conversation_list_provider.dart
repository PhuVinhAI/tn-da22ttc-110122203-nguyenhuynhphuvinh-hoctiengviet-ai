import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'ai_api_provider.dart';
import 'conversation_model.dart';

class ConversationListNotifier
    extends AsyncNotifier<List<ConversationSummary>> {
  @override
  Future<List<ConversationSummary>> build() async {
    final api = ref.read(aiApiProvider);
    return api.listConversations();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(aiApiProvider);
      return api.listConversations();
    });
  }

  Future<void> rename(String id, String newTitle) async {
    final api = ref.read(aiApiProvider);
    await api.renameConversation(id, newTitle);
    await refresh();
  }

  Future<void> delete(String id) async {
    final api = ref.read(aiApiProvider);
    await api.deleteConversation(id);
    await refresh();
  }
}

final conversationListProvider = AsyncNotifierProvider<
    ConversationListNotifier, List<ConversationSummary>>(
  ConversationListNotifier.new,
);
