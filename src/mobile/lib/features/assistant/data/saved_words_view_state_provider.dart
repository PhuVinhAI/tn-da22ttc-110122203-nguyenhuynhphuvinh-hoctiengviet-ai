import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Transient flashcard-deck state owned by `SavedWordsScreen` (which page is
/// the learner viewing, is the card flipped to the back). Lifted to Riverpod
/// so `savedWordsScreenContextBuilder` can expose it to the assistant.
@immutable
class SavedWordsViewState {
  const SavedWordsViewState({
    required this.currentIndex,
    required this.isFlipped,
  });

  final int currentIndex;
  final bool isFlipped;

  SavedWordsViewState copyWith({int? currentIndex, bool? isFlipped}) {
    return SavedWordsViewState(
      currentIndex: currentIndex ?? this.currentIndex,
      isFlipped: isFlipped ?? this.isFlipped,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SavedWordsViewState &&
          currentIndex == other.currentIndex &&
          isFlipped == other.isFlipped;

  @override
  int get hashCode => Object.hash(currentIndex, isFlipped);
}

class SavedWordsViewStateNotifier extends Notifier<SavedWordsViewState> {
  @override
  SavedWordsViewState build() =>
      const SavedWordsViewState(currentIndex: 0, isFlipped: false);

  void setIndex(int index) {
    if (state.currentIndex == index && !state.isFlipped) return;
    state = SavedWordsViewState(currentIndex: index, isFlipped: false);
  }

  void setFlipped(bool flipped) {
    if (state.isFlipped == flipped) return;
    state = state.copyWith(isFlipped: flipped);
  }

  void reset() {
    state = const SavedWordsViewState(currentIndex: 0, isFlipped: false);
  }
}

final savedWordsViewStateProvider =
    NotifierProvider<SavedWordsViewStateNotifier, SavedWordsViewState>(
      SavedWordsViewStateNotifier.new,
    );
